from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.candidate_service import (
    analyze_resume_service, optimize_resume_service, customize_resume_service, benchmark_resume_service, 
    ats_scan_service, generate_cover_letter_service, extract_resume_text, salary_insights_service,
    extract_resume_data_service
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


@router.post("/salary_insights")
async def salary_insights(
    job_title: str = Form(...),
    location: str = Form(...),
    industry: str = Form(...),
    years_experience: int = Form(...),
    education_level: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    plan: str = Form("free")
    
):
    
    result=await salary_insights_service(
        job_title=job_title,
        location=location,
        industry=industry,
        years_experience=years_experience,
        education_level=education_level,
        resume_text=resume,
        plan=plan
    )
    return result

@router.post("/generate_cover_letter")
async def generate_cover_letter(job_title: str = Form(...), company: str = Form(...), job_description: str = Form(...)):
    return await generate_cover_letter_service(job_title, company, job_description)


@router.post("/benchmark")
async def benchmark(resume: UploadFile = File(...), job_description: str = Form(...), plan: str = Form("free")):
    return await benchmark_resume_service(resume, job_description, plan)

@router.post("/extract_resume_data")
async def extract_resume_data(resume: UploadFile = File(...), plan: str = Form("free")):
    """
    Extract structured data from a resume file.
    This endpoint parses a resume and returns structured data that can be used in resume templates.
    """
    return await extract_resume_data_service(resume, plan)


