"""
Recruiter AI Service - Python FastAPI Service
Architecture: Frontend -> .NET Backend -> Python AI Services
Features: Resume Analysis, Candidate Comparison, Skill Gap Analysis, Report Generation
Vector DB: Supabase (Free) / Pinecone (Basic/Premium)
LLM: GPT-3.5 (Free/Basic) / GPT-4 (Premium)
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import logging
import asyncio
from datetime import datetime, timedelta
import hashlib
import json

# Import our custom modules
from services.resume_parser import ResumeParserService
from services.vector_service import VectorService
from services.analysis_service import AnalysisService
from services.comparison_service import ComparisonService
from services.skill_gap_service import SkillGapService
from services.report_service import ReportService
from services.llamaindex_service import LlamaIndexService
from services.cache_service import CacheService
from utils.openai_utils import get_model_for_plan, call_openai_with_cache
from utils.database import DatabaseService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recruiter AI Service",
    description="AI-powered recruitment analysis service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db_service = DatabaseService()
cache_service = CacheService(db_service)
vector_service = VectorService(db_service)
resume_parser = ResumeParserService(cache_service)
analysis_service = AnalysisService(db_service, cache_service, vector_service)
comparison_service = ComparisonService(db_service, cache_service, vector_service)
skill_gap_service = SkillGapService(db_service, cache_service)
report_service = ReportService(db_service, cache_service)
llamaindex_service = LlamaIndexService(db_service, cache_service)

# Request/Response Models
class ResumeParseRequest(BaseModel):
    file_path: str
    file_name: str
    user_id: str
    job_description_id: Optional[str] = None
    plan_type: str = "free"

class AnalyzeResumeRequest(BaseModel):
    resume_id: str
    job_description_id: str
    user_id: str
    plan_type: str = "free"

class BulkAnalyzeRequest(BaseModel):
    resume_ids: List[str]
    job_description_id: str
    user_id: str
    plan_type: str = "free"

class CompareCandidatesRequest(BaseModel):
    resume_ids: List[str]
    job_description_id: str
    user_id: str
    plan_type: str = "free"

class SkillGapRequest(BaseModel):
    resume_id: str
    job_description_id: str
    user_id: str
    plan_type: str = "free"

class GenerateReportRequest(BaseModel):
    report_type: str
    job_description_id: str
    resume_analysis_ids: List[str]
    user_id: str
    plan_type: str = "free"

@app.on_startup
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Recruiter AI Service...")
    await db_service.initialize()
    logger.info("Recruiter AI Service started successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "recruiter-ai-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/parse-resume")
async def parse_resume(request: ResumeParseRequest):
    """
    Parse uploaded resume and extract structured data
    Uses OpenAI GPT-3.5 (free/basic) or GPT-4 (premium) with caching
    """
    try:
        logger.info(f"Parsing resume: {request.file_name} for user: {request.user_id}")
        
        # Parse resume with AI
        parsed_data = await resume_parser.parse_resume(
            file_path=request.file_path,
            file_name=request.file_name,
            user_id=request.user_id,
            plan_type=request.plan_type
        )
        
        # Store in database
        resume_id = await db_service.store_resume(
            user_id=request.user_id,
            job_description_id=request.job_description_id,
            file_name=request.file_name,
            parsed_data=parsed_data,
            plan_type=request.plan_type
        )
        
        # Generate embeddings and store in vector DB
        await vector_service.store_resume_embeddings(
            resume_id=resume_id,
            resume_text=parsed_data.get("full_text", ""),
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "resume_id": resume_id,
            "parsed_data": parsed_data,
            "message": "Resume parsed and stored successfully"
        }
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@app.post("/analyze-resume")
async def analyze_resume(request: AnalyzeResumeRequest):
    """
    Analyze resume against job description
    Uses semantic similarity and AI-powered analysis
    """
    try:
        logger.info(f"Analyzing resume: {request.resume_id} against job: {request.job_description_id}")
        
        analysis_result = await analysis_service.analyze_resume(
            resume_id=request.resume_id,
            job_description_id=request.job_description_id,
            user_id=request.user_id,
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "analysis": analysis_result,
            "message": "Resume analysis completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

@app.post("/analyze-bulk")
async def analyze_bulk_resumes(request: BulkAnalyzeRequest):
    """
    Bulk analyze multiple resumes against job description
    Uses concurrent processing with plan-based limits
    """
    try:
        logger.info(f"Bulk analyzing {len(request.resume_ids)} resumes for user: {request.user_id}")
        
        # Check plan limits
        max_concurrent = 1 if request.plan_type == "free" else 10 if request.plan_type == "basic" else 20
        
        # Process in batches
        results = []
        for i in range(0, len(request.resume_ids), max_concurrent):
            batch = request.resume_ids[i:i + max_concurrent]
            
            # Process batch concurrently
            tasks = [
                analysis_service.analyze_resume(
                    resume_id=resume_id,
                    job_description_id=request.job_description_id,
                    user_id=request.user_id,
                    plan_type=request.plan_type
                )
                for resume_id in batch
            ]
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for resume_id, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    results.append({
                        "resume_id": resume_id,
                        "success": False,
                        "error": str(result)
                    })
                else:
                    results.append({
                        "resume_id": resume_id,
                        "success": True,
                        "analysis": result
                    })
        
        return {
            "success": True,
            "results": results,
            "total_processed": len(results),
            "message": "Bulk analysis completed"
        }
        
    except Exception as e:
        logger.error(f"Error in bulk analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resumes in bulk: {str(e)}")

@app.post("/compare-candidates")
async def compare_candidates(request: CompareCandidatesRequest):
    """
    Compare multiple candidates side-by-side
    Uses vector similarity and AI-powered ranking
    """
    try:
        logger.info(f"Comparing {len(request.resume_ids)} candidates for job: {request.job_description_id}")
        
        comparison_result = await comparison_service.compare_candidates(
            resume_ids=request.resume_ids,
            job_description_id=request.job_description_id,
            user_id=request.user_id,
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "comparison": comparison_result,
            "message": "Candidate comparison completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error comparing candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare candidates: {str(e)}")

@app.post("/analyze-skill-gaps")
async def analyze_skill_gaps(request: SkillGapRequest):
    """
    Analyze skill gaps between resume and job requirements
    Provides actionable recommendations
    """
    try:
        logger.info(f"Analyzing skill gaps for resume: {request.resume_id}")
        
        skill_gap_analysis = await skill_gap_service.analyze_skill_gaps(
            resume_id=request.resume_id,
            job_description_id=request.job_description_id,
            user_id=request.user_id,
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "skill_gaps": skill_gap_analysis,
            "message": "Skill gap analysis completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing skill gaps: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze skill gaps: {str(e)}")

@app.post("/generate-report")
async def generate_report(request: GenerateReportRequest):
    """
    Generate comprehensive reports (PDF/HTML)
    Uses LangChain for structured report generation
    """
    try:
        logger.info(f"Generating {request.report_type} report for user: {request.user_id}")
        
        report_result = await report_service.generate_report(
            report_type=request.report_type,
            job_description_id=request.job_description_id,
            resume_analysis_ids=request.resume_analysis_ids,
            user_id=request.user_id,
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "report": report_result,
            "message": "Report generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics for monitoring"""
    try:
        stats = await cache_service.get_cache_stats()
        return {
            "success": True,
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")

@app.delete("/cache/clear")
async def clear_cache():
    """Clear expired cache entries"""
    try:
        cleared_count = await cache_service.clear_expired_cache()
        return {
            "success": True,
            "cleared_entries": cleared_count,
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

# LlamaIndex Request Models
class FindBestCandidatesRequest(BaseModel):
    job_description_id: str
    user_id: str
    filters: Dict[str, Any] = {}
    plan_type: str = "premium"

@app.post("/find-best-candidates")
async def find_best_candidates(request: FindBestCandidatesRequest):
    """
    Advanced candidate finding using LlamaIndex + MCP Server
    Premium feature with sophisticated AI analysis
    """
    try:
        logger.info(f"Finding best candidates using LlamaIndex for job: {request.job_description_id}")
        
        # Check if this is a premium feature
        if request.plan_type not in ["premium"]:
            raise HTTPException(
                status_code=403, 
                detail="LlamaIndex-powered candidate search is a premium feature"
            )
        
        result = await llamaindex_service.find_best_candidates(
            job_description_id=request.job_description_id,
            user_id=request.user_id,
            filters=request.filters,
            plan_type=request.plan_type
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Advanced candidate analysis completed using LlamaIndex + MCP",
            "features_used": ["llamaindex", "mcp_server", "advanced_ai", "semantic_search"]
        }
        
    except Exception as e:
        logger.error(f"Error in LlamaIndex candidate search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find candidates: {str(e)}")

@app.post("/advanced-analysis")
async def advanced_analysis(request: AnalyzeResumeRequest):
    """
    Advanced resume analysis using LlamaIndex
    Provides deeper insights than standard analysis
    """
    try:
        logger.info(f"Performing advanced analysis for resume: {request.resume_id}")
        
        # Get job and resume data
        job_data = await db_service.get_job_description(request.job_description_id)
        resume_data = await db_service.get_resume_data(request.resume_id)
        
        if not job_data or not resume_data:
            raise HTTPException(status_code=404, detail="Job or resume not found")
        
        # Create indexes for analysis
        await llamaindex_service.create_resume_index([resume_data])
        await llamaindex_service.create_job_index(job_data)
        
        # Perform advanced analysis
        analysis_result = await llamaindex_service._analyze_candidates_with_llamaindex(
            job_data, [resume_data], request.plan_type
        )
        
        return {
            "success": True,
            "data": analysis_result,
            "message": "Advanced analysis completed using LlamaIndex"
        }
        
    except Exception as e:
        logger.error(f"Error in advanced analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to perform advanced analysis: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)