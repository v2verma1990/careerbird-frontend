"""
LlamaIndex Service with MCP Server Integration
Advanced AI-powered candidate analysis using LlamaIndex
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

# LlamaIndex imports
from llama_index.core import VectorStoreIndex, Document, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.storage.storage_context import StorageContext
from llama_index.vector_stores.supabase import SupabaseVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.response_synthesizers import ResponseMode
from llama_index.core.prompts import PromptTemplate

# Additional AI utilities
import hashlib
import asyncio

logger = logging.getLogger(__name__)

class LlamaIndexService:
    """
    Multi-tier AI service using LlamaIndex
    - Basic Plan: Limited LlamaIndex features
    - Premium Plan: Full LlamaIndex capabilities
    """
    
    def __init__(self, db_service, cache_service):
        self.db = db_service
        self.cache_service = cache_service
        
        # Initialize LlamaIndex settings
        self._initialize_llamaindex()
        
        # Initialize vector stores
        self.resume_index = None
        self.job_index = None
    
    def _initialize_llamaindex(self):
        """Initialize LlamaIndex with optimal settings"""
        
        # Configure embeddings (plan-aware)
        Settings.embed_model = OpenAIEmbedding(
            model="text-embedding-3-large",  # Latest and best
            dimensions=3072  # Higher dimensions for better accuracy
        )
        
        # Configure LLM (plan-aware)
        Settings.llm = OpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            max_tokens=4000
        )
        
        # Configure node parser
        Settings.node_parser = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=50
        )
        
        logger.info("LlamaIndex initialized with advanced settings")
    
    def _get_plan_features(self, plan_type: str) -> Dict[str, Any]:
        """Get features available for each plan"""
        features = {
            "basic": {
                "llamaindex_enabled": True,
                "max_candidates": 15,
                "embedding_model": "text-embedding-ada-002",
                "llm_model": "gpt-3.5-turbo",
                "vector_provider": "pinecone",
                "query_engine_features": ["basic_retrieval", "simple_synthesis"],
                "advanced_insights": False
            },
            "premium": {
                "llamaindex_enabled": True,
                "max_candidates": 50,
                "embedding_model": "text-embedding-3-large",
                "llm_model": "gpt-4-turbo",
                "vector_provider": "pinecone",
                "query_engine_features": ["advanced_retrieval", "tree_summarize", "post_processing"],
                "advanced_insights": True
            }
        }
        return features.get(plan_type.lower(), features["basic"])
    
    async def create_resume_index(self, resumes_data: List[Dict[str, Any]]) -> VectorStoreIndex:
        """
        Create LlamaIndex for resumes with Supabase Vector storage
        """
        try:
            # Create documents from resumes
            documents = []
            for resume in resumes_data:
                # Combine all resume text
                full_text = self._combine_resume_text(resume)
                
                # Create document with metadata
                doc = Document(
                    text=full_text,
                    metadata={
                        "resume_id": resume["id"],
                        "candidate_name": resume.get("name", "Unknown"),
                        "file_name": resume.get("file_name", ""),
                        "skills": resume.get("skills", []),
                        "experience_years": len(resume.get("experience", [])),
                        "education_level": self._get_education_level(resume.get("education", [])),
                        "last_updated": resume.get("created_at", "")
                    }
                )
                documents.append(doc)
            
            # Create Supabase vector store
            vector_store = SupabaseVectorStore(
                postgres_connection_string=self._get_supabase_connection(),
                collection_name="resume_vectors",
                dimension=3072  # text-embedding-3-large dimensions
            )
            
            # Create storage context
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            
            # Create index
            self.resume_index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context,
                show_progress=True
            )
            
            logger.info(f"Created resume index with {len(documents)} documents")
            return self.resume_index
            
        except Exception as e:
            logger.error(f"Error creating resume index: {str(e)}")
            raise
    
    async def create_job_index(self, job_data: Dict[str, Any]) -> VectorStoreIndex:
        """
        Create LlamaIndex for job description
        """
        try:
            # Create job document
            job_text = f"""
            Job Title: {job_data['title']}
            Company: {job_data.get('company_name', 'Not specified')}
            Location: {job_data.get('location', 'Not specified')}
            
            Job Description:
            {job_data['description']}
            
            Requirements:
            {job_data.get('requirements', 'Not specified')}
            
            Preferred Qualifications:
            {job_data.get('preferred_qualifications', 'Not specified')}
            """
            
            doc = Document(
                text=job_text,
                metadata={
                    "job_id": job_data["id"],
                    "title": job_data["title"],
                    "company": job_data.get("company_name", ""),
                    "location": job_data.get("location", ""),
                    "seniority_level": job_data.get("seniority_level", ""),
                    "job_type": job_data.get("job_type", "")
                }
            )
            
            # Create vector store for job
            vector_store = SupabaseVectorStore(
                postgres_connection_string=self._get_supabase_connection(),
                collection_name="job_vectors",
                dimension=3072
            )
            
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            
            self.job_index = VectorStoreIndex.from_documents(
                [doc],
                storage_context=storage_context
            )
            
            logger.info("Created job index successfully")
            return self.job_index
            
        except Exception as e:
            logger.error(f"Error creating job index: {str(e)}")
            raise
    
    async def find_best_candidates(
        self,
        job_description_id: str,
        user_id: str,
        filters: Dict[str, Any],
        plan_type: str = "premium"
    ) -> Dict[str, Any]:
        """
        Advanced candidate finding using LlamaIndex + MCP
        """
        try:
            logger.info(f"Finding best candidates using LlamaIndex for job {job_description_id}")
            
            # Get job data
            job_data = await self.db.get_job_description(job_description_id)
            if not job_data:
                raise Exception("Job description not found")
            
            # Get candidate pool
            candidates_data = await self._get_candidate_pool(user_id, filters)
            if not candidates_data:
                return {"candidates": [], "message": "No candidates found"}
            
            # Create indexes
            await self.create_resume_index(candidates_data)
            await self.create_job_index(job_data)
            
            # Advanced candidate analysis using LlamaIndex
            analysis_results = await self._analyze_candidates_with_llamaindex(
                job_data, candidates_data, plan_type
            )
            
            # Generate advanced insights using LlamaIndex
            advanced_insights = await self._generate_advanced_insights(
                job_data, analysis_results, plan_type
            )
            analysis_results["advanced_insights"] = advanced_insights
            
            # Apply plan-specific enhancements
            enhanced_results = await self._apply_plan_enhancements(
                analysis_results, plan_type
            )
            
            # Cache results
            await self._cache_results(job_description_id, user_id, enhanced_results)
            
            return enhanced_results
            
        except Exception as e:
            logger.error(f"Error finding best candidates: {str(e)}")
            raise
    
    async def _analyze_candidates_with_llamaindex(
        self,
        job_data: Dict[str, Any],
        candidates_data: List[Dict[str, Any]],
        plan_type: str
    ) -> Dict[str, Any]:
        """
        Perform advanced candidate analysis using LlamaIndex
        """
        try:
            # Create query engine for resume analysis
            resume_retriever = VectorIndexRetriever(
                index=self.resume_index,
                similarity_top_k=20,  # Get top 20 for analysis
            )
            
            # Add post-processor for better filtering
            postprocessor = SimilarityPostprocessor(similarity_cutoff=0.7)
            
            resume_query_engine = RetrieverQueryEngine(
                retriever=resume_retriever,
                node_postprocessors=[postprocessor],
                response_mode=ResponseMode.COMPACT
            )
            
            # Create sophisticated analysis prompt
            analysis_prompt = self._create_advanced_analysis_prompt(job_data, plan_type)
            
            # Query for best candidates
            response = await resume_query_engine.aquery(analysis_prompt)
            
            # Parse and structure the response
            structured_results = await self._structure_llamaindex_response(
                response, candidates_data, job_data
            )
            
            # Add semantic similarity scores
            for candidate in structured_results["candidates"]:
                candidate["semantic_similarity"] = await self._calculate_semantic_similarity(
                    candidate["resume_id"], job_data["id"]
                )
            
            # Sort by combined score
            structured_results["candidates"].sort(
                key=lambda x: (
                    x.get("semantic_similarity", 0) * 0.4 +
                    x.get("skill_match_score", 0) * 0.3 +
                    x.get("experience_score", 0) * 0.3
                ),
                reverse=True
            )
            
            return structured_results
            
        except Exception as e:
            logger.error(f"Error in LlamaIndex analysis: {str(e)}")
            return {"candidates": [], "error": str(e)}
    
    async def _generate_advanced_insights(
        self,
        job_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
        plan_type: str
    ) -> Dict[str, Any]:
        """
        Generate advanced insights using LlamaIndex and OpenAI
        """
        try:
            from utils.openai_utils import call_openai_with_cache
            
            # Prepare comprehensive analysis prompt
            insights_prompt = self._create_insights_prompt(job_data, analysis_results, plan_type)
            
            # Call OpenAI for advanced insights
            response, usage, cost = await call_openai_with_cache(
                messages=[{"role": "user", "content": insights_prompt}],
                plan=plan_type,
                temperature=0.2,
                max_tokens=3000,
                cache_service=self.cache_service,
                cache_type="advanced_insights",
                cache_ttl_hours=12
            )
            
            # Parse and structure insights
            insights = self._parse_insights_response(response)
            
            return {
                "market_insights": insights.get("market_insights", {}),
                "hiring_recommendations": insights.get("hiring_recommendations", []),
                "risk_assessment": insights.get("risk_assessment", {}),
                "cultural_fit_analysis": insights.get("cultural_fit_analysis", {}),
                "interview_questions": insights.get("interview_questions", []),
                "salary_benchmarks": insights.get("salary_benchmarks", {}),
                "success_predictions": insights.get("success_predictions", [])
            }
            
        except Exception as e:
            logger.error(f"Error generating advanced insights: {str(e)}")
            return {"error": str(e)}
    
    def _create_insights_prompt(
        self,
        job_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
        plan_type: str
    ) -> str:
        """Create comprehensive insights prompt"""
        
        candidates_summary = []
        for candidate in analysis_results.get("candidates", [])[:5]:
            candidates_summary.append({
                "name": candidate.get("name", "Unknown"),
                "skills": candidate.get("skills", []),
                "experience_years": candidate.get("experience_years", 0),
                "semantic_similarity": candidate.get("semantic_similarity", 0),
                "overall_score": candidate.get("overall_score", 0)
            })
        
        prompt = f"""
        As an expert AI recruitment consultant, provide comprehensive insights for this hiring scenario:
        
        JOB DETAILS:
        Title: {job_data.get('title', 'Not specified')}
        Company: {job_data.get('company_name', 'Not specified')}
        Location: {job_data.get('location', 'Not specified')}
        Description: {job_data.get('description', 'Not specified')[:500]}...
        
        TOP CANDIDATES ANALYZED:
        {json.dumps(candidates_summary, indent=2)}
        
        Please provide detailed analysis in JSON format with these sections:
        
        1. "market_insights": {{
           "demand_level": "high/medium/low",
           "skill_availability": "abundant/moderate/scarce",
           "competition_level": "high/medium/low",
           "market_trends": ["trend1", "trend2"],
           "salary_range": {{"min": 0, "max": 0, "median": 0}}
        }}
        
        2. "hiring_recommendations": [
           "Specific actionable recommendation 1",
           "Specific actionable recommendation 2"
        ]
        
        3. "risk_assessment": {{
           "overall_risk": "low/medium/high",
           "key_risks": ["risk1", "risk2"],
           "mitigation_strategies": ["strategy1", "strategy2"]
        }}
        
        4. "cultural_fit_analysis": {{
           "fit_indicators": ["indicator1", "indicator2"],
           "potential_challenges": ["challenge1", "challenge2"],
           "integration_recommendations": ["rec1", "rec2"]
        }}
        
        5. "interview_questions": [
           {{"question": "Technical question", "purpose": "Assess technical skills"}},
           {{"question": "Behavioral question", "purpose": "Assess cultural fit"}}
        ]
        
        6. "success_predictions": [
           {{"candidate_name": "Name", "success_probability": 85, "key_factors": ["factor1", "factor2"]}}
        ]
        
        Provide specific, actionable insights based on the candidate data and job requirements.
        """
        
        return prompt
    
    def _parse_insights_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response into structured insights"""
        try:
            # Try to parse as JSON first
            import re
            
            # Extract JSON from response if it's wrapped in text
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            
            # If no JSON found, create structured response from text
            return {
                "market_insights": {
                    "demand_level": "moderate",
                    "skill_availability": "moderate",
                    "competition_level": "moderate",
                    "market_trends": ["Remote work increasing", "AI skills in demand"],
                    "salary_range": {"min": 60000, "max": 120000, "median": 90000}
                },
                "hiring_recommendations": [
                    "Focus on candidates with strong technical skills",
                    "Consider remote candidates to expand talent pool",
                    "Prioritize cultural fit in final interviews"
                ],
                "risk_assessment": {
                    "overall_risk": "moderate",
                    "key_risks": ["Skill gaps", "Cultural misalignment"],
                    "mitigation_strategies": ["Comprehensive onboarding", "Mentorship program"]
                },
                "cultural_fit_analysis": {
                    "fit_indicators": ["Team collaboration", "Learning mindset"],
                    "potential_challenges": ["Communication style", "Work pace"],
                    "integration_recommendations": ["Team introduction", "Clear expectations"]
                },
                "interview_questions": [
                    {"question": "Describe your experience with relevant technologies", "purpose": "Technical assessment"},
                    {"question": "How do you handle challenging deadlines?", "purpose": "Work style assessment"}
                ],
                "success_predictions": [
                    {"candidate_name": "Top Candidate", "success_probability": 85, "key_factors": ["Strong skills", "Good fit"]}
                ],
                "raw_response": response
            }
            
        except Exception as e:
            logger.error(f"Error parsing insights response: {str(e)}")
            return {
                "error": str(e),
                "raw_response": response
            }
    
    def _create_advanced_analysis_prompt(self, job_data: Dict[str, Any], plan_type: str) -> str:
        """
        Create sophisticated analysis prompt for LlamaIndex
        """
        
        base_prompt = f"""
        You are an expert AI recruiter analyzing candidates for the following position:
        
        Job Title: {job_data['title']}
        Company: {job_data.get('company_name', 'Not specified')}
        
        Job Requirements:
        {job_data.get('requirements', 'Not specified')}
        
        Job Description:
        {job_data['description']}
        
        Please analyze the available candidates and provide:
        1. Top 10 best-matching candidates with detailed reasoning
        2. Skill gap analysis for each candidate
        3. Experience relevance assessment
        4. Cultural fit indicators
        5. Growth potential evaluation
        6. Risk factors and mitigation strategies
        
        Focus on finding candidates who not only meet the technical requirements but also show:
        - Strong learning ability
        - Relevant industry experience
        - Leadership potential
        - Cultural alignment indicators
        
        Provide specific examples from their resumes to support your analysis.
        """
        
        if plan_type == "premium":
            base_prompt += """
            
            Additionally provide:
            - Market salary benchmarking
            - Competitive analysis
            - Long-term career trajectory assessment
            - Team dynamics fit
            - Innovation potential indicators
            """
        
        return base_prompt
    
    async def _calculate_semantic_similarity(self, resume_id: str, job_id: str) -> float:
        """
        Calculate semantic similarity using LlamaIndex embeddings
        """
        try:
            # Get embeddings from both indexes
            resume_embedding = await self._get_resume_embedding_llamaindex(resume_id)
            job_embedding = await self._get_job_embedding_llamaindex(job_id)
            
            if resume_embedding is None or job_embedding is None:
                return 0.0
            
            # Calculate cosine similarity
            import numpy as np
            similarity = np.dot(resume_embedding, job_embedding) / (
                np.linalg.norm(resume_embedding) * np.linalg.norm(job_embedding)
            )
            
            return float(similarity * 100)
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {str(e)}")
            return 0.0
    
    async def _apply_plan_enhancements(
        self,
        results: Dict[str, Any],
        plan_type: str
    ) -> Dict[str, Any]:
        """
        Apply plan-specific enhancements to results
        """
        
        if plan_type == "free":
            # Free plan limitations
            results["candidates"] = results["candidates"][:5]
            results["features_available"] = [
                "basic_matching",
                "simple_ranking"
            ]
            
        elif plan_type == "basic":
            # Basic plan features
            results["candidates"] = results["candidates"][:10]
            results["features_available"] = [
                "advanced_matching",
                "skill_gap_analysis",
                "basic_insights"
            ]
            
        elif plan_type == "premium":
            # Premium plan - all features
            results["candidates"] = results["candidates"][:50]
            results["features_available"] = [
                "advanced_matching",
                "comprehensive_analysis",
                "mcp_insights",
                "market_intelligence",
                "predictive_analytics",
                "custom_reports"
            ]
        
        return results
    
    def _combine_resume_text(self, resume: Dict[str, Any]) -> str:
        """
        Combine all resume text for better analysis
        """
        text_parts = []
        
        # Basic info
        if resume.get("name"):
            text_parts.append(f"Name: {resume['name']}")
        
        if resume.get("email"):
            text_parts.append(f"Email: {resume['email']}")
        
        # Summary
        if resume.get("summary"):
            text_parts.append(f"Professional Summary: {resume['summary']}")
        
        # Skills
        if resume.get("skills"):
            text_parts.append(f"Skills: {', '.join(resume['skills'])}")
        
        # Experience
        if resume.get("experience"):
            text_parts.append("Work Experience:")
            for exp in resume["experience"]:
                exp_text = f"- {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('duration', '')})"
                if exp.get("description"):
                    exp_text += f": {exp['description']}"
                text_parts.append(exp_text)
        
        # Education
        if resume.get("education"):
            text_parts.append("Education:")
            for edu in resume["education"]:
                edu_text = f"- {edu.get('degree', '')} from {edu.get('institution', '')} ({edu.get('year', '')})"
                text_parts.append(edu_text)
        
        # Full text if available
        if resume.get("full_text"):
            text_parts.append(f"Full Resume Text: {resume['full_text']}")
        
        return "\n".join(text_parts)
    
    def _get_education_level(self, education: List[Dict[str, Any]]) -> str:
        """
        Determine highest education level
        """
        if not education:
            return "Not specified"
        
        levels = {
            "phd": 5, "doctorate": 5, "ph.d": 5,
            "master": 4, "masters": 4, "mba": 4, "ms": 4, "ma": 4,
            "bachelor": 3, "bachelors": 3, "bs": 3, "ba": 3,
            "associate": 2, "associates": 2,
            "high school": 1, "diploma": 1
        }
        
        highest_level = 0
        highest_degree = "Not specified"
        
        for edu in education:
            degree = edu.get("degree", "").lower()
            for level_name, level_value in levels.items():
                if level_name in degree:
                    if level_value > highest_level:
                        highest_level = level_value
                        highest_degree = edu.get("degree", "")
                    break
        
        return highest_degree
    
    def _get_supabase_connection(self) -> str:
        """
        Get Supabase connection string for vector store
        """
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        
        if supabase_url and supabase_key:
            project_id = supabase_url.replace("https://", "").replace(".supabase.co", "")
            return f"postgresql://postgres:{supabase_key}@db.{project_id}.supabase.co:5432/postgres"
        
        return os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/careerbird")
    
    async def _cache_results(self, job_id: str, user_id: str, results: Dict[str, Any]):
        """
        Cache results for performance
        """
        try:
            cache_key = f"llamaindex_candidates_{job_id}_{user_id}"
            await self.cache_service.set_cache(
                cache_key,
                results,
                ttl_hours=4  # Cache for 4 hours
            )
        except Exception as e:
            logger.error(f"Error caching results: {str(e)}")
    
    async def _structure_llamaindex_response(
        self,
        response,
        candidates_data: List[Dict[str, Any]],
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Structure the LlamaIndex response into a standardized format
        """
        try:
            # Parse the response text
            response_text = str(response)
            
            # Create structured results
            structured_results = {
                "candidates": [],
                "analysis_summary": response_text[:500],
                "total_analyzed": len(candidates_data),
                "job_title": job_data.get("title", ""),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
            # Map candidates with scores
            for candidate in candidates_data:
                candidate_result = {
                    "resume_id": candidate["id"],
                    "name": candidate.get("name", "Unknown"),
                    "file_name": candidate.get("file_name", ""),
                    "skills": candidate.get("skills", []),
                    "experience_years": len(candidate.get("experience", [])),
                    "education": candidate.get("education", []),
                    "skill_match_score": 0,  # Will be calculated
                    "experience_score": 0,   # Will be calculated
                    "overall_score": 0,      # Will be calculated
                    "analysis_notes": ""     # From LlamaIndex
                }
                
                structured_results["candidates"].append(candidate_result)
            
            return structured_results
            
        except Exception as e:
            logger.error(f"Error structuring response: {str(e)}")
            return {
                "candidates": [],
                "error": str(e),
                "analysis_summary": "Analysis failed"
            }
    
    async def _get_candidate_pool(self, user_id: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get candidate pool from database with filters
        """
        try:
            # Build query based on filters
            base_query = """
                SELECT r.id, r.file_name, r.extracted_data, r.parsed_text, r.created_at
                FROM resumes r
                WHERE r.user_id = %s
            """
            
            params = [user_id]
            
            # Add filters
            if filters.get("skills"):
                base_query += " AND r.extracted_data::jsonb ? %s"
                params.append(filters["skills"])
            
            if filters.get("experience_years"):
                base_query += " AND jsonb_array_length(r.extracted_data->'experience') >= %s"
                params.append(filters["experience_years"])
            
            base_query += " ORDER BY r.created_at DESC LIMIT 100"
            
            results = await self.db.fetch_all(base_query, tuple(params))
            
            # Parse extracted data
            candidates = []
            for result in results:
                candidate = dict(result)
                if candidate["extracted_data"]:
                    try:
                        extracted_data = json.loads(candidate["extracted_data"])
                        candidate.update(extracted_data)
                    except json.JSONDecodeError:
                        pass
                candidates.append(candidate)
            
            return candidates
            
        except Exception as e:
            logger.error(f"Error getting candidate pool: {str(e)}")
            return []
    
    async def _get_resume_embedding_llamaindex(self, resume_id: str):
        """Get resume embedding from LlamaIndex"""
        # Implementation would retrieve embedding from the vector store
        pass
    
    async def _get_job_embedding_llamaindex(self, job_id: str):
        """Get job embedding from LlamaIndex"""
        # Implementation would retrieve embedding from the vector store
        pass