"""
Database Service for Recruiter AI
Handles all database operations with Supabase PostgreSQL
"""

import os
import logging
import asyncpg
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.pool = None
        self.connection_string = self._build_connection_string()
    
    def _build_connection_string(self) -> str:
        """Build PostgreSQL connection string from environment variables"""
        
        # Supabase connection details
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        
        if supabase_url and supabase_key:
            # Extract database details from Supabase URL
            # Format: https://xxx.supabase.co
            project_id = supabase_url.replace("https://", "").replace(".supabase.co", "")
            
            return f"postgresql://postgres:{supabase_key}@db.{project_id}.supabase.co:5432/postgres"
        
        # Fallback to direct PostgreSQL connection
        return os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/careerbird"
        )
    
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
            raise
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def fetch_one(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Execute query and fetch one result"""
        try:
            async with self.pool.acquire() as connection:
                result = await connection.fetchrow(query, *params)
                return dict(result) if result else None
                
        except Exception as e:
            logger.error(f"Database fetch_one error: {str(e)}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    async def fetch_all(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute query and fetch all results"""
        try:
            async with self.pool.acquire() as connection:
                results = await connection.fetch(query, *params)
                return [dict(row) for row in results]
                
        except Exception as e:
            logger.error(f"Database fetch_all error: {str(e)}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    async def execute(self, query: str, params: tuple = ()) -> bool:
        """Execute query without returning results"""
        try:
            async with self.pool.acquire() as connection:
                await connection.execute(query, *params)
                return True
                
        except Exception as e:
            logger.error(f"Database execute error: {str(e)}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    async def store_resume(
        self,
        user_id: str,
        job_description_id: Optional[str],
        file_name: str,
        parsed_data: Dict[str, Any],
        plan_type: str
    ) -> str:
        """Store parsed resume data in database"""
        try:
            query = """
                INSERT INTO resumes (
                    user_id, job_description_id, file_name, file_path,
                    parsed_text, extracted_data, processing_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            """
            
            # Generate file path (in production, this would be cloud storage)
            file_path = f"/resumes/{user_id}/{file_name}"
            
            result = await self.fetch_one(
                query,
                (
                    user_id,
                    job_description_id,
                    file_name,
                    file_path,
                    parsed_data.get("full_text", ""),
                    json.dumps(parsed_data),
                    "completed"
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing resume: {str(e)}")
            raise
    
    async def get_resume_data(self, resume_id: str) -> Optional[Dict[str, Any]]:
        """Get resume data by ID"""
        try:
            query = """
                SELECT id, user_id, job_description_id, file_name, 
                       parsed_text, extracted_data, created_at
                FROM resumes 
                WHERE id = $1
            """
            
            result = await self.fetch_one(query, (resume_id,))
            
            if result and result["extracted_data"]:
                # Parse JSON data
                try:
                    result["extracted_data"] = json.loads(result["extracted_data"])
                except json.JSONDecodeError:
                    result["extracted_data"] = {}
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting resume data: {str(e)}")
            return None
    
    async def get_job_description(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job description by ID"""
        try:
            query = """
                SELECT id, user_id, title, description, requirements,
                       company_name, location, created_at
                FROM job_descriptions 
                WHERE id = $1
            """
            
            return await self.fetch_one(query, (job_id,))
            
        except Exception as e:
            logger.error(f"Error getting job description: {str(e)}")
            return None
    
    async def store_analysis_result(self, analysis_data: Dict[str, Any]) -> str:
        """Store resume analysis results"""
        try:
            query = """
                INSERT INTO resume_analysis (
                    user_id, job_description_id, resume_id,
                    match_score, skill_match_score, experience_score,
                    education_score, ats_compliance_score,
                    missing_skills, matching_skills, ai_summary,
                    ai_feedback, strengths, weaknesses, recommendations,
                    analysis_metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING id
            """
            
            result = await self.fetch_one(
                query,
                (
                    analysis_data["user_id"],
                    analysis_data["job_description_id"],
                    analysis_data["resume_id"],
                    analysis_data.get("match_score", 0),
                    analysis_data.get("skill_match_score", 0),
                    analysis_data.get("experience_score", 0),
                    analysis_data.get("education_score", 0),
                    analysis_data.get("ats_compliance_score", 0),
                    analysis_data.get("missing_skills", []),
                    analysis_data.get("matching_skills", []),
                    analysis_data.get("ai_summary", ""),
                    analysis_data.get("ai_feedback", ""),
                    analysis_data.get("strengths", []),
                    analysis_data.get("weaknesses", []),
                    analysis_data.get("recommendations", []),
                    json.dumps(analysis_data.get("metadata", {}))
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing analysis result: {str(e)}")
            raise
    
    async def get_user_resumes(self, user_id: str, job_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all resumes for a user, optionally filtered by job"""
        try:
            if job_id:
                query = """
                    SELECT id, file_name, extracted_data, created_at
                    FROM resumes 
                    WHERE user_id = $1 AND job_description_id = $2
                    ORDER BY created_at DESC
                """
                params = (user_id, job_id)
            else:
                query = """
                    SELECT id, file_name, extracted_data, created_at
                    FROM resumes 
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                """
                params = (user_id,)
            
            results = await self.fetch_all(query, params)
            
            # Parse JSON data
            for result in results:
                if result["extracted_data"]:
                    try:
                        result["extracted_data"] = json.loads(result["extracted_data"])
                    except json.JSONDecodeError:
                        result["extracted_data"] = {}
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting user resumes: {str(e)}")
            return []
    
    async def get_analysis_results(self, user_id: str, job_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get analysis results for a user"""
        try:
            if job_id:
                query = """
                    SELECT ra.*, r.file_name, jd.title as job_title
                    FROM resume_analysis ra
                    JOIN resumes r ON ra.resume_id = r.id
                    JOIN job_descriptions jd ON ra.job_description_id = jd.id
                    WHERE ra.user_id = $1 AND ra.job_description_id = $2
                    ORDER BY ra.created_at DESC
                """
                params = (user_id, job_id)
            else:
                query = """
                    SELECT ra.*, r.file_name, jd.title as job_title
                    FROM resume_analysis ra
                    JOIN resumes r ON ra.resume_id = r.id
                    JOIN job_descriptions jd ON ra.job_description_id = jd.id
                    WHERE ra.user_id = $1
                    ORDER BY ra.created_at DESC
                """
                params = (user_id,)
            
            results = await self.fetch_all(query, params)
            
            # Parse JSON metadata
            for result in results:
                if result["analysis_metadata"]:
                    try:
                        result["analysis_metadata"] = json.loads(result["analysis_metadata"])
                    except json.JSONDecodeError:
                        result["analysis_metadata"] = {}
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting analysis results: {str(e)}")
            return []
    
    async def store_comparison_result(self, comparison_data: Dict[str, Any]) -> str:
        """Store candidate comparison results"""
        try:
            query = """
                INSERT INTO candidate_comparisons (
                    user_id, job_description_id, resume_ids,
                    comparison_result, ranking, ai_insights
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            """
            
            result = await self.fetch_one(
                query,
                (
                    comparison_data["user_id"],
                    comparison_data["job_description_id"],
                    comparison_data["resume_ids"],
                    json.dumps(comparison_data.get("comparison_result", {})),
                    json.dumps(comparison_data.get("ranking", [])),
                    comparison_data.get("ai_insights", "")
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing comparison result: {str(e)}")
            raise
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            await self.fetch_one("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False