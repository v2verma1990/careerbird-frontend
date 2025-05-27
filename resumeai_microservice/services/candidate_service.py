from fastapi import UploadFile, File, Form, HTTPException
from utils.cache import get_cached_response, set_cached_response, hash_inputs, cache_if_successful
from utils.openai_utils import (
    analyze_resume, optimize_resume_jobscan_style, customize_resume, benchmark_resume, ats_scan_jobscan_style, generate_cover_letter, jobscan_style_report
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
        return cached
    result = analyze_resume(resume_text, job_description, plan=plan)
    cache_if_successful("analyze", cache_key, result)
    logger.info("Cache miss for analyze_resume, called OpenAI")
    return result

def normalize_resume_highlights(result):
    highlights = result.get("resumeHighlights", [])
    normalized = []
    for item in highlights:
        if isinstance(item, dict):
            normalized.append(item)
        elif isinstance(item, str):
            normalized.append({"text": item, "reason": ""})
    result["resumeHighlights"] = normalized
    return result

async def optimize_resume_service(
    resume: UploadFile,   
    plan: str = "free"
):
    logger.info("optimize_resume_service called (optimize_resume_jobscan)")
    try:
        resume_text = await extract_resume_text(resume)       
        resume_tokens = count_tokens(resume_text)      
        total_tokens = resume_tokens 
        max_total_tokens = 15000

        if total_tokens > max_total_tokens:
            raise HTTPException(
                status_code=400,
                detail="Your resume is long for analysis. Please shorten your resume."
            )

        cache_key = hash_inputs(resume_text,plan,"optimize_resume_service")
        cached = get_cached_response("optimize", cache_key)
        logger.info(f"Cached value for key {cache_key}: {cached}")
        if cached:
            logger.info("Cache hit for optimize (optimize_resume_jobscan)")
            return cached
        result = optimize_resume_jobscan_style(resume_text, plan=plan)
        logger.info(f"RAW OpenAI result: {result}")
        logger.info(f"Type of resumeHighlights: {type(result.get('resumeHighlights', None))}, Value: {result.get('resumeHighlights', None)}")
        result = normalize_resume_highlights(result)
        cache_if_successful("optimize", cache_key, result)
        logger.info("Cache miss for optimize, called OpenAI (optimize_resume_jobscan)")
        return result
    except HTTPException as e:
        logger.error(f"optimize_resume_service failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"optimize_resume_service failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



async def customize_resume_service(
    resume: UploadFile,
    job_description: str = None,
    job_description_file: UploadFile = None,
    plan: str = "free"
):
    logger.info("customize_resume_service called (Jobscan-style)")
    try:
        resume_text = await extract_resume_text(resume)
        # Handle both text and file for job description
        if job_description_file is not None:
            jd_text = await extract_resume_text(job_description_file)
        else:
            jd_text = job_description or ""
        # Count tokens
        resume_tokens = count_tokens(resume_text)
        jd_tokens = count_tokens(jd_text)
        total_tokens = resume_tokens + jd_tokens
        max_total_tokens = 15000  # leave room for prompt/instructions

        if total_tokens > max_total_tokens:
            raise HTTPException(
                status_code=400,
                detail="Your resume and job description are too long for analysis. Please shorten your job description."
            )

        cache_key = hash_inputs(resume_text, jd_text, plan,"customize_resume_service")
        cached = get_cached_response("customize", cache_key)
        if cached:
            logger.info("Cache hit for customize_resume (Jobscan-style)")
            return cached
        result = jobscan_style_report(resume_text, jd_text, plan=plan)
        cache_if_successful("customize", cache_key, result)
        logger.info("Cache miss for customize_resume, called OpenAI (Jobscan-style)")
        return result
    except HTTPException as e:
        logger.error(f"customize_resume_service failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"customize_resume_service failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
async def ats_scan_service(resume: UploadFile, plan: str = "free"):
    logger.info("ats_scan_service called")
    try:    
        resume_text = await extract_resume_text(resume)
        # Count tokens
        resume_tokens = count_tokens(resume_text)       
        max_total_tokens = 15000  # leave room for prompt/instructions
        total_tokens = resume_tokens 
        if total_tokens > max_total_tokens:
            raise HTTPException(
                status_code=400,
                detail="Your resume . Please shorten your resume ."
            )
        cache_key = hash_inputs(resume_text,plan,"ats_scan_service")
        cached = get_cached_response("ats_scan", cache_key)
        if cached:
            logger.info("Cache hit for ats_scan")
            return cached
        result = ats_scan_jobscan_style(resume_text, plan=plan)
        logger.info(f"RAW OpenAI result: {result}")
        cache_if_successful("ats_scan", cache_key, result)
        logger.info("Cache miss for ats_scan, called OpenAI")
        return result
    except HTTPException as e:
        logger.error(f"optimize_resume_service failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"optimize_resume_service failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def benchmark_resume_service(resume: UploadFile, job_description: str, plan: str = "free"):
    logger.info("benchmark_resume_service called")
    resume_text = await extract_resume_text(resume)
    cache_key = hash_inputs(resume_text, job_description, plan)
    cached = get_cached_response("benchmark", cache_key)
    if cached:
        logger.info("Cache hit for benchmark_resume")
        return cached
    result = benchmark_resume(resume_text, job_description, plan=plan)
    cache_if_successful("benchmark", cache_key, result)
    logger.info("Cache miss for benchmark_resume, called OpenAI")
    return result



async def generate_cover_letter_service(job_title: str, company: str, job_description: str, plan: str = "free"):
    logger.info("generate_cover_letter_service called")
    cache_key = hash_inputs(job_title, company, job_description, plan)
    cached = get_cached_response("generate_cover_letter", cache_key)
    if cached:
        logger.info("Cache hit for generate_cover_letter")
        return cached
    result = generate_cover_letter(job_title, company, job_description, plan=plan)
    cache_if_successful("generate_cover_letter", cache_key, result)
    logger.info("Cache miss for generate_cover_letter, called OpenAI")
    return result
