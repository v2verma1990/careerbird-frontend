"""
Skill Gap Analysis Service
Analyzes skill gaps between candidates and job requirements
"""

import logging
import json
from typing import Dict, Any
from datetime import datetime
from utils.openai_utils import call_openai_with_cache, create_skill_gap_prompt

logger = logging.getLogger(__name__)

class SkillGapService:
    def __init__(self, db_service, cache_service):
        self.db = db_service
        self.cache_service = cache_service
    
    async def analyze_skill_gaps(
        self,
        resume_id: str,
        job_description_id: str,
        user_id: str,
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Analyze skill gaps between resume and job requirements
        
        Args:
            resume_id: Resume identifier
            job_description_id: Job description identifier
            user_id: User identifier
            plan_type: Subscription plan
            
        Returns:
            Skill gap analysis with recommendations
        """
        try:
            logger.info(f"Analyzing skill gaps for resume {resume_id}")
            
            # Get resume data
            resume_data = await self._get_resume_data(resume_id)
            if not resume_data:
                raise Exception("Resume not found")
            
            # Get job description
            job_description = await self._get_job_description(job_description_id)
            if not job_description:
                raise Exception("Job description not found")
            
            # Generate AI skill gap analysis
            skill_gap_analysis = await self._generate_skill_gap_analysis(
                resume_data, job_description, plan_type
            )
            
            # Combine results
            analysis_result = {
                "resume_id": resume_id,
                "job_description_id": job_description_id,
                "user_id": user_id,
                **skill_gap_analysis,
                "analysis_date": str(datetime.utcnow()),
                "plan_type": plan_type
            }
            
            # Store analysis
            analysis_id = await self._store_skill_gap_analysis(analysis_result)
            analysis_result["analysis_id"] = analysis_id
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing skill gaps: {str(e)}")
            raise Exception(f"Failed to analyze skill gaps: {str(e)}")
    
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
            if isinstance(extracted_data, str):
                try:
                    extracted_data = json.loads(extracted_data)
                except json.JSONDecodeError:
                    extracted_data = {}
            
            return {
                "file_name": result["file_name"],
                "full_text": result["parsed_text"] or "",
                **extracted_data
            }
            
        except Exception as e:
            logger.error(f"Error getting resume data: {str(e)}")
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
    
    async def _generate_skill_gap_analysis(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate AI-powered skill gap analysis"""
        try:
            # Create skill gap prompt
            prompt = create_skill_gap_prompt(resume_data, job_description, plan_type)
            
            # Call OpenAI with caching
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.1,  # Low temperature for consistent analysis
                max_tokens=1500,
                cache_service=self.cache_service,
                cache_type="skill_gap",
                cache_ttl_hours=24
            )
            
            # Parse JSON response
            try:
                skill_gap_data = json.loads(response)
            except json.JSONDecodeError:
                skill_gap_data = self._parse_skill_gap_fallback(response, resume_data, job_description)
            
            # Validate and enhance analysis
            skill_gap_data = self._validate_skill_gap_data(skill_gap_data, plan_type)
            
            # Add metadata
            skill_gap_data.update({
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "analysis_cost": cost
            })
            
            return skill_gap_data
            
        except Exception as e:
            logger.error(f"Error generating skill gap analysis: {str(e)}")
            return self._get_default_skill_gap_analysis()
    
    def _parse_skill_gap_fallback(self, response: str, resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Fallback parsing when JSON parsing fails"""
        logger.warning("Skill gap JSON parsing failed, using fallback")
        
        # Extract basic information
        candidate_skills = set(resume_data.get("skills", []))
        
        # Simple keyword matching for job requirements
        job_keywords = self._extract_job_keywords(job_description)
        
        # Find missing skills
        missing_skills = []
        for keyword in job_keywords:
            if not any(keyword.lower() in skill.lower() for skill in candidate_skills):
                missing_skills.append(keyword)
        
        return {
            "critical_missing_skills": missing_skills[:5],  # Top 5
            "nice_to_have_missing_skills": missing_skills[5:10],  # Next 5
            "skill_development_recommendations": [
                f"Learn {skill}" for skill in missing_skills[:3]
            ],
            "learning_resources": [
                "Online courses",
                "Professional certifications",
                "Hands-on projects"
            ],
            "timeline_for_acquisition": "3-6 months for basic proficiency",
            "ai_insights": response[:500] if response else "Basic skill gap analysis completed"
        }
    
    def _extract_job_keywords(self, job_description: str) -> list:
        """Extract potential skill keywords from job description"""
        # Common technical skills and keywords
        common_skills = [
            "Python", "Java", "JavaScript", "React", "Angular", "Node.js",
            "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes",
            "Git", "CI/CD", "DevOps", "Agile", "Scrum",
            "Machine Learning", "AI", "Data Science", "Analytics",
            "REST", "API", "Microservices", "Cloud", "Linux"
        ]
        
        found_skills = []
        job_lower = job_description.lower()
        
        for skill in common_skills:
            if skill.lower() in job_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _validate_skill_gap_data(self, data: Dict[str, Any], plan_type: str) -> Dict[str, Any]:
        """Validate and clean skill gap data"""
        
        # Ensure required fields exist
        defaults = {
            "critical_missing_skills": [],
            "nice_to_have_missing_skills": [],
            "skill_development_recommendations": [],
            "learning_resources": [],
            "timeline_for_acquisition": "Not specified"
        }
        
        for key, default_value in defaults.items():
            if key not in data:
                data[key] = default_value
        
        # Ensure arrays are arrays
        array_fields = [
            "critical_missing_skills", "nice_to_have_missing_skills",
            "skill_development_recommendations", "learning_resources"
        ]
        
        for field in array_fields:
            if field in data and not isinstance(data[field], list):
                data[field] = []
        
        # Clean string fields
        if "timeline_for_acquisition" in data and not isinstance(data["timeline_for_acquisition"], str):
            data["timeline_for_acquisition"] = str(data["timeline_for_acquisition"])
        
        # Plan-specific enhancements
        if plan_type == "premium":
            premium_fields = {
                "certification_recommendations": [],
                "project_suggestions": [],
                "mentorship_opportunities": [],
                "career_path_mapping": ""
            }
            
            for field, default in premium_fields.items():
                if field not in data:
                    data[field] = default
        
        return data
    
    def _get_default_skill_gap_analysis(self) -> Dict[str, Any]:
        """Get default skill gap analysis structure"""
        return {
            "critical_missing_skills": [],
            "nice_to_have_missing_skills": [],
            "skill_development_recommendations": [],
            "learning_resources": [],
            "timeline_for_acquisition": "Analysis could not be completed",
            "ai_insights": "Skill gap analysis failed"
        }
    
    async def _store_skill_gap_analysis(self, analysis_data: Dict[str, Any]) -> str:
        """Store skill gap analysis in database"""
        try:
            query = """
                INSERT INTO skill_gap_analysis (
                    user_id, job_description_id, resume_id,
                    critical_missing_skills, nice_to_have_missing_skills,
                    skill_development_recommendations, learning_resources,
                    timeline_for_acquisition, analysis_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            metadata = {
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
                    analysis_data.get("critical_missing_skills", []),
                    analysis_data.get("nice_to_have_missing_skills", []),
                    analysis_data.get("skill_development_recommendations", []),
                    analysis_data.get("learning_resources", []),
                    analysis_data.get("timeline_for_acquisition", ""),
                    json.dumps(metadata)
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing skill gap analysis: {str(e)}")
            return None