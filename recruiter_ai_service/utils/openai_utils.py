"""
OpenAI utilities for Recruiter AI Service
Follows the same pattern as candidate dashboard with caching
GPT-3.5 for free/basic, GPT-4 for premium
"""

import os
import json
import logging
import hashlib
from typing import Dict, Any, Tuple, Optional
from openai import OpenAI
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Model mapping based on plan (same as candidate dashboard)
MODEL_MAP = {
    "free": "gpt-3.5-turbo",
    "basic": "gpt-3.5-turbo", 
    "premium": "gpt-4",
    "recruiter": "gpt-4"  # Recruiter plan gets GPT-4
}

# Cost per 1K tokens (approximate)
MODEL_COST_PER_1K = {
    "gpt-3.5-turbo": 0.0015,
    "gpt-4": 0.03,
    "text-embedding-ada-002": 0.0001
}

def get_model_for_plan(plan: str) -> str:
    """Get the appropriate OpenAI model for the given plan"""
    return MODEL_MAP.get(plan.lower(), "gpt-3.5-turbo")

def get_cost_per_1k(model: str) -> float:
    """Get cost per 1K tokens for the given model"""
    return MODEL_COST_PER_1K.get(model, 0.002)

async def call_openai_with_cache(
    messages: list,
    plan: str = "free",
    temperature: float = 0.0,
    max_tokens: int = 1024,
    cache_service=None,
    cache_type: str = "analysis",
    cache_ttl_hours: int = 24
) -> Tuple[str, Dict[str, Any], float]:
    """
    Call OpenAI API with caching support
    
    Args:
        messages: List of messages for the API
        plan: Subscription plan (free, basic, premium)
        temperature: Randomness control
        max_tokens: Maximum tokens to generate
        cache_service: Cache service instance
        cache_type: Type of cache entry
        cache_ttl_hours: Cache TTL in hours
        
    Returns:
        Tuple of (content, usage_info, estimated_cost)
    """
    model = get_model_for_plan(plan)
    cost_per_1k = get_cost_per_1k(model)
    
    # Generate cache key
    cache_key = None
    if cache_service:
        cache_data = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        cache_key = hashlib.sha256(
            json.dumps(cache_data, sort_keys=True).encode()
        ).hexdigest()
        
        # Check cache first
        cached_result = await cache_service.get_cached_result(cache_key, cache_type)
        if cached_result:
            logger.info(f"Cache hit for {cache_type} with model {model}")
            return (
                cached_result["output_data"]["content"],
                cached_result["output_data"]["usage"],
                cached_result["cost_usd"]
            )
    
    try:
        logger.info(f"Calling OpenAI model: {model} for {cache_type}")
        
        # Make API call
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        content = response.choices[0].message.content
        usage = response.usage
        total_tokens = usage.total_tokens if usage else 0
        estimated_cost = (total_tokens / 1000) * cost_per_1k
        
        logger.info(f"OpenAI call | model: {model} | tokens: {total_tokens} | cost: ${estimated_cost:.4f}")
        
        # Cache the result
        if cache_service and cache_key:
            cache_data = {
                "content": content,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens if usage else 0,
                    "completion_tokens": usage.completion_tokens if usage else 0,
                    "total_tokens": total_tokens
                }
            }
            
            await cache_service.cache_result(
                cache_key=cache_key,
                cache_type=cache_type,
                input_data={"messages": messages, "model": model},
                output_data=cache_data,
                model_used=model,
                tokens_used=total_tokens,
                cost_usd=estimated_cost,
                ttl_hours=cache_ttl_hours
            )
        
        return content, usage, estimated_cost
        
    except Exception as e:
        logger.error(f"OpenAI API call failed: {str(e)}")
        raise Exception(f"OpenAI API call failed: {str(e)}")

async def generate_embeddings(
    texts: list,
    plan: str = "free",
    cache_service=None
) -> Tuple[list, float]:
    """
    Generate embeddings for texts with caching
    
    Args:
        texts: List of texts to embed
        plan: Subscription plan
        cache_service: Cache service instance
        
    Returns:
        Tuple of (embeddings_list, total_cost)
    """
    model = "text-embedding-ada-002"
    cost_per_1k = get_cost_per_1k(model)
    
    embeddings = []
    total_cost = 0.0
    
    for text in texts:
        # Generate cache key for this text
        cache_key = None
        if cache_service:
            cache_key = hashlib.sha256(
                json.dumps({"text": text, "model": model}, sort_keys=True).encode()
            ).hexdigest()
            
            # Check cache
            cached_result = await cache_service.get_cached_result(cache_key, "embedding")
            if cached_result:
                embeddings.append(cached_result["output_data"]["embedding"])
                total_cost += cached_result["cost_usd"]
                continue
        
        try:
            # Generate embedding
            response = client.embeddings.create(
                model=model,
                input=text
            )
            
            embedding = response.data[0].embedding
            tokens_used = response.usage.total_tokens
            cost = (tokens_used / 1000) * cost_per_1k
            
            embeddings.append(embedding)
            total_cost += cost
            
            # Cache the result
            if cache_service and cache_key:
                await cache_service.cache_result(
                    cache_key=cache_key,
                    cache_type="embedding",
                    input_data={"text": text, "model": model},
                    output_data={"embedding": embedding},
                    model_used=model,
                    tokens_used=tokens_used,
                    cost_usd=cost,
                    ttl_hours=168  # 1 week for embeddings
                )
                
        except Exception as e:
            logger.error(f"Embedding generation failed for text: {str(e)}")
            # Return zero vector as fallback
            embeddings.append([0.0] * 1536)
    
    logger.info(f"Generated {len(embeddings)} embeddings | total cost: ${total_cost:.4f}")
    return embeddings, total_cost

def create_analysis_prompt(resume_data: Dict[str, Any], job_description: str, plan: str) -> list:
    """Create prompt for resume analysis"""
    
    base_prompt = f"""
    You are an expert recruiter analyzing a resume against a job description.
    
    Job Description:
    {job_description}
    
    Resume Data:
    Name: {resume_data.get('name', 'N/A')}
    Title: {resume_data.get('title', 'N/A')}
    Summary: {resume_data.get('summary', 'N/A')}
    Skills: {', '.join(resume_data.get('skills', []))}
    Experience: {json.dumps(resume_data.get('experience', []), indent=2)}
    Education: {json.dumps(resume_data.get('education', []), indent=2)}
    
    Analyze this resume and provide:
    1. Overall match score (0-100)
    2. Skill match score (0-100)
    3. Experience score (0-100)
    4. Education score (0-100)
    5. ATS compliance score (0-100)
    6. Missing skills (list)
    7. Matching skills (list)
    8. Strengths (list)
    9. Weaknesses (list)
    10. Recommendations (list)
    """
    
    if plan == "premium":
        base_prompt += """
        
        Additionally provide:
        11. Detailed skill gap analysis
        12. Career progression assessment
        13. Cultural fit indicators
        14. Interview question suggestions
        15. Salary range recommendation
        """
    
    base_prompt += "\n\nProvide your analysis in JSON format."
    
    return [{"role": "user", "content": base_prompt}]

def create_comparison_prompt(candidates_data: list, job_description: str, plan: str) -> list:
    """Create prompt for candidate comparison"""
    
    candidates_text = ""
    for i, candidate in enumerate(candidates_data, 1):
        candidates_text += f"""
        Candidate {i}:
        Name: {candidate.get('name', 'N/A')}
        Title: {candidate.get('title', 'N/A')}
        Skills: {', '.join(candidate.get('skills', []))}
        Experience: {len(candidate.get('experience', []))} positions
        Education: {len(candidate.get('education', []))} degrees
        Match Score: {candidate.get('match_score', 'N/A')}
        
        """
    
    base_prompt = f"""
    You are an expert recruiter comparing multiple candidates for a position.
    
    Job Description:
    {job_description}
    
    Candidates:
    {candidates_text}
    
    Compare these candidates and provide:
    1. Ranking (1st, 2nd, 3rd, etc.)
    2. Comparison matrix
    3. Key differentiators
    4. Hiring recommendations
    """
    
    if plan == "premium":
        base_prompt += """
        
        Additionally provide:
        5. Detailed SWOT analysis for each candidate
        6. Team fit assessment
        7. Growth potential evaluation
        8. Risk assessment
        """
    
    base_prompt += "\n\nProvide your analysis in JSON format."
    
    return [{"role": "user", "content": base_prompt}]

def create_skill_gap_prompt(resume_data: Dict[str, Any], job_description: str, plan: str) -> list:
    """Create prompt for skill gap analysis"""
    
    base_prompt = f"""
    You are an expert career coach analyzing skill gaps.
    
    Job Requirements:
    {job_description}
    
    Candidate Profile:
    Name: {resume_data.get('name', 'N/A')}
    Current Skills: {', '.join(resume_data.get('skills', []))}
    Experience: {json.dumps(resume_data.get('experience', []), indent=2)}
    
    Analyze the skill gaps and provide:
    1. Critical missing skills
    2. Nice-to-have missing skills
    3. Skill development recommendations
    4. Learning resources
    5. Timeline for skill acquisition
    """
    
    if plan == "premium":
        base_prompt += """
        
        Additionally provide:
        6. Certification recommendations
        7. Project suggestions for skill building
        8. Mentorship opportunities
        9. Career path mapping
        """
    
    base_prompt += "\n\nProvide your analysis in JSON format."
    
    return [{"role": "user", "content": base_prompt}]