"""
Resume Parser Service
Handles document parsing and structured data extraction using OpenAI
"""

import os
import logging
import json
from typing import Dict, Any, Optional
from pathlib import Path
import PyPDF2
import docx
from utils.openai_utils import call_openai_with_cache

logger = logging.getLogger(__name__)

class ResumeParserService:
    def __init__(self, cache_service):
        self.cache_service = cache_service
    
    async def parse_resume(
        self,
        file_path: str,
        file_name: str,
        user_id: str,
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Parse resume file and extract structured data
        
        Args:
            file_path: Path to the resume file
            file_name: Original filename
            user_id: User ID for tracking
            plan_type: Subscription plan
            
        Returns:
            Structured resume data
        """
        try:
            logger.info(f"Parsing resume: {file_name} for user: {user_id}")
            
            # Extract text from file
            text_content = await self._extract_text_from_file(file_path, file_name)
            
            if not text_content:
                raise Exception("Could not extract text from resume")
            
            # Use OpenAI to structure the data
            structured_data = await self._extract_structured_data(
                text_content, plan_type
            )
            
            # Add metadata
            structured_data.update({
                "file_name": file_name,
                "user_id": user_id,
                "full_text": text_content,
                "parsing_method": "openai_gpt",
                "plan_type": plan_type
            })
            
            return structured_data
            
        except Exception as e:
            logger.error(f"Error parsing resume {file_name}: {str(e)}")
            raise Exception(f"Failed to parse resume: {str(e)}")
    
    async def _extract_text_from_file(self, file_path: str, file_name: str) -> str:
        """Extract text content from various file formats"""
        try:
            file_extension = Path(file_name).suffix.lower()
            
            if file_extension == '.pdf':
                return await self._extract_from_pdf(file_path)
            elif file_extension in ['.docx', '.doc']:
                return await self._extract_from_docx(file_path)
            elif file_extension == '.txt':
                return await self._extract_from_txt(file_path)
            else:
                raise Exception(f"Unsupported file format: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_name}: {str(e)}")
            raise
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from PDF: {str(e)}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    async def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from DOCX: {str(e)}")
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")
    
    async def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
                
        except Exception as e:
            logger.error(f"Error extracting from TXT: {str(e)}")
            raise Exception(f"Failed to extract text from TXT: {str(e)}")
    
    async def _extract_structured_data(self, text_content: str, plan_type: str) -> Dict[str, Any]:
        """Use OpenAI to extract structured data from resume text"""
        try:
            # Create prompt for structured extraction
            prompt = self._create_extraction_prompt(text_content, plan_type)
            
            # Call OpenAI with caching
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.0,
                max_tokens=2000,
                cache_service=self.cache_service,
                cache_type="resume_parsing",
                cache_ttl_hours=168  # 1 week cache for parsing
            )
            
            # Parse JSON response
            try:
                structured_data = json.loads(response)
            except json.JSONDecodeError:
                # Fallback parsing if JSON is malformed
                structured_data = self._fallback_parsing(response)
            
            # Validate and clean data
            structured_data = self._validate_and_clean_data(structured_data)
            
            return structured_data
            
        except Exception as e:
            logger.error(f"Error extracting structured data: {str(e)}")
            # Return basic structure with raw text
            return {
                "name": "",
                "title": "",
                "email": "",
                "phone": "",
                "location": "",
                "summary": text_content[:500],  # First 500 chars as summary
                "skills": [],
                "experience": [],
                "education": [],
                "certifications": [],
                "projects": [],
                "parsing_error": str(e)
            }
    
    def _create_extraction_prompt(self, text_content: str, plan_type: str) -> list:
        """Create prompt for OpenAI to extract structured data"""
        
        base_prompt = f"""
        Extract structured information from this resume text and return it as JSON.
        
        Resume Text:
        {text_content}
        
        Extract the following information:
        {{
            "name": "Full name",
            "title": "Current job title or desired position",
            "email": "Email address",
            "phone": "Phone number",
            "location": "City, State/Country",
            "linkedin": "LinkedIn profile URL",
            "website": "Personal website URL",
            "summary": "Professional summary or objective",
            "skills": ["skill1", "skill2", "skill3"],
            "experience": [
                {{
                    "company": "Company name",
                    "position": "Job title",
                    "start_date": "Start date",
                    "end_date": "End date or 'Present'",
                    "description": "Job description and achievements",
                    "technologies": ["tech1", "tech2"]
                }}
            ],
            "education": [
                {{
                    "institution": "School name",
                    "degree": "Degree type and field",
                    "graduation_date": "Graduation date",
                    "gpa": "GPA if mentioned"
                }}
            ],
            "certifications": [
                {{
                    "name": "Certification name",
                    "issuer": "Issuing organization",
                    "date": "Date obtained",
                    "expiry": "Expiry date if applicable"
                }}
            ],
            "projects": [
                {{
                    "name": "Project name",
                    "description": "Project description",
                    "technologies": ["tech1", "tech2"],
                    "url": "Project URL if available"
                }}
            ]
        }}
        
        Rules:
        1. Extract only information that is explicitly present in the text
        2. Use empty strings for missing text fields
        3. Use empty arrays for missing list fields
        4. Ensure all dates are in a consistent format
        5. Clean and normalize the data
        """
        
        if plan_type == "premium":
            base_prompt += """
            
            For premium users, also extract:
            - Detailed skill categorization (technical, soft, domain-specific)
            - Achievement metrics and quantifiable results
            - Career progression analysis
            - Industry-specific keywords
            """
        
        base_prompt += "\n\nReturn only valid JSON, no additional text."
        
        return [{"role": "user", "content": base_prompt}]
    
    def _fallback_parsing(self, response: str) -> Dict[str, Any]:
        """Fallback parsing when JSON parsing fails"""
        logger.warning("JSON parsing failed, using fallback parsing")
        
        # Basic regex-based extraction as fallback
        import re
        
        result = {
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
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', response)
        if email_match:
            result["email"] = email_match.group()
        
        # Extract phone
        phone_match = re.search(r'[\+]?[1-9]?[\d\s\-\(\)]{10,}', response)
        if phone_match:
            result["phone"] = phone_match.group()
        
        # Try to extract name from first line or common patterns
        lines = response.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            if len(line.strip()) > 0 and len(line.strip()) < 50:
                # Likely a name if it's short and contains letters
                if re.match(r'^[A-Za-z\s\.]+$', line.strip()):
                    result["name"] = line.strip()
                    break
        
        return result
    
    def _validate_and_clean_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean extracted data"""
        
        # Ensure required fields exist
        required_fields = [
            "name", "title", "email", "phone", "location", "summary",
            "skills", "experience", "education", "certifications", "projects"
        ]
        
        for field in required_fields:
            if field not in data:
                if field in ["skills", "experience", "education", "certifications", "projects"]:
                    data[field] = []
                else:
                    data[field] = ""
        
        # Clean string fields
        string_fields = ["name", "title", "email", "phone", "location", "summary"]
        for field in string_fields:
            if isinstance(data[field], str):
                data[field] = data[field].strip()
        
        # Validate email format
        if data["email"]:
            import re
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            if not re.match(email_pattern, data["email"]):
                data["email"] = ""
        
        # Ensure arrays are actually arrays
        array_fields = ["skills", "experience", "education", "certifications", "projects"]
        for field in array_fields:
            if not isinstance(data[field], list):
                data[field] = []
        
        # Clean skills array
        if data["skills"]:
            data["skills"] = [skill.strip() for skill in data["skills"] if skill and skill.strip()]
        
        return data