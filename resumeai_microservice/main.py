# FastAPI app for resume analysis, optimization, customization, benchmarking, and ATS scan
import os
import logging
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from dotenv import load_dotenv
from utils.cache import get_cached_response, set_cached_response, hash_inputs,cache_if_successful
from utils.openai_utils import (
    analyze_resume, optimize_resume_jobscan_style, customize_resume, benchmark_resume, ats_scan_jobscan_style, jobscan_style_report,
    optimize_job_description, find_best_candidates, generate_interview_questions, generate_cover_letter
)
from api.candidate import router as candidate_router
from api.recruiter import router as recruiter_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("resumeai_microservice")

load_dotenv()

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code} for {request.method} {request.url}")
    return response

app.include_router(candidate_router, prefix="/candidate", tags=["Candidate"])
app.include_router(recruiter_router, prefix="/recruiter", tags=["Recruiter"])

# @app.post("/analyze")
# async def analyze(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, job_description, plan)
#     cached = get_cached_response("analyze", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={k: cached[k] for k in ("score",) if k in cached})
#         return JSONResponse(content=cached)
#     result = analyze_resume(resume_text, job_description)
#     # Only cache if not error
#     if not (isinstance(result, dict) and "error" in result):
#         set_cached_response("analyze", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={k: result[k] for k in ("score",) if k in result})
#     return JSONResponse(content=result)

# @app.post("/optimize")
# async def optimize(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, job_description, plan)
#     cached = get_cached_response("optimize", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"optimized": cached.get("optimized", "")})
#         return JSONResponse(content=cached)
#     result = optimize_resume(resume_text, job_description)
#     cache_if_successful("optimize", cache_key, result)  # <--- use helper here
#     if plan == "free":
#         return JSONResponse(content={"optimized": result.get("optimized", "")})
#     return JSONResponse(content=result)

# @app.post("/customize")
# async def customize(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, job_description, plan)
#     cached = get_cached_response("customize", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"customized": cached.get("customized", "")})
#         return JSONResponse(content=cached)
#     result = customize_resume(resume_text, job_description)
#     cache_if_successful("customize", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"customized": result.get("customized", "")})
#     return JSONResponse(content=result)

# @app.post("/benchmark")
# async def benchmark(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, job_description, plan)
#     cached = get_cached_response("benchmark", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"benchmarkScore": cached.get("benchmarkScore", 0)})
#         return JSONResponse(content=cached)
#     result = benchmark_resume(resume_text, job_description)
#     cache_if_successful("benchmark", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"benchmarkScore": result.get("benchmarkScore", 0)})
#     return JSONResponse(content=result)

# @app.post("/ats_scan")
# async def ats_scan_endpoint(
#     resume: UploadFile = File(...),
#     plan: str = Form("free")
# ):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, plan)
#     cached = get_cached_response("ats_scan", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"ATSScore": cached.get("ATSScore", 0)})
#         return JSONResponse(content=cached)
#     result = ats_scan(resume_text)
#     cache_if_successful("ats_scan", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"ATSScore": result.get("ATSScore", 0)})
#     return JSONResponse(content=result)

# @app.post("/optimize_job")
# async def optimize_job(job_description: str = Form(...), plan: str = Form("free")):
#     cache_key = hash_inputs(job_description, plan)
#     cached = get_cached_response("optimize_job", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"optimized": cached.get("optimized", "")})
#         return JSONResponse(content=cached)
#     result = optimize_job_description(job_description)
#     cache_if_successful("optimize_job", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"optimized": result.get("optimized", "")})
#     return JSONResponse(content=result)

# @app.post("/find_best_candidates")
# async def find_best_candidates(job_description: str = Form(...), plan: str = Form("free")):
#     cache_key = hash_inputs(job_description, plan)
#     cached = get_cached_response("find_best_candidates", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"candidates": cached.get("candidates", [])[:3]})
#         return JSONResponse(content=cached)
#     result = find_best_candidates(job_description)
#     cache_if_successful("find_best_candidates", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"candidates": result.get("candidates", [])[:3]})
#     return JSONResponse(content=result)

# @app.post("/generate_interview_questions")
# async def generate_interview_questions_endpoint(job_title: str = Form(...), plan: str = Form("free")):
#     cache_key = hash_inputs(job_title, plan)
#     cached = get_cached_response("generate_interview_questions", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"questions": cached.get("questions", [])[:3]})
#         return JSONResponse(content=cached)
#     result = generate_interview_questions(job_title)
#     cache_if_successful("generate_interview_questions", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"questions": result.get("questions", [])[:3]})
#     return JSONResponse(content=result)

# @app.post("/generate_cover_letter")
# async def generate_cover_letter(job_title: str = Form(...), company: str = Form(...), job_description: str = Form(...), plan: str = Form("free")):
#     cache_key = hash_inputs(job_title, company, job_description, plan)
#     cached = get_cached_response("generate_cover_letter", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"coverLetter": cached.get("coverLetter", "")})
#         return JSONResponse(content=cached)
#     result = generate_cover_letter(job_title, company, job_description)
#     cache_if_successful("generate_cover_letter", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"coverLetter": result.get("coverLetter", "")})
#     return JSONResponse(content=result)

# @app.post("/optimize_resume")
# async def optimize_resume_for_job_endpoint(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
#     resume_text = (await resume.read()).decode("utf-8")
#     cache_key = hash_inputs(resume_text, job_description, plan)
#     cached = get_cached_response("optimize_resume", cache_key)
#     if cached:
#         if plan == "free":
#             return JSONResponse(content={"optimized": cached.get("optimized", "")})
#         return JSONResponse(content=cached)
#     result = optimize_resume_for_job(resume_text, job_description)
#     cache_if_successful("optimize_resume", cache_key, result)
#     if plan == "free":
#         return JSONResponse(content={"optimized": result.get("optimized", "")})
#     return JSONResponse(content=result)

@app.get("/", response_class=HTMLResponse)
def root():
    logger.info("Root endpoint called.")
    return """
    <html>
        <head><title>ResumeAI</title></head>
        <body>
            <h1>Hello, ResumeAI!</h1>
            <p>Visit <a href='/docs'>/docs</a> for the API documentation.</p>
        </body>
    </html>
    """

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )
