import os
import json
import logging
import hashlib
from pathlib import Path
from openai import OpenAI
import traceback

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

def call_openai(messages, plan="free", temperature=0.0, max_tokens=1024, response_format=None):
    """
    Call the OpenAI API with the given messages.
    
    Args:
        messages: The messages to send to the API
        plan: The subscription plan (free, basic, premium)
        temperature: Controls randomness in the output (0.0 = most deterministic/consistent)
        max_tokens: Maximum number of tokens to generate
        response_format: Optional format specification for the response
        
    Returns:
        Tuple of (content, usage, estimated_cost)
    """
    logger.info(f"call_openai called with plan={plan}, model selection in progress")
    try:
        model, cost_per_1k = get_model_and_cost(plan)
        logger.info(f"Calling OpenAI model: {model}")
        
        # For extract_resume_data, force JSON response format if the model supports it
        if any("extract_resume_data" in msg.get("content", "") for msg in messages if isinstance(msg, dict)):
            # Check if the model supports response_format
            if "gpt-4" in model or "gpt-3.5-turbo" in model:
                logger.info("Using JSON response format for extract_resume_data")
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"}
                )
                return response.choices[0].message.content, getattr(response, "usage", None), (getattr(response.usage, "total_tokens", 0) / 1000) * cost_per_1k
        
        # Standard call for other prompts
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

def extract_json_from_text(text):
    """
    Attempts to extract a valid JSON object from text that might contain extra content.
    
    Args:
        text (str): Text that might contain a JSON object
        
    Returns:
        dict or None: Parsed JSON object if found, None otherwise
    """
    logger = logging.getLogger("extract_json_from_text")
    logger.info(f"Attempting to extract JSON from text: {text[:100]}...")
    
    try:
        # First try direct parsing
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.info(f"Direct parsing failed: {e}")
        
        # Handle the specific case where the response starts with a newline and then fields
        if text.strip().startswith('"'):
            try:
                # Try wrapping the content in curly braces
                wrapped_text = '{' + text.strip() + '}'
                return json.loads(wrapped_text)
            except json.JSONDecodeError as e:
                logger.info(f"Wrapped parsing failed: {e}")
        
        # Try to find JSON object boundaries
        try:
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            
            if start_idx >= 0 and end_idx > start_idx:
                json_content = text[start_idx:end_idx+1]
                logger.info(f"Extracted JSON content: {json_content[:100]}...")
                return json.loads(json_content)
        except Exception as e:
            logger.info(f"Boundary extraction failed: {e}")
        
        # Try to find JSON object with different approach
        try:
            import re
            # Look for a pattern that might be a JSON object
            matches = re.findall(r'(\{.*\})', text, re.DOTALL)
            if matches:
                for match in matches:
                    try:
                        return json.loads(match)
                    except:
                        continue
        except Exception as e:
            logger.info(f"Regex extraction failed: {e}")
        
        # Try to handle the case where we have key-value pairs without surrounding braces
        try:
            if '"' in text and ':' in text:
                # Check if it looks like JSON without the surrounding braces
                if text.strip().startswith('"') and ":" in text:
                    fixed_text = '{' + text.strip() + '}'
                    return json.loads(fixed_text)
        except Exception as e:
            logger.info(f"Key-value extraction failed: {e}")
    
    return None

def extract_structured_data_from_text(text):
    """
    Extract structured data from text that might contain malformed JSON.
    This function uses regex patterns to extract key-value pairs and build a structured dictionary.
    Only extracts data that is actually present in the text without making assumptions.
    """
    import re
    import logging
    import json
    
    logger = logging.getLogger("openai_utils")
    
    # Initialize the result dictionary with empty values
    result = {
        "name": "",
        "title": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "website": "",
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "projects": [],
        "_parsed_with_custom_extractor": True,
        "_extraction_note": "Data extracted using fallback parser"
    }
    
    # Log the raw text for debugging
    logger.info(f"Extracting structured data from text (first 200 chars): {text[:200]}...")
    
    # First, try to fix common JSON issues that might be causing parsing problems
    fixed_text = text
    
    # Fix unterminated strings (a common issue)
    # Look for patterns like "field": "value without closing quote
    unterminated_string_pattern = r'"([^"]+)":\s*"([^"]*?)(?=\s*[,\{\}\]]|$)'
    for match in re.finditer(unterminated_string_pattern, fixed_text):
        field = match.group(1)
        value = match.group(2)
        if not value.endswith('"'):
            # Find where this field ends (next field or closing brace)
            field_start = match.start()
            next_field = fixed_text.find('",', field_start + len(field) + 4)
            next_brace = fixed_text.find('"}', field_start + len(field) + 4)
            next_bracket = fixed_text.find('"]', field_start + len(field) + 4)
            
            # Find the closest ending position
            positions = [pos for pos in [next_field, next_brace, next_bracket] if pos != -1]
            if positions:
                end_pos = min(positions)
                # Fix the unterminated string
                fixed_text = fixed_text[:end_pos] + '"' + fixed_text[end_pos:]
    
    # Try to parse the fixed JSON first
    try:
        parsed_json = json.loads(fixed_text)
        logger.info("Successfully parsed the fixed JSON!")
        
        # Copy all fields from the parsed JSON to our result
        for field in result.keys():
            if field in parsed_json:
                result[field] = parsed_json[field]
        
        # If we successfully parsed the JSON, return the result
        return result
    except json.JSONDecodeError:
        logger.info("Fixed JSON still not parseable, falling back to regex extraction")
    
    # If JSON parsing failed, proceed with regex extraction
    # Replace escaped quotes with a temporary marker
    text = text.replace('\\"', '___QUOTE___')
    
    # Extract basic fields
    field_patterns = {
        "name": r'"name"\s*:\s*"(.*?)"',
        "title": r'"title"\s*:\s*"(.*?)"',
        "email": r'"email"\s*:\s*"(.*?)"',
        "phone": r'"phone"\s*:\s*"(.*?)"',
        "location": r'"location"\s*:\s*"(.*?)"',
        "linkedin": r'"linkedin"\s*:\s*"(.*?)"',
        "website": r'"website"\s*:\s*"(.*?)"',
        "summary": r'"summary"\s*:\s*"(.*?)"'
    }
    
    for field, pattern in field_patterns.items():
        match = re.search(pattern, text, re.DOTALL)
        if match:
            # Clean up the extracted value
            value = match.group(1)
            value = value.replace('___QUOTE___', '"')
            value = value.replace('\\n', ' ').replace('\\r', ' ')
            result[field] = value
            logger.info(f"Extracted {field}: {value[:30]}...")
        else:
            logger.info(f"Could not extract {field}")
    
    # Extract skills (array of strings) with multiple pattern attempts
    skills_patterns = [
        r'"skills"\s*:\s*\[(.*?)\]',
        r'"Skills"\s*:\s*\[(.*?)\]',
        r'"skills"\s*:\s*\[\s*\]',  # Empty array pattern
        r'"skills"\s*:\s*\[([^\]]*)\]',  # More permissive pattern
        r'"skills"\s*:\s*\[([\s\S]*?)\]'  # Most permissive pattern
    ]
    
    skills_text = ""
    for pattern in skills_patterns:
        skills_match = re.search(pattern, text, re.DOTALL)
        if skills_match:
            if len(skills_match.groups()) > 0:
                skills_text = skills_match.group(1)
            break
    
    if skills_text and skills_text.strip():
        # Extract individual skills
        skill_matches = re.findall(r'"(.*?)"', skills_text)
        for skill in skill_matches:
            if skill and not skill.isspace():
                result["skills"].append(skill.replace('___QUOTE___', '"').strip())
        logger.info(f"Extracted {len(result['skills'])} skills")
    else:
        # Try a more aggressive approach - look for skill-like content
        logger.info("Could not extract skills array, trying aggressive extraction")
        
        # Look for common skill indicators in the text
        skill_indicators = [
            r'(?:Skills|Expertise|Proficiencies|Technologies)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)',
            r'(?:Technical Skills|Core Competencies)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in skill_indicators:
            skill_section_matches = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if skill_section_matches:
                skill_section = skill_section_matches.group(1)
                
                # Extract skills from the section
                # Look for comma-separated or bullet-point lists
                potential_skills = re.split(r'[,•\-\|\n]', skill_section)
                for skill in potential_skills:
                    skill = skill.strip()
                    if skill and len(skill) > 2 and not any(s == skill for s in result["skills"]):
                        result["skills"].append(skill)
        
        if result["skills"]:
            logger.info(f"Extracted {len(result['skills'])} skills using aggressive pattern matching")
        else:
            # If still no skills found, try to extract from the summary or other text
            common_tech_skills = [
                "Azure", "AWS", "GCP", "Cloud", "DevOps", "Kubernetes", "Docker", "Python", 
                "Java", "JavaScript", "C#", ".NET", "SQL", "NoSQL", "React", "Angular", 
                "Node.js", "Terraform", "CI/CD", "Agile", "Scrum", "REST", "API", "Microservices"
            ]
            
            for skill in common_tech_skills:
                if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
                    result["skills"].append(skill)
            
            if result["skills"]:
                logger.info(f"Extracted {len(result['skills'])} skills by keyword matching")
    
    # Extract experience (array of objects) with multiple pattern attempts
    experience_patterns = [
        r'"experience"\s*:\s*\[(.*?)\]',
        r'"Experience"\s*:\s*\[(.*?)\]',
        r'"workExperience"\s*:\s*\[(.*?)\]',
        r'"work_experience"\s*:\s*\[(.*?)\]',
        r'"experience"\s*:\s*\[\s*\]',  # Empty array pattern
        r'"experience"\s*:\s*\[([^\]]*)\]',  # More permissive pattern
        r'"experience"\s*:\s*\[([\s\S]*?)\]'  # Most permissive pattern
    ]
    
    experience_text = ""
    for pattern in experience_patterns:
        experience_match = re.search(pattern, text, re.DOTALL)
        if experience_match:
            if len(experience_match.groups()) > 0:
                experience_text = experience_match.group(1)
            break
    
    if experience_text and experience_text.strip():
        # Find all experience objects - use a more permissive pattern
        experience_objects = re.finditer(r'\{(.*?)(?:\}(?=\s*,|\s*\])|\}$)', experience_text, re.DOTALL)
        for exp_obj in experience_objects:
            exp_text = exp_obj.group(1)
            experience_item = {}
            
            # Extract fields from each experience item with multiple pattern attempts
            exp_field_patterns = {
                "title": [r'"title"\s*:\s*"(.*?)"', r'"position"\s*:\s*"(.*?)"', r'"role"\s*:\s*"(.*?)"'],
                "company": [r'"company"\s*:\s*"(.*?)"', r'"employer"\s*:\s*"(.*?)"', r'"organization"\s*:\s*"(.*?)"'],
                "location": [r'"location"\s*:\s*"(.*?)"', r'"place"\s*:\s*"(.*?)"'],
                "startDate": [r'"startDate"\s*:\s*"(.*?)"', r'"start_date"\s*:\s*"(.*?)"', r'"start"\s*:\s*"(.*?)"'],
                "endDate": [r'"endDate"\s*:\s*"(.*?)"', r'"end_date"\s*:\s*"(.*?)"', r'"end"\s*:\s*"(.*?)"'],
                "description": [r'"description"\s*:\s*"(.*?)"', r'"responsibilities"\s*:\s*"(.*?)"', r'"details"\s*:\s*"(.*?)"']
            }
            
            for field, patterns in exp_field_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, exp_text, re.DOTALL)
                    if match:
                        value = match.group(1)
                        value = value.replace('___QUOTE___', '"')
                        value = value.replace('\\n', ' ').replace('\\r', ' ')
                        experience_item[field] = value
                        break
                
                # Initialize empty string if no match found
                if field not in experience_item:
                    experience_item[field] = ""
            
            # Only add if we have at least title or company
            if experience_item.get("title") or experience_item.get("company"):
                result["experience"].append(experience_item)
        
        logger.info(f"Extracted {len(result['experience'])} experience items")
    else:
        # Try a more aggressive approach - look for experience-like content
        logger.info("Could not extract experience array, trying aggressive extraction")
        
        # Look for common experience patterns in the text
        exp_indicators = [
            r'(?:Experience|Work Experience|Employment)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)',
            r'(?:Professional Experience|Career History)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in exp_indicators:
            exp_section_matches = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if exp_section_matches:
                exp_section = exp_section_matches.group(1)
                
                # Look for company/title patterns
                # Common formats: "Company Name | Job Title | Date - Date"
                # or "Job Title, Company Name, Date - Date"
                exp_entries = re.finditer(r'([A-Za-z0-9\s&.,]+)(?:\s*[|,-]\s*)([A-Za-z0-9\s&.,]+)(?:\s*[|,-]\s*)([A-Za-z0-9\s\-/]+\s*-\s*[A-Za-z0-9\s\-/]+)', exp_section)
                
                for entry in exp_entries:
                    # Try to determine which part is company vs title
                    part1 = entry.group(1).strip()
                    part2 = entry.group(2).strip()
                    dates = entry.group(3).strip()
                    
                    # Split dates into start and end
                    date_parts = dates.split('-')
                    start_date = date_parts[0].strip() if len(date_parts) > 0 else ""
                    end_date = date_parts[1].strip() if len(date_parts) > 1 else ""
                    
                    # Heuristic: titles often contain words like "Engineer", "Manager", "Developer"
                    title_keywords = ["engineer", "manager", "developer", "architect", "analyst", "consultant", "director", "lead"]
                    if any(keyword in part1.lower() for keyword in title_keywords):
                        title, company = part1, part2
                    else:
                        company, title = part1, part2
                    
                    # Add to experience array
                    result["experience"].append({
                        "title": title,
                        "company": company,
                        "location": "",
                        "startDate": start_date,
                        "endDate": end_date,
                        "description": ""
                    })
                
                if result["experience"]:
                    logger.info(f"Extracted {len(result['experience'])} experience items using aggressive pattern matching")
                    break
    
    # Extract education (array of objects) with multiple pattern attempts
    education_patterns = [
        r'"education"\s*:\s*\[(.*?)\]',
        r'"Education"\s*:\s*\[(.*?)\]',
        r'"educationalBackground"\s*:\s*\[(.*?)\]',
        r'"educational_background"\s*:\s*\[(.*?)\]',
        r'"education"\s*:\s*\[\s*\]',  # Empty array pattern
        r'"education"\s*:\s*\[([^\]]*)\]',  # More permissive pattern
        r'"education"\s*:\s*\[([\s\S]*?)\]'  # Most permissive pattern
    ]
    
    education_text = ""
    for pattern in education_patterns:
        education_match = re.search(pattern, text, re.DOTALL)
        if education_match:
            if len(education_match.groups()) > 0:
                education_text = education_match.group(1)
            break
    
    if education_text and education_text.strip():
        # Find all education objects - use a more permissive pattern
        education_objects = re.finditer(r'\{(.*?)(?:\}(?=\s*,|\s*\])|\}$)', education_text, re.DOTALL)
        for edu_obj in education_objects:
            edu_text = edu_obj.group(1)
            education_item = {}
            
            # Extract fields from each education item with multiple pattern attempts
            edu_field_patterns = {
                "degree": [r'"degree"\s*:\s*"(.*?)"', r'"qualification"\s*:\s*"(.*?)"', r'"program"\s*:\s*"(.*?)"'],
                "institution": [r'"institution"\s*:\s*"(.*?)"', r'"school"\s*:\s*"(.*?)"', r'"university"\s*:\s*"(.*?)"', r'"college"\s*:\s*"(.*?)"'],
                "location": [r'"location"\s*:\s*"(.*?)"', r'"place"\s*:\s*"(.*?)"', r'"city"\s*:\s*"(.*?)"'],
                "startDate": [r'"startDate"\s*:\s*"(.*?)"', r'"start_date"\s*:\s*"(.*?)"', r'"start"\s*:\s*"(.*?)"'],
                "endDate": [r'"endDate"\s*:\s*"(.*?)"', r'"end_date"\s*:\s*"(.*?)"', r'"end"\s*:\s*"(.*?)"', r'"graduationDate"\s*:\s*"(.*?)"'],
                "description": [r'"description"\s*:\s*"(.*?)"', r'"details"\s*:\s*"(.*?)"', r'"achievements"\s*:\s*"(.*?)"']
            }
            
            for field, patterns in edu_field_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, edu_text, re.DOTALL)
                    if match:
                        value = match.group(1)
                        value = value.replace('___QUOTE___', '"')
                        value = value.replace('\\n', ' ').replace('\\r', ' ')
                        education_item[field] = value
                        break
                
                # Initialize empty string if no match found
                if field not in education_item:
                    education_item[field] = ""
            
            # Only add if we have at least degree or institution
            if education_item.get("degree") or education_item.get("institution"):
                result["education"].append(education_item)
        
        logger.info(f"Extracted {len(result['education'])} education items")
    else:
        # Try a more aggressive approach - look for education-like content
        logger.info("Could not extract education array, trying aggressive extraction")
        
        # Look for common education patterns in the text
        edu_indicators = [
            r'(?:Education|Educational Background|Academic Background)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)',
            r'(?:Degree|University|College)(?:\s*:|[^\n]*?:)(.*?)(?:\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in edu_indicators:
            edu_section_matches = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if edu_section_matches:
                edu_section = edu_section_matches.group(1)
                
                # Look for degree/institution patterns
                # Common formats: "Degree, Institution, Date" or "Institution - Degree - Date"
                edu_entries = re.finditer(r'([A-Za-z0-9\s&.,]+)(?:\s*[|,-]\s*)([A-Za-z0-9\s&.,]+)(?:\s*[|,-]\s*)?([A-Za-z0-9\s\-/]+)?', edu_section)
                
                for entry in edu_entries:
                    # Try to determine which part is degree vs institution
                    part1 = entry.group(1).strip()
                    part2 = entry.group(2).strip()
                    date_part = entry.group(3).strip() if entry.group(3) else ""
                    
                    # Heuristic: degrees often contain words like "Bachelor", "Master", "PhD"
                    degree_keywords = ["bachelor", "master", "phd", "doctorate", "diploma", "certificate", "bsc", "msc", "ba", "ma", "mba"]
                    if any(keyword in part1.lower() for keyword in degree_keywords):
                        degree, institution = part1, part2
                    else:
                        institution, degree = part1, part2
                    
                    # Extract dates if present
                    start_date = ""
                    end_date = ""
                    if date_part:
                        date_parts = date_part.split('-')
                        if len(date_parts) > 1:
                            start_date = date_parts[0].strip()
                            end_date = date_parts[1].strip()
                        else:
                            end_date = date_part  # Assume it's graduation date
                    
                    # Add to education array
                    result["education"].append({
                        "degree": degree,
                        "institution": institution,
                        "location": "",
                        "startDate": start_date,
                        "endDate": end_date,
                        "description": ""
                    })
                
                if result["education"]:
                    logger.info(f"Extracted {len(result['education'])} education items using aggressive pattern matching")
                    break
                
        # If still no education found, look for common university names
        if not result["education"]:
            common_universities = [
                "University", "College", "Institute", "School", "Academy"
            ]
            
            for uni_keyword in common_universities:
                uni_matches = re.finditer(r'([A-Za-z\s]+' + re.escape(uni_keyword) + r'[A-Za-z\s]*)', text, re.IGNORECASE)
                for match in uni_matches:
                    institution = match.group(1).strip()
                    if institution and len(institution) > 10:
                        # Look for degree near this institution
                        degree_match = re.search(r'((?:Bachelor|Master|PhD|Doctorate|BSc|MSc|BA|MA|MBA)[^,\n]*)', text, re.IGNORECASE)
                        degree = degree_match.group(1).strip() if degree_match else ""
                        
                        # Add to education array if not already present
                        if not any(edu.get("institution") == institution for edu in result["education"]):
                            result["education"].append({
                                "degree": degree,
                                "institution": institution,
                                "location": "",
                                "startDate": "",
                                "endDate": "",
                                "description": ""
                            })
            
            if result["education"]:
                logger.info(f"Extracted {len(result['education'])} education items by keyword matching")
    
    # Extract certifications (array of objects) with multiple pattern attempts
    certification_patterns = [
        r'"certifications"\s*:\s*\[(.*?)\]',
        r'"Certifications"\s*:\s*\[(.*?)\]',
        r'"certifications"\s*:\s*\[\s*\]',  # Empty array pattern
        r'"certifications"\s*:\s*\[([^\]]*)\]'  # More permissive pattern
    ]
    
    certifications_text = ""
    for pattern in certification_patterns:
        certifications_match = re.search(pattern, text, re.DOTALL)
        if certifications_match:
            certifications_text = certifications_match.group(1) if len(certifications_match.groups()) > 0 else ""
            break
    
    if certifications_text and certifications_text.strip():
        # Find all certification objects
        certification_objects = re.finditer(r'\{(.*?)\}', certifications_text, re.DOTALL)
        for cert_obj in certification_objects:
            cert_text = cert_obj.group(1)
            certification_item = {}
            
            # Extract fields from each certification item
            cert_field_patterns = {
                "name": r'"name"\s*:\s*"(.*?)"',
                "issuer": r'"issuer"\s*:\s*"(.*?)"',
                "date": r'"date"\s*:\s*"(.*?)"'
            }
            
            for field, pattern in cert_field_patterns.items():
                match = re.search(pattern, cert_text, re.DOTALL)
                if match:
                    value = match.group(1)
                    value = value.replace('___QUOTE___', '"')
                    value = value.replace('\\n', ' ').replace('\\r', ' ')
                    certification_item[field] = value
                else:
                    certification_item[field] = ""
            
            # Only add if we have at least name
            if certification_item.get("name"):
                result["certifications"].append(certification_item)
        
        logger.info(f"Extracted {len(result['certifications'])} certification items")
    else:
        # Try a more aggressive approach - look for certification-like content
        cert_indicators = [
            r'(?:Certification|Certificate|Certified)\s*:\s*([^\n,]+)',
            r'(?:Certification|Certificate|Certified)[^\n:]*?([A-Za-z0-9\s\-]+)',
            r'([A-Za-z]+\s+Certification)',
            r'([A-Za-z]+\s+Certificate)'
        ]
        
        for pattern in cert_indicators:
            cert_matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in cert_matches:
                cert_name = match.group(1).strip() if len(match.groups()) > 0 else match.group(0).strip()
                if cert_name and len(cert_name) > 3 and not any(c.get("name") == cert_name for c in result["certifications"]):
                    result["certifications"].append({
                        "name": cert_name,
                        "issuer": "",
                        "date": ""
                    })
        
        if result["certifications"]:
            logger.info(f"Extracted {len(result['certifications'])} certification items using aggressive pattern matching")
        else:
            logger.info("Could not extract certifications array")
    
    # Extract projects (array of objects) with multiple pattern attempts
    project_patterns = [
        r'"projects"\s*:\s*\[(.*?)\]',
        r'"Projects"\s*:\s*\[(.*?)\]',
        r'"projects"\s*:\s*\[\s*\]',  # Empty array pattern
        r'"projects"\s*:\s*\[([^\]]*)\]'  # More permissive pattern
    ]
    
    projects_text = ""
    for pattern in project_patterns:
        projects_match = re.search(pattern, text, re.DOTALL)
        if projects_match:
            projects_text = projects_match.group(1) if len(projects_match.groups()) > 0 else ""
            break
    
    if projects_text and projects_text.strip():
        # Find all project objects
        project_objects = re.finditer(r'\{(.*?)\}', projects_text, re.DOTALL)
        for proj_obj in project_objects:
            proj_text = proj_obj.group(1)
            project_item = {}
            
            # Extract fields from each project item
            proj_field_patterns = {
                "name": r'"name"\s*:\s*"(.*?)"',
                "date": r'"date"\s*:\s*"(.*?)"',
                "description": r'"description"\s*:\s*"(.*?)"'
            }
            
            for field, pattern in proj_field_patterns.items():
                match = re.search(pattern, proj_text, re.DOTALL)
                if match:
                    value = match.group(1)
                    value = value.replace('___QUOTE___', '"')
                    value = value.replace('\\n', ' ').replace('\\r', ' ')
                    project_item[field] = value
                else:
                    project_item[field] = ""
            
            # Only add if we have at least name
            if project_item.get("name"):
                result["projects"].append(project_item)
        
        logger.info(f"Extracted {len(result['projects'])} project items")
    else:
        # Try a more aggressive approach - look for project-like content
        project_indicators = [
            r'(?:Project|Projects)\s*:\s*([^\n,]+)',
            r'Project\s+Name\s*:\s*([^\n,]+)',
            r'(?:Project|Projects)[^\n:]*?([A-Za-z0-9\s\-]+)'
        ]
        
        for pattern in project_indicators:
            proj_matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in proj_matches:
                proj_name = match.group(1).strip() if len(match.groups()) > 0 else match.group(0).strip()
                if proj_name and len(proj_name) > 3 and not any(p.get("name") == proj_name for p in result["projects"]):
                    # Try to find a description near this project name
                    desc_match = re.search(r'(?:' + re.escape(proj_name) + r')\s*(?:[-:])?\s*([^\.]+)', text)
                    description = desc_match.group(1).strip() if desc_match else ""
                    
                    result["projects"].append({
                        "name": proj_name,
                        "date": "",
                        "description": description
                    })
        
        if result["projects"]:
            logger.info(f"Extracted {len(result['projects'])} project items using aggressive pattern matching")
        else:
            logger.info("Could not extract projects array")
    
    # Try alternative field names for arrays that might be empty
    if not result["skills"]:
        alt_skills_match = re.search(r'"Skills"\s*:\s*\[(.*?)\]', text, re.DOTALL)
        if alt_skills_match:
            skills_text = alt_skills_match.group(1)
            skill_matches = re.findall(r'"(.*?)"', skills_text)
            for skill in skill_matches:
                if skill and not skill.isspace():
                    result["skills"].append(skill.replace('___QUOTE___', '"').strip())
            logger.info(f"Extracted {len(result['skills'])} skills using alternative pattern")
    
    # Add a flag to indicate this was parsed using our custom parser
    result["_parsed_with_custom_extractor"] = True
    
    # Log the extraction results
    logger.info(f"Extraction complete. Found: {len(result['skills'])} skills, {len(result['experience'])} experience items, " +
               f"{len(result['education'])} education items, {len(result['certifications'])} certifications, {len(result['projects'])} projects")
    
    return result

def log_json_validation_issue(prompt_key, content, error_details, diagnosis):
    """
    Log JSON validation issues to a file for further analysis.
    This helps identify patterns in the malformed JSON responses.
    """
    import os
    import datetime
    import json
    
    try:
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Create a log file with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = os.path.join(log_dir, f"json_validation_{timestamp}.log")
        
        # Prepare log data
        log_data = {
            "timestamp": timestamp,
            "prompt_key": prompt_key,
            "content_length": len(content),
            "content_preview": content[:500] + "..." if len(content) > 500 else content,
            "error_details": error_details,
            "diagnosis": diagnosis
        }
        
        # Write to log file
        with open(log_file, "w") as f:
            json.dump(log_data, f, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Failed to log JSON validation issue: {e}")
        return False

def validate_json(content):
    """
    Validate JSON content and provide detailed error information.
    Returns a tuple of (is_valid, error_details, line_number, column_number, char_position)
    """
    import json
    
    try:
        json.loads(content)
        return (True, None, None, None, None)
    except json.JSONDecodeError as e:
        # Extract detailed error information
        error_msg = str(e)
        line_number = e.lineno
        column_number = e.colno
        char_position = e.pos
        
        # Get the problematic line and highlight the issue
        lines = content.split('\n')
        if line_number <= len(lines):
            problem_line = lines[line_number - 1]
            highlight = ' ' * (column_number - 1) + '^'
            context = f"Line {line_number}: {problem_line}\n{highlight}"
        else:
            context = "Error position is beyond the content length"
        
        error_details = {
            "message": error_msg,
            "context": context,
            "line": line_number,
            "column": column_number,
            "position": char_position
        }
        
        return (False, error_details, line_number, column_number, char_position)

def diagnose_json_issues(content):
    """
    Diagnose common JSON formatting issues in the response.
    Returns a tuple of (diagnosis, fixed_content) where diagnosis is a string
    describing the issue and fixed_content is the potentially fixed JSON.
    """
    import re
    import json
    
    # Initialize variables
    diagnosis = []
    fixed_content = content
    
    # First, validate the JSON and get detailed error information
    is_valid, error_details, line_number, column_number, char_position = validate_json(content)
    
    if is_valid:
        diagnosis.append("JSON is valid")
        return (diagnosis, fixed_content)
    
    # Log the detailed error information
    if error_details:
        diagnosis.append(f"JSON error: {error_details['message']}")
        diagnosis.append(f"Error context: {error_details['context']}")
    
    # Check for common issues
    if "```json" in content or "```" in content:
        diagnosis.append("Response contains markdown code blocks")
        # Remove markdown code blocks
        fixed_content = re.sub(r'```json|```', '', fixed_content)
    
    # Check for unbalanced braces and brackets
    if fixed_content.count('{') != fixed_content.count('}'):
        diagnosis.append(f"Unbalanced braces: {fixed_content.count('{')} opening vs {fixed_content.count('}')} closing")
        # Balance braces
        if fixed_content.count('{') > fixed_content.count('}'):
            fixed_content += '}' * (fixed_content.count('{') - fixed_content.count('}'))
    
    if fixed_content.count('[') != fixed_content.count(']'):
        diagnosis.append(f"Unbalanced brackets: {fixed_content.count('[')} opening vs {fixed_content.count(']')} closing")
        # Balance brackets
        if fixed_content.count('[') > fixed_content.count(']'):
            fixed_content += ']' * (fixed_content.count('[') - fixed_content.count(']'))
    
    # Check for unterminated strings (common issue based on error position)
    if error_details and "Unterminated string" in error_details['message']:
        diagnosis.append("Contains unterminated string")
        
        # Try to fix the unterminated string by examining the content around the error position
        if char_position is not None:
            # Get the content up to the error position
            content_before_error = fixed_content[:char_position]
            # Count the number of double quotes before the error
            quote_count = content_before_error.count('"')
            
            # If there's an odd number of quotes, we have an unterminated string
            if quote_count % 2 == 1:
                # Find the last quote position
                last_quote_pos = content_before_error.rindex('"')
                
                # Look for the next field or closing brace to determine where to add the quote
                next_field_pos = fixed_content.find('",', char_position)
                next_brace_pos = fixed_content.find('"}', char_position)
                next_bracket_pos = fixed_content.find('"]', char_position)
                
                # Find the closest position
                positions = [pos for pos in [next_field_pos, next_brace_pos, next_bracket_pos] if pos != -1]
                if positions:
                    end_pos = min(positions)
                    # Insert a closing quote before the next delimiter
                    fixed_content = fixed_content[:end_pos] + '"' + fixed_content[end_pos:]
                else:
                    # If no delimiter found, just add at the current position
                    fixed_content = fixed_content[:char_position] + '"' + fixed_content[char_position:]
                
                diagnosis.append(f"Added missing quote for unterminated string")
    
    # Check for trailing commas in arrays or objects
    trailing_comma_array = re.search(r',\s*\]', fixed_content)
    trailing_comma_object = re.search(r',\s*\}', fixed_content)
    if trailing_comma_array or trailing_comma_object:
        diagnosis.append("Contains trailing commas")
        # Remove trailing commas
        fixed_content = re.sub(r',(\s*[\]}])', r'\1', fixed_content)
    
    # Check for JavaScript-style comments
    if '//' in fixed_content or '/*' in fixed_content:
        diagnosis.append("Contains JavaScript-style comments")
        # Remove single-line comments
        fixed_content = re.sub(r'//.*?(\n|$)', r'\1', fixed_content)
        # Remove multi-line comments
        fixed_content = re.sub(r'/\*.*?\*/', '', fixed_content, flags=re.DOTALL)
    
    # Check for non-JSON text before or after the JSON content
    json_pattern = r'(\{.*\}|\[.*\])'
    json_matches = re.search(json_pattern, fixed_content, re.DOTALL)
    if json_matches and json_matches.group(0) != fixed_content.strip():
        diagnosis.append("Contains non-JSON text before or after JSON content")
        # Extract just the JSON part
        fixed_content = json_matches.group(0)
    
    # Check for control characters in strings
    control_char_pattern = re.compile(r'[\x00-\x1F\x7F]')
    if control_char_pattern.search(fixed_content):
        diagnosis.append("Contains control characters in strings")
        # Replace control characters with spaces
        fixed_content = control_char_pattern.sub(' ', fixed_content)
    
    # Check for unescaped quotes in strings
    # This is more complex and requires context-aware parsing
    # For now, we'll do a simple check for obvious cases
    if re.search(r'[^\\]"[^,\}\]:]', fixed_content):
        diagnosis.append("May contain unescaped quotes in strings")
        # This is hard to fix automatically without potentially corrupting the data
    
    # Try to parse the fixed content
    try:
        json.loads(fixed_content)
        diagnosis.append("Fixed JSON is now valid")
    except Exception as e:
        diagnosis.append(f"JSON is still invalid after fixes: {str(e)}")
        
        # If we still have issues, try a more aggressive approach for critical errors
        if "Unterminated string" in str(e):
            # Try to fix by adding quotes at the end of each line that might need it
            lines = fixed_content.split('\n')
            for i in range(len(lines)):
                if lines[i].count('"') % 2 == 1:  # Odd number of quotes
                    lines[i] = lines[i] + '"'
            fixed_content = '\n'.join(lines)
            diagnosis.append("Applied aggressive fix for unterminated strings")
            
            # Try parsing again
            try:
                json.loads(fixed_content)
                diagnosis.append("Aggressive fix worked - JSON is now valid")
            except Exception as e2:
                diagnosis.append(f"JSON is still invalid after aggressive fixes: {str(e2)}")
    
    return (diagnosis, fixed_content)

def run_prompt(prompt_key, plan, custom_prompt=None, **kwargs):
    # Use custom prompt if provided, otherwise use the default from PROMPTS
    if custom_prompt:
        p = custom_prompt
    else:
        p = PROMPTS[prompt_key]
    
    # Create a more explicit system prompt for JSON responses
    enhanced_system_prompt = p["system"]
    
    # Add JSON formatting instructions for all prompts that require JSON output
    # if not already included in the custom prompt
    if prompt_key in ["extract_resume_data", "analyze_resume", "benchmark_resume", "optimize_resume_jobscan", "ats_scan_jobscan_style"] and "IMPORTANT JSON FORMATTING" not in enhanced_system_prompt:
        enhanced_system_prompt += """
IMPORTANT: Your response MUST be valid JSON. Follow these rules:
1. Do NOT include markdown formatting or code blocks
2. Do NOT include explanations outside the JSON structure
3. Ensure all strings are properly quoted and escaped
4. Do NOT use trailing commas
5. Ensure all brackets and braces are properly balanced
6. Return ONLY the JSON object, nothing else
"""
    
    messages = [
        {"role": "system", "content": enhanced_system_prompt},
        {"role": "user", "content": p["user"].format(**kwargs)}
    ]
    
    logger.info(f"About to call call_openai for {prompt_key} with enhanced JSON instructions")
    
    # Make the API call with enhanced instructions - ONLY ONCE
    # Using temperature=0.0 for maximum consistency in responses
    # For certain prompts, we use a slightly higher max_tokens and force JSON response format
    try:
        if prompt_key in ["extract_resume_data", "optimize_resume_jobscan", "ats_scan_jobscan_style"]:
            # For these prompts, we need more tokens to ensure complete extraction
            # Also force JSON response format
            content, usage, cost = call_openai(
                messages, 
                plan=plan, 
                temperature=0.0, 
                max_tokens=4096 if plan=="premium" else 2048,
                response_format={"type": "json_object"}
            )
        else:
            content, usage, cost = call_openai(messages, plan=plan, temperature=0.0, max_tokens=2048 if plan=="premium" else 1024)
    except Exception as e:
        logger.error(f"Exception in call_openai for {prompt_key}: {e}")
        raise
    
    # Log a truncated version of the response to avoid cluttering logs
    truncated_content = content[:500] + "..." if len(content) > 500 else content
    logger.info(f"RAW LLM response for {prompt_key} (truncated): {truncated_content}")
    
    # Try to parse the JSON response
    try:       
        result = json.loads(content)
        logger.info(f"Successfully parsed JSON response for {prompt_key}")
        return result
    except json.JSONDecodeError as e:
        # Try to extract JSON using our helper function
        extracted_json = extract_json_from_text(content)
        if extracted_json:
            logger.info(f"Successfully extracted JSON from response for {prompt_key} using helper")
            return extracted_json
        # Get detailed validation information
        is_valid, error_details, line_number, column_number, char_position = validate_json(content)
        
        # Log the specific JSON parsing error with detailed context
        if error_details:
            logger.warning(f"JSON validation failed: {error_details['message']}")
            logger.warning(f"Error context: {error_details['context']}")
        else:
            logger.warning(f"Failed to parse OpenAI response as JSON: {e}")
        
        # Save the original error for analysis
        original_error = {
            "message": str(e),
            "line": getattr(e, "lineno", None),
            "column": getattr(e, "colno", None),
            "position": getattr(e, "pos", None)
        }
        
        # Diagnose and attempt to fix the JSON issues
        diagnosis, fixed_content = diagnose_json_issues(content)
        logger.info(f"JSON diagnosis: {diagnosis}")
        
        # Log the validation issue for further analysis
        log_json_validation_issue(prompt_key, content, error_details, diagnosis)
        
        # Try to parse the fixed content
        try:
            result = json.loads(fixed_content)
            logger.info(f"Successfully parsed fixed JSON response for {prompt_key}")
            
            # Add diagnostic information to the result
            result["_json_fixed"] = True
            result["_json_diagnosis"] = diagnosis
            result["_original_error"] = original_error
            
            # Log what was fixed to help improve the system prompt
            logger.info(f"JSON was successfully fixed. Original error: {original_error['message']}")
            return result
        except Exception as fix_e:
            logger.warning(f"Failed to parse fixed JSON: {fix_e}")
            
            # Log the failed fix attempt
            logger.error(f"JSON fix failed. Original content (truncated): {content[:200]}...")
            logger.error(f"Fixed content attempt (truncated): {fixed_content[:200]}...")
            
            # Special handling for extract_resume_data prompt
            if prompt_key == "extract_resume_data":
                logger.info("Using custom parser for extract_resume_data")
                try:
                    # Use our custom parser to extract structured data
                    structured_data = extract_structured_data_from_text(content)
                    
                    # Check if we extracted at least some basic information
                    if structured_data.get("name") or structured_data.get("email"):
                        logger.info("Successfully extracted structured resume data using custom parser")
                        
                        # Add diagnostic information to the response
                        structured_data["_extraction_note"] = "This data was extracted using a custom parser due to JSON formatting issues in the original response."
                        structured_data["_json_diagnosis"] = diagnosis
                        
                        # Log the extracted data (but limit the output size for readability)
                        log_data = {
                            "name": structured_data.get("name", ""),
                            "email": structured_data.get("email", ""),
                            "skills_count": len(structured_data.get("skills", [])),
                            "experience_count": len(structured_data.get("experience", [])),
                            "education_count": len(structured_data.get("education", [])),
                            "certifications_count": len(structured_data.get("certifications", [])),
                            "projects_count": len(structured_data.get("projects", []))
                        }
                        logger.info(f"Extracted resume data summary: {log_data}")
                        
                        return structured_data
                    else:
                        logger.warning("Custom parser failed to extract meaningful data")
                        
                        # Return a minimal structure with default values instead of empty arrays
                        default_structure = {
                            "name": "",
                            "title": "",
                            "email": "",
                            "phone": "",
                            "location": "",
                            "linkedin": "",
                            "website": "",
                            "summary": "",
                            "skills": [],
                            "experience": [],
                            "education": [],
                            "certifications": [],
                            "projects": [],
                            "_parsed": False,
                            "_extraction_note": "Failed to extract structured data from the response",
                            "_json_diagnosis": diagnosis,
                            "error": "Failed to extract structured data from the response"
                        }
                        return default_structure
                except Exception as extract_error:
                    logger.error(f"Error in custom data extraction: {extract_error}")
                    
                    # Return a structured response with default values
                    return {
                        "name": "",
                        "title": "",
                        "email": "",
                        "phone": "",
                        "location": "",
                        "linkedin": "",
                        "website": "",
                        "summary": "",
                        "skills": [],
                        "experience": [],
                        "education": [],
                        "certifications": [],
                        "projects": [],
                        "_parsed": False,
                        "_extraction_note": f"Error during custom data extraction: {str(extract_error)}",
                        "_json_diagnosis": diagnosis,
                        "error": f"Error during custom data extraction: {str(extract_error)}"
                    }
            
            # For other prompts, return a structured response with default values
            if prompt_key == "extract_resume_data":
                return {
                    "name": "",
                    "title": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "linkedin": "",
                    "website": "",
                    "summary": "",
                    "skills": [],
                    "experience": [],
                    "education": [],
                    "certifications": [],
                    "projects": [],
                    "_parsed": False,
                    "_extraction_note": "OpenAI response could not be parsed as JSON",
                    "_json_diagnosis": diagnosis,
                    "error": "OpenAI response could not be parsed as JSON"
                }
            else:
                # For other prompts, return a structured error with diagnosis
                return {
                    "error": "OpenAI response could not be parsed as JSON",
                    "raw": content[:1000] + "..." if len(content) > 1000 else content,
                    "_parsed": False,
                    "_json_diagnosis": diagnosis
                }
    
    return result

def analyze_resume(resume_text, job_description, plan="free"):
    return run_prompt("analyze_resume", plan, resume_text=resume_text, job_description=job_description)


def customize_resume(resume_text, job_description, plan="free"):
    return run_prompt("customize_resume", plan, resume_text=resume_text, job_description=job_description)

def benchmark_resume(resume_text, job_description, plan="free"):
    return run_prompt("benchmark_resume", plan, resume_text=resume_text, job_description=job_description)



def optimize_job_description(job_description, plan="free"):
    return run_prompt("optimize_job_description", plan, job_description=job_description)

def find_best_candidates(job_description, plan="free"):
    return run_prompt("find_best_candidates", plan, job_description=job_description)

def generate_interview_questions(job_title, plan="free"):
    return run_prompt("generate_interview_questions", plan, job_title=job_title)

def generate_cover_letter(job_title, company, job_description, plan="free"):
    return run_prompt("generate_cover_letter", plan, job_title=job_title, company=company, job_description=job_description)



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
    # Using temperature=0.0 for maximum consistency in responses
    content, usage, cost = call_openai(messages, plan=plan, temperature=0.0, max_tokens=1024)
    try:
        suggestions = json.loads(content)
        if isinstance(suggestions, dict) and "suggestions" in suggestions:
            return suggestions["suggestions"]
        return suggestions
    except Exception:
        return ["AI response could not be parsed", content]
def jobscan_style_report(resume_text, job_description, plan="free"):
    return run_prompt("jobscan_style_report", plan, resume_text=resume_text, job_description=job_description)

def optimize_resume_jobscan_style(resume_text, plan="free"):
    return run_prompt("optimize_resume_jobscan", plan, resume_text=resume_text)

def ats_scan_jobscan_style(resume_text, plan="free"):
    return run_prompt("ats_scan_jobscan_style", plan, resume_text=resume_text)

def salary_insights(job_title, location, industry, years_experience, education_level=None, resume_text=None, plan="free"):
    return run_prompt("salary_insights", plan, job_title=job_title, location=location, industry=industry,
years_experience=years_experience, education_level=education_level, resume_text=resume_text)

def extract_resume_data(resume_text, plan="free"):
    """
    Extract structured data from a resume.
    
    This function uses a custom approach to ensure valid JSON output:
    1. Adds explicit JSON formatting instructions to the prompt
    2. Uses a custom parser as a fallback for malformed JSON
    3. Logs validation issues for analysis
    4. Implements post-processing to fix common extraction errors
    """
    # Create a custom prompt with enhanced JSON formatting instructions
    extract_prompt = PROMPTS["extract_resume_data"].copy()
    
    # Use a completely different approach with a more structured prompt
    extract_prompt["system"] = """You are an expert resume parser that extracts structured data from resumes with high accuracy.
Your task is to carefully analyze the resume text and extract information into the correct fields.
You MUST return a valid JSON object with the structure specified below.

CRITICAL RULES:
1. Your response MUST be a valid JSON object starting with { and ending with }
2. DO NOT include any text, explanations, or markdown outside the JSON object
3. If you cannot extract a field, use an empty string or empty array as appropriate
4. NEVER put description text into title or company fields
5. ALWAYS put full descriptions in the description field
6. DO NOT use trailing commas in arrays or objects
7. Use double quotes for all property names and string values
8. Escape any double quotes within string values with a backslash: \\"
"""

    # Update the user prompt to be more structured
    extract_prompt["user"] = """Extract the following information from this resume and return it as a JSON object:

1. name: Full name of the candidate
2. title: Professional title/role
3. email: Email address
4. phone: Phone number
5. location: City, State/Province, Country
6. linkedin: LinkedIn profile URL (if available)
7. website: Personal website URL (if available)
8. summary: Professional summary/objective
9. skills: Array of skills as strings
10. experience: Array of work experiences, each with:
   - title: Job title ONLY
   - company: Company name ONLY
   - location: Job location
   - startDate: Start date
   - endDate: End date or "Present"
   - description: Job description and achievements
11. education: Array of education entries, each with:
   - degree: Degree name
   - institution: School/University name
   - location: Institution location
   - startDate: Start date
   - endDate: End date
   - description: Additional details (optional)
12. certifications: Array of certifications, each with:
   - name: Certification name
   - issuer: Issuing organization
   - date: Date obtained
13. projects: Array of projects, each with:
   - name: Project name ONLY
   - date: Date or date range
   - description: Project description and details

IMPORTANT: Your response must be a valid JSON object. Do not include any text outside the JSON structure.

Resume:
{resume_text}
"""
    
    try:
        # Try a direct approach with the OpenAI API instead of using run_prompt
        logger.info("Using direct OpenAI API call for resume extraction")
        
        messages = [
            {"role": "system", "content": extract_prompt["system"]},
            {"role": "user", "content": extract_prompt["user"].format(resume_text=resume_text)}
        ]
        
        model, _ = get_model_and_cost(plan)
        logger.info(f"Using model {model} for resume extraction")
        
        # Make the API call with explicit JSON response format
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.0,
            max_tokens=4096 if plan=="premium" else 2048,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        logger.info(f"Raw API response (first 200 chars): {content[:200]}...")
        
        # Parse the JSON response
        try:
            result = json.loads(content)
            logger.info("Successfully parsed JSON response from direct API call")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from direct API call: {e}")
            
            # Try to extract JSON from the string using our helper function
            parsed_result = extract_json_from_text(content)
            if parsed_result:
                logger.info("Successfully extracted JSON from string response")
                result = parsed_result
            else:
                logger.error("Failed to extract JSON from string response")
                return {
                    "error": "Failed to parse resume data",
                    "raw": content[:1000] if len(content) > 1000 else content,
                    "name": "",
                    "title": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "summary": "",
                    "skills": [],
                    "experience": [],
                    "education": [],
                    "certifications": [],
                    "projects": []
                }
        
        # Post-process the result to fix common extraction errors
        if isinstance(result, dict):
            # Fix experience entries
            if "experience" in result and isinstance(result["experience"], list):
                for i, exp in enumerate(result["experience"]):
                    # Check if title contains company information
                    if isinstance(exp.get("title"), str) and " at " in exp.get("title", ""):
                        parts = exp["title"].split(" at ", 1)
                        exp["title"] = parts[0].strip()
                        if not exp.get("company") or exp.get("company") == "":
                            exp["company"] = parts[1].strip()
                    
                    # Check if description is in company field
                    if isinstance(exp.get("company"), str) and len(exp.get("company", "")) > 50:
                        # Company name is too long, likely contains description
                        if not exp.get("description") or exp.get("description") == "":
                            exp["description"] = exp["company"]
                            exp["company"] = ""
                    
                    # Check if dates are in wrong fields
                    for field in ["title", "company"]:
                        if isinstance(exp.get(field), str) and any(x in exp.get(field, "").lower() for x in ["present", "current", "now", "ongoing"]):
                            if not exp.get("endDate") or exp.get("endDate") == "":
                                exp["endDate"] = "Present"
                    
                    # CRITICAL FIX: Ensure description is always a string
                    # This matches the updated .NET API model where Description is a string
                    if exp.get("description") is None:
                        exp["description"] = ""
                    elif isinstance(exp.get("description"), list):
                        # If description is a list, join it into a string
                        if len(exp["description"]) > 0:
                            exp["description"] = ". ".join(str(item) for item in exp["description"])
                        else:
                            exp["description"] = ""
                    elif not isinstance(exp.get("description"), str):
                        # If it's some other type, convert to string
                        exp["description"] = str(exp.get("description", ""))
            
            # Fix project entries
            if "projects" in result and isinstance(result["projects"], list):
                for i, proj in enumerate(result["projects"]):
                    # Check if name contains description
                    if isinstance(proj.get("name"), str) and len(proj.get("name", "")) > 50:
                        # Project name is too long, likely contains description
                        if not proj.get("description") or proj.get("description") == "":
                            proj["description"] = proj["name"]
                            proj["name"] = f"Project {i+1}"
                    
                    # Ensure project description is always a string (not a list)
                    # This matches the .NET API model where ProjectItem.Description is a string
                    if proj.get("description") is None:
                        proj["description"] = ""
                    elif isinstance(proj.get("description"), list):
                        if len(proj["description"]) > 0:
                            proj["description"] = ". ".join(str(item) for item in proj["description"])
                        else:
                            proj["description"] = ""
                    elif not isinstance(proj.get("description"), str):
                        proj["description"] = str(proj.get("description", ""))
            
            # Final check to ensure all fields are properly formatted for .NET API
            # This is a safety check to catch any fields we might have missed
            for field in ["name", "title", "email", "phone", "location", "linkedin", "website", "summary"]:
                if field in result and result[field] is None:
                    result[field] = ""
                elif field in result and not isinstance(result[field], str):
                    result[field] = str(result[field])
        
        return result
    except Exception as e:
        logger.error(f"Error in extract_resume_data: {str(e)}")
        
        # Special handling for the specific error we're seeing
        error_str = str(e)
        if '\\n  "title"' in error_str or '"title"' in error_str:
            logger.info("Detected the specific title field error, attempting special handling")
            try:
                # Try to create a valid JSON from the error message
                if isinstance(resume_text, str):
                    # Create a minimal valid JSON with just the resume text in the summary
                    minimal_json = {
                        "name": "",
                        "title": "",
                        "email": "",
                        "phone": "",
                        "location": "",
                        "summary": resume_text[:1000] if len(resume_text) > 1000 else resume_text,
                        "skills": [],
                        "experience": [],
                        "education": [],
                        "certifications": [],
                        "projects": []
                    }
                    return minimal_json
            except Exception as inner_e:
                logger.error(f"Special handling failed: {inner_e}")
        
        return {
            "error": f"Failed to extract resume data: {str(e)}",
            "name": "",
            "title": "",
            "email": "",
            "phone": "",
            "location": "",
            "summary": "",
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": []
        }

def optimize_resume_ats100_style(resume_text, plan="free"):
    # This prompt is more aggressive for ATS
    return run_prompt(
        "optimize_resume_ats100",
        plan,
        resume_text=resume_text
    )
