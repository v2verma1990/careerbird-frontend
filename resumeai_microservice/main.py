import sys
print("Python executable:", sys.executable)# FastAPI app for resume analysis, optimization, customization, benchmarking, and ATS scan
import os
import logging
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from utils.cache import get_cached_response, set_cached_response, hash_inputs, cache_if_successful
from utils.openai_utils import (
    analyze_resume, optimize_resume_jobscan_style, customize_resume, benchmark_resume, ats_scan_jobscan_style, jobscan_style_report,
    optimize_job_description, find_best_candidates, generate_interview_questions, generate_cover_letter,salary_insights
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
        <head>
            <title>ResumeAI</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #333; }
                .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                .btn { display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; 
                       text-decoration: none; border-radius: 4px; margin-right: 10px; }
                .btn:hover { background: #45a049; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ResumeAI Document Services</h1>
                
                <div class="card">
                    <h2>API Documentation</h2>
                    <p>Visit the API documentation to explore all available endpoints.</p>
                    <a href='/docs' class="btn">API Docs</a>
                </div>
                
                <div class="card">
                    <h2>Resume Optimization</h2>
                    <p>Upload your resume to optimize it and download in your preferred format.</p>
                    <p>You can download your optimized resume as a PDF or Word document.</p>
                    <form action="/candidate/optimize" method="post" enctype="multipart/form-data">
                        <div style="margin-bottom: 15px;">
                            <label for="resume">Upload Resume:</label><br>
                            <input type="file" id="resume" name="resume" required>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label>Download Format:</label><br>
                            <input type="radio" id="docx" name="download_format" value="docx" checked>
                            <label for="docx">Word Document (.docx)</label><br>
                            <input type="radio" id="pdf" name="download_format" value="pdf">
                            <label for="pdf">PDF Document (.pdf)</label>
                        </div>
                        <button type="submit" class="btn">Optimize & Download</button>
                    </form>
                </div>
            </div>
        </body>
    </html>
    """

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )
