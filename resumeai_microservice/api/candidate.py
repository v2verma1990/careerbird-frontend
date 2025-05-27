from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.candidate_service import (
    analyze_resume_service, optimize_resume_service, customize_resume_service, benchmark_resume_service, ats_scan_service, generate_cover_letter_service, extract_resume_text
)
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/analyze")
async def analyze(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
    return await analyze_resume_service(resume, job_description, plan)


@router.post("/optimize")
async def optimize(
    resume: UploadFile = File(...),    
    plan: str = Form("free")
):       
    result = await optimize_resume_service(resume, plan)
    return result



@router.post("/customize")
async def customize(
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    plan: str = Form("free")
):
        
    result = await customize_resume_service(resume, job_description,job_description_file, plan)
    return result

@router.post("/ats_scan")
async def ats_scan(resume: UploadFile = File(...),plan: str = Form("free")):
    result= await ats_scan_service(resume)
    return result

@router.post("/benchmark")
async def benchmark(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
    return await benchmark_resume_service(resume, job_description, plan)



@router.post("/generate_cover_letter")
async def generate_cover_letter(job_title: str = Form(...), company: str = Form(...), job_description: str = Form(...)):
    return await generate_cover_letter_service(job_title, company, job_description)

@router.post("/advanced-suggestions")
async def advanced_suggestions(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    section_feedback: str = Form(None),
    plan: str = Form("free")
):
    """
    Returns advanced OpenAI-powered suggestions for resume improvement, optionally section-by-section.
    """
    from utils.openai_utils import advanced_resume_suggestions
    feedback = None
    if section_feedback:
        import json
        feedback = json.loads(section_feedback)
    suggestions = advanced_resume_suggestions(resume_text, job_description, feedback, plan)
    return {"suggestions": suggestions}
