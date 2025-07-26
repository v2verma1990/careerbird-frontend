"""
Resume Analysis Service
Handles AI-powered resume analysis against job descriptions
"""

import logging
import json
from typing import Dict, Any, List
from datetime import datetime
from utils.openai_utils import call_openai_with_cache, create_analysis_prompt

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self, db_service, cache_service, vector_service):
        self.db = db_service
        self.cache_service = cache_service
        self.vector_service = vector_service
    
    async def analyze_resume(
        self,
        resume_id: str,
        job_description_id: str,
        user_id: str,
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Analyze resume against job description using AI
        
        Args:
            resume_id: Resume identifier
            job_description_id: Job description identifier
            user_id: User identifier
            plan_type: Subscription plan
            
        Returns:
            Analysis results with scores and recommendations
        """
        try:
            logger.info(f"Analyzing resume {resume_id} against job {job_description_id}")
            
            # Get resume data
            resume_data = await self._get_resume_data(resume_id)
            if not resume_data:
                raise Exception("Resume not found")
            
            # Get job description
            job_description = await self._get_job_description(job_description_id)
            if not job_description:
                raise Exception("Job description not found")
            
            # Calculate vector similarity score
            similarity_score = await self.vector_service.calculate_similarity_score(
                resume_id, job_description_id, plan_type
            )
            
            # Generate AI analysis
            ai_analysis = await self._generate_ai_analysis(
                resume_data, job_description, plan_type
            )
            
            # Combine results
            analysis_result = {
                "resume_id": resume_id,
                "job_description_id": job_description_id,
                "user_id": user_id,
                "vector_similarity": similarity_score,
                **ai_analysis,
                "analysis_date": str(datetime.utcnow()),
                "plan_type": plan_type
            }
            
            # Store analysis in database
            analysis_id = await self._store_analysis(analysis_result)
            analysis_result["analysis_id"] = analysis_id
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing resume: {str(e)}")
            raise Exception(f"Failed to analyze resume: {str(e)}")
    
    async def _get_resume_data(self, resume_id: str) -> Dict[str, Any]:
        """Get resume data from database"""
        try:
            query = """
                SELECT file_name, parsed_text, extracted_data
                FROM resumes 
                WHERE id = %s
            """
            
            result = await self.db.fetch_one(query, (resume_id,))
            
            if not result:
                return None
            
            # Parse extracted data
            extracted_data = result["extracted_data"] if result["extracted_data"] else {}
            
            return {
                "file_name": result["file_name"],
                "full_text": result["parsed_text"] or "",
                **extracted_data
            }
            
        except Exception as e:
            logger.error(f"Error getting resume data: {str(e)}")
            return None
    
    async def _get_job_description(self, job_description_id: str) -> str:
        """Get job description text from database"""
        try:
            query = """
                SELECT title, description, requirements
                FROM job_descriptions 
                WHERE id = %s
            """
            
            result = await self.db.fetch_one(query, (job_description_id,))
            
            if not result:
                return None
            
            # Combine all job description fields
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
    
    async def _generate_ai_analysis(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate AI-powered analysis using OpenAI"""
        try:
            # Create analysis prompt
            prompt = create_analysis_prompt(resume_data, job_description, plan_type)
            
            # Call OpenAI with caching
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.1,  # Low temperature for consistent analysis
                max_tokens=1500,
                cache_service=self.cache_service,
                cache_type="analysis",
                cache_ttl_hours=24
            )
            
            # Parse JSON response
            try:
                analysis_data = json.loads(response)
            except json.JSONDecodeError:
                # Fallback parsing
                analysis_data = self._parse_analysis_fallback(response)
            
            # Validate and enhance analysis
            analysis_data = self._validate_analysis_data(analysis_data, plan_type)
            
            # Add metadata
            analysis_data.update({
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "analysis_cost": cost
            })
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Error generating AI analysis: {str(e)}")
            # Return basic analysis structure
            return self._get_default_analysis()
    
    def _parse_analysis_fallback(self, response: str) -> Dict[str, Any]:
        """Fallback parsing when JSON parsing fails"""
        logger.warning("Analysis JSON parsing failed, using fallback")
        
        # Try to extract scores using regex
        import re
        
        result = self._get_default_analysis()
        
        # Extract scores
        score_patterns = {
            "match_score": r"match[_\s]*score[:\s]*(\d+)",
            "skill_match_score": r"skill[_\s]*match[_\s]*score[:\s]*(\d+)",
            "experience_score": r"experience[_\s]*score[:\s]*(\d+)",
            "education_score": r"education[_\s]*score[:\s]*(\d+)",
            "ats_compliance_score": r"ats[_\s]*compliance[_\s]*score[:\s]*(\d+)"
        }
        
        for field, pattern in score_patterns.items():
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                try:
                    result[field] = min(100, max(0, int(match.group(1))))
                except ValueError:
                    pass
        
        # Extract summary if available
        summary_match = re.search(r"summary[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)", response, re.IGNORECASE | re.DOTALL)
        if summary_match:
            result["ai_summary"] = summary_match.group(1).strip()
        
        return result
    
    def _validate_analysis_data(self, data: Dict[str, Any], plan_type: str) -> Dict[str, Any]:
        """Validate and clean analysis data"""
        
        # Ensure required fields exist with defaults
        defaults = self._get_default_analysis()
        
        for key, default_value in defaults.items():
            if key not in data:
                data[key] = default_value
        
        # Validate score ranges (0-100)
        score_fields = [
            "match_score", "skill_match_score", "experience_score",
            "education_score", "ats_compliance_score"
        ]
        
        for field in score_fields:
            if field in data:
                try:
                    score = float(data[field])
                    data[field] = min(100.0, max(0.0, score))
                except (ValueError, TypeError):
                    data[field] = 0.0
        
        # Ensure arrays are arrays
        array_fields = ["missing_skills", "matching_skills", "strengths", "weaknesses", "recommendations"]
        for field in array_fields:
            if field in data and not isinstance(data[field], list):
                data[field] = []
        
        # Clean string fields
        string_fields = ["ai_summary", "ai_feedback"]
        for field in string_fields:
            if field in data and isinstance(data[field], str):
                data[field] = data[field].strip()
        
        # Plan-specific enhancements
        if plan_type == "premium":
            # Add premium-specific fields if missing
            premium_fields = {
                "skill_gap_analysis": "",
                "career_progression": "",
                "cultural_fit": 0.0,
                "interview_questions": [],
                "salary_recommendation": ""
            }
            
            for field, default in premium_fields.items():
                if field not in data:
                    data[field] = default
        
        return data
    
    def _get_default_analysis(self) -> Dict[str, Any]:
        """Get default analysis structure"""
        return {
            "match_score": 0.0,
            "skill_match_score": 0.0,
            "experience_score": 0.0,
            "education_score": 0.0,
            "ats_compliance_score": 0.0,
            "missing_skills": [],
            "matching_skills": [],
            "ai_summary": "Analysis could not be completed",
            "ai_feedback": "",
            "strengths": [],
            "weaknesses": [],
            "recommendations": []
        }
    
    async def _store_analysis(self, analysis_data: Dict[str, Any]) -> str:
        """Store analysis results in database"""
        try:
            query = """
                INSERT INTO resume_analysis (
                    user_id, job_description_id, resume_id,
                    match_score, skill_match_score, experience_score,
                    education_score, ats_compliance_score,
                    missing_skills, matching_skills, ai_summary,
                    ai_feedback, strengths, weaknesses, recommendations,
                    analysis_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            metadata = {
                "vector_similarity": analysis_data.get("vector_similarity", 0.0),
                "ai_model_used": analysis_data.get("ai_model_used", "gpt-3.5-turbo"),
                "tokens_used": analysis_data.get("tokens_used", 0),
                "analysis_cost": analysis_data.get("analysis_cost", 0.0),
                "plan_type": analysis_data.get("plan_type", "free")
            }
            
            result = await self.db.fetch_one(
                query,
                (
                    analysis_data["user_id"],
                    analysis_data["job_description_id"],
                    analysis_data["resume_id"],
                    analysis_data["match_score"],
                    analysis_data["skill_match_score"],
                    analysis_data["experience_score"],
                    analysis_data["education_score"],
                    analysis_data["ats_compliance_score"],
                    analysis_data["missing_skills"],
                    analysis_data["matching_skills"],
                    analysis_data["ai_summary"],
                    analysis_data.get("ai_feedback", ""),
                    analysis_data["strengths"],
                    analysis_data["weaknesses"],
                    analysis_data["recommendations"],
                    json.dumps(metadata)
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing analysis: {str(e)}")
            return None