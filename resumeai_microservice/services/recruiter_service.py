from fastapi.responses import JSONResponse
from resumeai_microservice.utils.cache import get_cached_response, set_cached_response, hash_inputs
from resumeai_microservice.utils.openai_utils import (
    optimize_job_description, find_best_candidates, generate_interview_questions, optimize_resume_for_job
)
import logging

logger = logging.getLogger("recruiter_service")

async def optimize_job_description_service(job_description: str, plan: str = "free"):
    logger.info("optimize_job_description_service called")
    cache_key = hash_inputs(job_description, plan)
    cached = get_cached_response("optimize_job", cache_key)
    if cached:
        logger.info("Cache hit for optimize_job_description")
        return JSONResponse(content=cached)
    result = optimize_job_description(job_description, plan=plan)
    set_cached_response("optimize_job", cache_key, result)
    logger.info("Cache miss for optimize_job_description, called OpenAI")
    return JSONResponse(content=result)

async def find_best_candidates_service(job_description: str, plan: str = "free"):
    logger.info("find_best_candidates_service called")
    cache_key = hash_inputs(job_description, plan)
    cached = get_cached_response("find_best_candidates", cache_key)
    if cached:
        logger.info("Cache hit for find_best_candidates")
        return JSONResponse(content=cached)
    result = find_best_candidates(job_description, plan=plan)
    set_cached_response("find_best_candidates", cache_key, result)
    logger.info("Cache miss for find_best_candidates, called OpenAI")
    return JSONResponse(content=result)

async def generate_interview_questions_service(job_title: str, plan: str = "free"):
    logger.info("generate_interview_questions_service called")
    cache_key = hash_inputs(job_title, plan)
    cached = get_cached_response("generate_interview_questions", cache_key)
    if cached:
        logger.info("Cache hit for generate_interview_questions")
        return JSONResponse(content=cached)
    result = generate_interview_questions(job_title, plan=plan)
    set_cached_response("generate_interview_questions", cache_key, result)
    logger.info("Cache miss for generate_interview_questions, called OpenAI")
    return JSONResponse(content=result)

async def optimize_resume_for_job_service(resume: str, job_description: str, plan: str = "free"):
    logger.info("optimize_resume_for_job_service called")
    cache_key = hash_inputs(resume, job_description, plan)
    cached = get_cached_response("optimize_resume_for_job", cache_key)
    if cached:
        logger.info("Cache hit for optimize_resume_for_job")
        return JSONResponse(content=cached)
    result = optimize_resume_for_job(resume, job_description, plan=plan)
    set_cached_response("optimize_resume_for_job", cache_key, result)
    logger.info("Cache miss for optimize_resume_for_job, called OpenAI")
    return JSONResponse(content=result)
