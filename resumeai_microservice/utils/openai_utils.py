import os
import json
import logging
import hashlib
from pathlib import Path
from openai import OpenAI

from dotenv import load_dotenv, find_dotenv

dotenv_path = find_dotenv()
load_dotenv(dotenv_path=dotenv_path)

def get_openai_api_key():
    key = os.getenv("OPENAI_API_KEY")
    print(f"DEBUG: API Key from dotenv -> {key}")
    if not key:
        logging.error("OPENAI_API_KEY not found in environment. Please set it in your .env file.")
        raise RuntimeError("OPENAI_API_KEY not found in environment. Please set it in your .env file.")
    return key



client = OpenAI(api_key=get_openai_api_key())

# Load prompts from prompts.json
PROMPTS_PATH = os.path.join(os.path.dirname(__file__), "prompts.json")
with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
    PROMPTS = json.load(f)
    


# dotenv_path = find_dotenv("C:\\Users\\visha\\Downloads\\Resume_temp_CB\\front-back-duo-dance\\resumeai_microservice\\.env")
load_dotenv()


MODEL_MAP = {
    "free": "gpt-3.5-turbo",
    "basic": "gpt-3.5-turbo",
    "premium": "gpt-4"
}
MODEL_COST_PER_1K = {
    "gpt-3.5-turbo": 0.0015,
    "gpt-4": 0.03
}

def get_model_and_cost(plan):
    model = MODEL_MAP.get(plan, "gpt-3.5-turbo")
    cost_per_1k = MODEL_COST_PER_1K.get(model, 0.002)
    return model, cost_per_1k

logger = logging.getLogger("openai_utils")

def call_openai(messages, plan="free", temperature=0.2, max_tokens=1024):
    logger.info(f"call_openai called with plan={plan}, model selection in progress")
    try:
        model, cost_per_1k = get_model_and_cost(plan)
        logger.info(f"Calling OpenAI model: {model}")
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        usage = getattr(response, "usage", None)
        if usage:
            total_tokens = getattr(usage, "total_tokens", 0)
        else:
            total_tokens = 0
        estimated_cost = (total_tokens / 1000) * cost_per_1k
        logger.info(f"OpenAI call | model: {model} | tokens: {total_tokens} | est. cost: ${estimated_cost:.4f}")
        return content, usage, estimated_cost
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return json.dumps({"error": f"OpenAI API call failed: {e}"}), {"error": str(e)}, 0

def cache_key(*args, **kwargs):
    key = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
    return hashlib.sha256(key.encode()).hexdigest()

def restrict_output(data, plan, key_limit_map=None):
    if plan == "free" and key_limit_map:
        if isinstance(data, dict):
            return {k: data[k] for k in key_limit_map if k in data}
        if isinstance(data, list):
            return data[:key_limit_map.get("max_items", 1)]
    return data

def run_prompt(prompt_key, plan, **kwargs):
    p = PROMPTS[prompt_key]
    messages = [
        {"role": "system", "content": p["system"]},
        {"role": "user", "content": p["user"].format(**kwargs)}
    ]
    content, usage, cost = call_openai(messages, plan=plan, max_tokens=2048 if plan=="premium" else 1024)
    try:
        result = json.loads(content)
    except Exception:
        result = {"error": "OpenAI response could not be parsed", "raw": content}
    # Restrict output for free plan if needed
    return result

def analyze_resume(resume_text, job_description, plan="free"):
    return run_prompt("analyze_resume", plan, resume_text=resume_text, job_description=job_description)

def optimize_resume(resume_text, job_description, plan="free"):
    return run_prompt("optimize_resume", plan, resume_text=resume_text, job_description=job_description)

def customize_resume(resume_text, job_description, plan="free"):
    return run_prompt("customize_resume", plan, resume_text=resume_text, job_description=job_description)

def benchmark_resume(resume_text, job_description, plan="free"):
    return run_prompt("benchmark_resume", plan, resume_text=resume_text, job_description=job_description)

def ats_scan(resume_text, plan="free"):
    return run_prompt("ats_scan", plan, resume_text=resume_text)

def optimize_job_description(job_description, plan="free"):
    return run_prompt("optimize_job_description", plan, job_description=job_description)

def find_best_candidates(job_description, plan="free"):
    return run_prompt("find_best_candidates", plan, job_description=job_description)

def generate_interview_questions(job_title, plan="free"):
    return run_prompt("generate_interview_questions", plan, job_title=job_title)

def generate_cover_letter(job_title, company, job_description, plan="free"):
    return run_prompt("generate_cover_letter", plan, job_title=job_title, company=company, job_description=job_description)

def optimize_resume_for_job(resume_text, job_description, plan="free"):
    return run_prompt("optimize_resume_for_job", plan, resume_text=resume_text, job_description=job_description)

def jobscan_style_report(resume_text, job_description, plan="free"):
    return run_prompt("jobscan_style_report", plan, resume_text=resume_text, job_description=job_description)

def advanced_resume_suggestions(resume_text, job_description, section_feedback=None, plan="free"):
    prompt = {
        "system": "You are an expert resume coach. Provide actionable, advanced suggestions to improve the resume for the given job description. If section feedback is provided, give suggestions for each section as well as overall.",
        "user": "Resume:\n{resume_text}\nJob Description:\n{job_description}\nSection Feedback (JSON):\n{section_feedback}\nReturn a JSON array of suggestions, each as a string."
    }
    section_feedback_str = json.dumps(section_feedback) if section_feedback else "{}"
    messages = [
        {"role": "system", "content": prompt["system"]},
        {"role": "user", "content": prompt["user"].format(resume_text=resume_text, job_description=job_description, section_feedback=section_feedback_str)}
    ]
    content, usage, cost = call_openai(messages, plan=plan, max_tokens=1024)
    try:
        suggestions = json.loads(content)
        if isinstance(suggestions, dict) and "suggestions" in suggestions:
            return suggestions["suggestions"]
        return suggestions
    except Exception:
        return ["AI response could not be parsed", content]

def optimize_resume_jobscan_style(resume_text, plan="free"):
    return run_prompt("optimize_resume", plan, resume_text=resume_text)
