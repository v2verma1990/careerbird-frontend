from fastapi import UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from utils.cache import get_cached_response, set_cached_response, hash_inputs,cache_if_successful
from utils.openai_utils import (
    analyze_resume, optimize_resume, customize_resume, benchmark_resume, ats_scan, generate_cover_letter, jobscan_style_report
)
import logging
import io
from docx import Document
import pdfplumber
import tiktoken

logger = logging.getLogger("candidate_service")

async def extract_resume_text(resume: UploadFile) -> str:
    content = await resume.read()
    filename = resume.filename.lower()
    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    elif filename.endswith(".docx"):
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    elif filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    else:
        return content.decode("utf-8", errors="ignore")

def count_tokens(text, model="gpt-3.5-turbo"):
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

async def analyze_resume_service(resume: UploadFile, job_description: str, plan: str = "free"):
    logger.info("analyze_resume_service called")
    resume_text = await extract_resume_text(resume)
    cache_key = hash_inputs(resume_text, job_description, plan)
    cached = get_cached_response("analyze", cache_key)
    if cached:
        logger.info("Cache hit for analyze_resume")
        return JSONResponse(content=cached)
    result = analyze_resume(resume_text, job_description, plan=plan)
    cache_if_successful("analyze", cache_key, result)
    logger.info("Cache miss for analyze_resume, called OpenAI")
    return JSONResponse(content=result)

async def optimize_resume_service(resume: UploadFile, job_description: str, plan: str = "free"):
    logger.info("optimize_resume_service called (Jobscan-style)")
    resume_text = await extract_resume_text(resume)
    cache_key = hash_inputs(resume_text, plan)
    cached = get_cached_response("optimize", cache_key)
    if cached:
        logger.info("Cache hit for optimize_resume (Jobscan-style)")
        return JSONResponse(content=cached)
    from utils.openai_utils import optimize_resume_jobscan_style
    result = optimize_resume_jobscan_style(resume_text, plan=plan)
    cache_if_successful("optimize", cache_key, result)
    logger.info("Cache miss for optimize_resume, called OpenAI (Jobscan-style)")
    return JSONResponse(content=result)

async def customize_resume_service(resume: UploadFile, job_description: str, plan: str = "free"):
    logger.info("customize_resume_service called (Jobscan-style)")
    try:
        resume_text = await extract_resume_text(resume)
        # Count tokens
        resume_tokens = count_tokens(resume_text)
        jd_tokens = count_tokens(job_description)
        total_tokens = resume_tokens + jd_tokens
        max_total_tokens = 15000  # leave room for prompt/instructions

        if total_tokens > max_total_tokens:
            raise HTTPException(
                status_code=400,
                detail="Your resume and job description are too long for analysis. Please shorten your job description."
            )

        cache_key = hash_inputs(resume_text, job_description, plan)
        cached = get_cached_response("customize", cache_key)
        if cached:
            logger.info("Cache hit for customize_resume (Jobscan-style)")
            return cached  # <--- Just return the dict!
        result = jobscan_style_report(resume_text, job_description, plan=plan)
        cache_if_successful("customize", cache_key, result)
        logger.info("Cache miss for customize_resume, called OpenAI (Jobscan-style)")
        return result  # <--- Just return the dict!
    except HTTPException as e:
        logger.error(f"customize_resume_service failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"customize_resume_service failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def benchmark_resume_service(resume: UploadFile, job_description: str, plan: str = "free"):
    logger.info("benchmark_resume_service called")
    resume_text = await extract_resume_text(resume)
    cache_key = hash_inputs(resume_text, job_description, plan)
    cached = get_cached_response("benchmark", cache_key)
    if cached:
        logger.info("Cache hit for benchmark_resume")
        return JSONResponse(content=cached)
    result = benchmark_resume(resume_text, job_description, plan=plan)
    cache_if_successful("benchmark", cache_key, result)
    logger.info("Cache miss for benchmark_resume, called OpenAI")
    return JSONResponse(content=result)

async def ats_scan_service(resume: UploadFile, plan: str = "free"):
    logger.info("ats_scan_service called")
    resume_text = await extract_resume_text(resume)
    cache_key = hash_inputs(resume_text, plan)
    cached = get_cached_response("ats_scan", cache_key)
    if cached:
        logger.info("Cache hit for ats_scan")
        return JSONResponse(content=cached)
    result = ats_scan(resume_text, plan=plan)
    cache_if_successful("ats_scan", cache_key, result)
    logger.info("Cache miss for ats_scan, called OpenAI")
    return JSONResponse(content=result)

async def generate_cover_letter_service(job_title: str, company: str, job_description: str, plan: str = "free"):
    logger.info("generate_cover_letter_service called")
    cache_key = hash_inputs(job_title, company, job_description, plan)
    cached = get_cached_response("generate_cover_letter", cache_key)
    if cached:
        logger.info("Cache hit for generate_cover_letter")
        return JSONResponse(content=cached)
    result = generate_cover_letter(job_title, company, job_description, plan=plan)
    cache_if_successful("generate_cover_letter", cache_key, result)
    logger.info("Cache miss for generate_cover_letter, called OpenAI")
    return JSONResponse(content=result)
