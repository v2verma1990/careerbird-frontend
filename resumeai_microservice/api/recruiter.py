from fastapi import APIRouter, Form
from resumeai_microservice.services.recruiter_service import (
    optimize_job_description_service, find_best_candidates_service, generate_interview_questions_service, optimize_resume_for_job_service
)

router = APIRouter()

@router.post("/optimize_job")
async def optimize_job(job_description: str = Form(...), plan: str = Form("free")):
    return await optimize_job_description_service(job_description, plan)

@router.post("/find_best_candidates")
async def find_best_candidates(job_description: str = Form(...), plan: str = Form("free")):
    return await find_best_candidates_service(job_description, plan)

@router.post("/generate_interview_questions")
async def generate_interview_questions(job_title: str = Form(...), plan: str = Form("free")):
    return await generate_interview_questions_service(job_title, plan)

@router.post("/optimize_resume_for_job")
async def optimize_resume_for_job(resume: str = Form(...), job_description: str = Form(...), plan: str = Form("free")):
    return await optimize_resume_for_job_service(resume, job_description, plan)
