"""
Candidate Comparison Service
Handles AI-powered candidate comparison and ranking
"""

import logging
import json
from typing import Dict, Any, List
from datetime import datetime
from utils.openai_utils import call_openai_with_cache, create_comparison_prompt

logger = logging.getLogger(__name__)

class ComparisonService:
    def __init__(self, db_service, cache_service, vector_service):
        self.db = db_service
        self.cache_service = cache_service
        self.vector_service = vector_service
    
    async def compare_candidates(
        self,
        resume_ids: List[str],
        job_description_id: str,
        user_id: str,
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Compare multiple candidates and provide ranking
        
        Args:
            resume_ids: List of resume IDs to compare
            job_description_id: Job description ID
            user_id: User ID
            plan_type: Subscription plan
            
        Returns:
            Comparison results with ranking and insights
        """
        try:
            logger.info(f"Comparing {len(resume_ids)} candidates for job {job_description_id}")
            
            # Get candidates data
            candidates_data = []
            for resume_id in resume_ids:
                candidate_data = await self._get_candidate_data(resume_id)
                if candidate_data:
                    candidates_data.append(candidate_data)
            
            if not candidates_data:
                raise Exception("No valid candidates found")
            
            # Get job description
            job_description = await self._get_job_description(job_description_id)
            if not job_description:
                raise Exception("Job description not found")
            
            # Calculate vector similarities
            similarity_scores = {}
            for resume_id in resume_ids:
                similarity = await self.vector_service.calculate_similarity_score(
                    resume_id, job_description_id, plan_type
                )
                similarity_scores[resume_id] = similarity
            
            # Generate AI comparison
            ai_comparison = await self._generate_ai_comparison(
                candidates_data, job_description, plan_type
            )
            
            # Create final comparison result
            comparison_result = {
                "job_description_id": job_description_id,
                "user_id": user_id,
                "candidates_count": len(candidates_data),
                "similarity_scores": similarity_scores,
                **ai_comparison,
                "comparison_date": str(datetime.utcnow()),
                "plan_type": plan_type
            }
            
            # Store comparison result
            comparison_id = await self._store_comparison(comparison_result)
            comparison_result["comparison_id"] = comparison_id
            
            return comparison_result
            
        except Exception as e:
            logger.error(f"Error comparing candidates: {str(e)}")
            raise Exception(f"Failed to compare candidates: {str(e)}")
    
    async def _get_candidate_data(self, resume_id: str) -> Dict[str, Any]:
        """Get candidate data for comparison"""
        try:
            query = """
                SELECT r.file_name, r.extracted_data, ra.match_score,
                       ra.skill_match_score, ra.experience_score, ra.education_score
                FROM resumes r
                LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
                WHERE r.id = %s
            """
            
            result = await self.db.fetch_one(query, (resume_id,))
            
            if not result:
                return None
            
            # Parse extracted data
            extracted_data = result["extracted_data"] if result["extracted_data"] else {}
            if isinstance(extracted_data, str):
                try:
                    extracted_data = json.loads(extracted_data)
                except json.JSONDecodeError:
                    extracted_data = {}
            
            return {
                "resume_id": resume_id,
                "file_name": result["file_name"],
                "match_score": result["match_score"] or 0,
                "skill_match_score": result["skill_match_score"] or 0,
                "experience_score": result["experience_score"] or 0,
                "education_score": result["education_score"] or 0,
                **extracted_data
            }
            
        except Exception as e:
            logger.error(f"Error getting candidate data: {str(e)}")
            return None
    
    async def _get_job_description(self, job_description_id: str) -> str:
        """Get job description text"""
        try:
            query = """
                SELECT title, description, requirements
                FROM job_descriptions 
                WHERE id = %s
            """
            
            result = await self.db.fetch_one(query, (job_description_id,))
            
            if not result:
                return None
            
            job_text = f"""
            Job Title: {result['title']}
            
            Job Description:
            {result['description']}
            
            Requirements:
            {result['requirements'] or 'Not specified'}
            """
            
            return job_text.strip()
            
        except Exception as e:
            logger.error(f"Error getting job description: {str(e)}")
            return None
    
    async def _generate_ai_comparison(
        self,
        candidates_data: List[Dict[str, Any]],
        job_description: str,
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate AI-powered candidate comparison"""
        try:
            # Create comparison prompt
            prompt = create_comparison_prompt(candidates_data, job_description, plan_type)
            
            # Call OpenAI with caching
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.2,  # Slightly higher for more varied comparisons
                max_tokens=2000,
                cache_service=self.cache_service,
                cache_type="comparison",
                cache_ttl_hours=12
            )
            
            # Parse JSON response
            try:
                comparison_data = json.loads(response)
            except json.JSONDecodeError:
                comparison_data = self._parse_comparison_fallback(response, candidates_data)
            
            # Validate and enhance comparison
            comparison_data = self._validate_comparison_data(comparison_data, candidates_data, plan_type)
            
            # Add metadata
            comparison_data.update({
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "comparison_cost": cost
            })
            
            return comparison_data
            
        except Exception as e:
            logger.error(f"Error generating AI comparison: {str(e)}")
            return self._get_default_comparison(candidates_data)
    
    def _parse_comparison_fallback(self, response: str, candidates_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback parsing when JSON parsing fails"""
        logger.warning("Comparison JSON parsing failed, using fallback")
        
        # Create basic ranking based on match scores
        ranking = []
        for i, candidate in enumerate(candidates_data):
            ranking.append({
                "rank": i + 1,
                "resume_id": candidate["resume_id"],
                "candidate_name": candidate.get("name", f"Candidate {i + 1}"),
                "overall_score": candidate.get("match_score", 0),
                "reason": "Based on initial match score"
            })
        
        # Sort by match score
        ranking.sort(key=lambda x: x["overall_score"], reverse=True)
        
        # Update ranks
        for i, candidate in enumerate(ranking):
            candidate["rank"] = i + 1
        
        return {
            "ranking": ranking,
            "comparison_matrix": [],
            "key_differentiators": ["Match scores vary significantly"],
            "hiring_recommendations": ["Consider top-ranked candidates for interviews"],
            "ai_insights": response[:500] if response else "Basic comparison completed"
        }
    
    def _validate_comparison_data(self, data: Dict[str, Any], candidates_data: List[Dict[str, Any]], plan_type: str) -> Dict[str, Any]:
        """Validate and clean comparison data"""
        
        # Ensure required fields exist
        if "ranking" not in data:
            data["ranking"] = []
        
        if "comparison_matrix" not in data:
            data["comparison_matrix"] = []
        
        if "key_differentiators" not in data:
            data["key_differentiators"] = []
        
        if "hiring_recommendations" not in data:
            data["hiring_recommendations"] = []
        
        # Validate ranking structure
        if not isinstance(data["ranking"], list):
            data["ranking"] = []
        
        # Ensure all candidates are in ranking
        if len(data["ranking"]) != len(candidates_data):
            # Create basic ranking
            data["ranking"] = []
            for i, candidate in enumerate(candidates_data):
                data["ranking"].append({
                    "rank": i + 1,
                    "resume_id": candidate["resume_id"],
                    "candidate_name": candidate.get("name", f"Candidate {i + 1}"),
                    "overall_score": candidate.get("match_score", 0),
                    "reason": "Auto-generated ranking"
                })
        
        # Plan-specific enhancements
        if plan_type == "premium":
            premium_fields = {
                "swot_analysis": [],
                "team_fit_assessment": [],
                "growth_potential": [],
                "risk_assessment": []
            }
            
            for field, default in premium_fields.items():
                if field not in data:
                    data[field] = default
        
        return data
    
    def _get_default_comparison(self, candidates_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get default comparison structure"""
        ranking = []
        for i, candidate in enumerate(candidates_data):
            ranking.append({
                "rank": i + 1,
                "resume_id": candidate["resume_id"],
                "candidate_name": candidate.get("name", f"Candidate {i + 1}"),
                "overall_score": candidate.get("match_score", 0),
                "reason": "Default ranking"
            })
        
        return {
            "ranking": ranking,
            "comparison_matrix": [],
            "key_differentiators": [],
            "hiring_recommendations": [],
            "ai_insights": "Comparison could not be completed"
        }
    
    async def _store_comparison(self, comparison_data: Dict[str, Any]) -> str:
        """Store comparison results in database"""
        try:
            query = """
                INSERT INTO candidate_comparisons (
                    user_id, job_description_id, resume_ids,
                    comparison_result, ranking, ai_insights, comparison_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            resume_ids = [candidate["resume_id"] for candidate in comparison_data.get("ranking", [])]
            
            metadata = {
                "candidates_count": comparison_data.get("candidates_count", 0),
                "similarity_scores": comparison_data.get("similarity_scores", {}),
                "ai_model_used": comparison_data.get("ai_model_used", "gpt-3.5-turbo"),
                "tokens_used": comparison_data.get("tokens_used", 0),
                "comparison_cost": comparison_data.get("comparison_cost", 0.0),
                "plan_type": comparison_data.get("plan_type", "free")
            }
            
            result = await self.db.fetch_one(
                query,
                (
                    comparison_data["user_id"],
                    comparison_data["job_description_id"],
                    resume_ids,
                    json.dumps({
                        "comparison_matrix": comparison_data.get("comparison_matrix", []),
                        "key_differentiators": comparison_data.get("key_differentiators", []),
                        "hiring_recommendations": comparison_data.get("hiring_recommendations", [])
                    }),
                    json.dumps(comparison_data.get("ranking", [])),
                    comparison_data.get("ai_insights", ""),
                    json.dumps(metadata)
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing comparison: {str(e)}")
            return None