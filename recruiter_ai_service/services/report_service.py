"""
Report Generation Service
Generates comprehensive reports using AI
"""

import logging
import json
from typing import Dict, Any, List
from datetime import datetime
from utils.openai_utils import call_openai_with_cache

logger = logging.getLogger(__name__)

class ReportService:
    def __init__(self, db_service, cache_service):
        self.db = db_service
        self.cache_service = cache_service
    
    async def generate_report(
        self,
        report_type: str,
        job_description_id: str,
        resume_analysis_ids: List[str],
        user_id: str,
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive reports
        
        Args:
            report_type: Type of report (summary, detailed, comparison)
            job_description_id: Job description ID
            resume_analysis_ids: List of analysis IDs
            user_id: User ID
            plan_type: Subscription plan
            
        Returns:
            Generated report data
        """
        try:
            logger.info(f"Generating {report_type} report for user {user_id}")
            
            # Get job description
            job_data = await self._get_job_description(job_description_id)
            if not job_data:
                raise Exception("Job description not found")
            
            # Get analysis data
            analyses_data = []
            for analysis_id in resume_analysis_ids:
                analysis = await self._get_analysis_data(analysis_id)
                if analysis:
                    analyses_data.append(analysis)
            
            if not analyses_data:
                raise Exception("No analysis data found")
            
            # Generate report based on type
            if report_type == "summary":
                report_content = await self._generate_summary_report(
                    job_data, analyses_data, plan_type
                )
            elif report_type == "detailed":
                report_content = await self._generate_detailed_report(
                    job_data, analyses_data, plan_type
                )
            elif report_type == "comparison":
                report_content = await self._generate_comparison_report(
                    job_data, analyses_data, plan_type
                )
            else:
                raise Exception(f"Unknown report type: {report_type}")
            
            # Create final report
            report_result = {
                "report_id": f"report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "report_type": report_type,
                "job_description_id": job_description_id,
                "user_id": user_id,
                "candidates_count": len(analyses_data),
                "generated_at": datetime.utcnow().isoformat(),
                "plan_type": plan_type,
                **report_content
            }
            
            # Store report
            report_id = await self._store_report(report_result)
            report_result["stored_report_id"] = report_id
            
            return report_result
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise Exception(f"Failed to generate report: {str(e)}")
    
    async def _get_job_description(self, job_description_id: str) -> Dict[str, Any]:
        """Get job description data"""
        try:
            query = """
                SELECT id, title, description, requirements, company_name, location
                FROM job_descriptions 
                WHERE id = %s
            """
            
            return await self.db.fetch_one(query, (job_description_id,))
            
        except Exception as e:
            logger.error(f"Error getting job description: {str(e)}")
            return None
    
    async def _get_analysis_data(self, analysis_id: str) -> Dict[str, Any]:
        """Get analysis data with resume info"""
        try:
            query = """
                SELECT ra.*, r.file_name, r.extracted_data
                FROM resume_analysis ra
                JOIN resumes r ON ra.resume_id = r.id
                WHERE ra.id = %s
            """
            
            result = await self.db.fetch_one(query, (analysis_id,))
            
            if result and result["extracted_data"]:
                try:
                    extracted_data = json.loads(result["extracted_data"])
                    result.update(extracted_data)
                except json.JSONDecodeError:
                    pass
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting analysis data: {str(e)}")
            return None
    
    async def _generate_summary_report(
        self,
        job_data: Dict[str, Any],
        analyses_data: List[Dict[str, Any]],
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate summary report"""
        try:
            # Create summary statistics
            total_candidates = len(analyses_data)
            avg_match_score = sum(a.get("match_score", 0) for a in analyses_data) / total_candidates
            top_candidates = sorted(analyses_data, key=lambda x: x.get("match_score", 0), reverse=True)[:3]
            
            # Generate AI summary
            prompt = self._create_summary_report_prompt(job_data, analyses_data, plan_type)
            
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.2,
                max_tokens=1000,
                cache_service=self.cache_service,
                cache_type="report",
                cache_ttl_hours=6
            )
            
            return {
                "report_content": response,
                "statistics": {
                    "total_candidates": total_candidates,
                    "average_match_score": round(avg_match_score, 2),
                    "top_candidates": [
                        {
                            "name": c.get("name", "Unknown"),
                            "match_score": c.get("match_score", 0),
                            "file_name": c.get("file_name", "")
                        }
                        for c in top_candidates
                    ]
                },
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "generation_cost": cost
            }
            
        except Exception as e:
            logger.error(f"Error generating summary report: {str(e)}")
            return self._get_default_summary_report(analyses_data)
    
    async def _generate_detailed_report(
        self,
        job_data: Dict[str, Any],
        analyses_data: List[Dict[str, Any]],
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate detailed report"""
        try:
            # Create detailed prompt
            prompt = self._create_detailed_report_prompt(job_data, analyses_data, plan_type)
            
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.1,
                max_tokens=2000,
                cache_service=self.cache_service,
                cache_type="report",
                cache_ttl_hours=6
            )
            
            # Parse response
            try:
                detailed_data = json.loads(response)
            except json.JSONDecodeError:
                detailed_data = {"report_content": response}
            
            # Add candidate details
            candidate_details = []
            for analysis in analyses_data:
                candidate_details.append({
                    "name": analysis.get("name", "Unknown"),
                    "file_name": analysis.get("file_name", ""),
                    "match_score": analysis.get("match_score", 0),
                    "skill_match_score": analysis.get("skill_match_score", 0),
                    "experience_score": analysis.get("experience_score", 0),
                    "education_score": analysis.get("education_score", 0),
                    "strengths": analysis.get("strengths", []),
                    "weaknesses": analysis.get("weaknesses", []),
                    "recommendations": analysis.get("recommendations", [])
                })
            
            detailed_data.update({
                "candidate_details": candidate_details,
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "generation_cost": cost
            })
            
            return detailed_data
            
        except Exception as e:
            logger.error(f"Error generating detailed report: {str(e)}")
            return self._get_default_detailed_report(analyses_data)
    
    async def _generate_comparison_report(
        self,
        job_data: Dict[str, Any],
        analyses_data: List[Dict[str, Any]],
        plan_type: str
    ) -> Dict[str, Any]:
        """Generate comparison report"""
        try:
            # Create comparison prompt
            prompt = self._create_comparison_report_prompt(job_data, analyses_data, plan_type)
            
            response, usage, cost = await call_openai_with_cache(
                messages=prompt,
                plan=plan_type,
                temperature=0.2,
                max_tokens=1500,
                cache_service=self.cache_service,
                cache_type="report",
                cache_ttl_hours=6
            )
            
            # Create comparison matrix
            comparison_matrix = []
            for analysis in analyses_data:
                comparison_matrix.append({
                    "candidate": analysis.get("name", "Unknown"),
                    "match_score": analysis.get("match_score", 0),
                    "skills": analysis.get("skill_match_score", 0),
                    "experience": analysis.get("experience_score", 0),
                    "education": analysis.get("education_score", 0),
                    "overall_rank": 0  # Will be calculated
                })
            
            # Calculate ranks
            comparison_matrix.sort(key=lambda x: x["match_score"], reverse=True)
            for i, candidate in enumerate(comparison_matrix):
                candidate["overall_rank"] = i + 1
            
            return {
                "report_content": response,
                "comparison_matrix": comparison_matrix,
                "ai_model_used": f"gpt-3.5-turbo" if plan_type in ["free", "basic"] else "gpt-4",
                "tokens_used": usage.total_tokens if usage else 0,
                "generation_cost": cost
            }
            
        except Exception as e:
            logger.error(f"Error generating comparison report: {str(e)}")
            return self._get_default_comparison_report(analyses_data)
    
    def _create_summary_report_prompt(self, job_data: Dict[str, Any], analyses_data: List[Dict[str, Any]], plan_type: str) -> list:
        """Create prompt for summary report"""
        
        candidates_summary = ""
        for i, analysis in enumerate(analyses_data, 1):
            candidates_summary += f"""
            Candidate {i}: {analysis.get('name', 'Unknown')}
            - Match Score: {analysis.get('match_score', 0)}%
            - Key Skills: {', '.join(analysis.get('skills', [])[:5])}
            - Experience: {len(analysis.get('experience', []))} positions
            """
        
        prompt = f"""
        Generate a concise executive summary report for the following recruitment analysis:
        
        Job Position: {job_data['title']} at {job_data.get('company_name', 'Company')}
        
        Candidates Analyzed: {len(analyses_data)}
        {candidates_summary}
        
        Provide:
        1. Overall assessment of candidate pool
        2. Top 3 recommendations
        3. Key insights and trends
        4. Next steps for hiring manager
        
        Keep the summary professional and actionable.
        """
        
        return [{"role": "user", "content": prompt}]
    
    def _create_detailed_report_prompt(self, job_data: Dict[str, Any], analyses_data: List[Dict[str, Any]], plan_type: str) -> list:
        """Create prompt for detailed report"""
        
        detailed_info = f"""
        Job Details:
        - Title: {job_data['title']}
        - Company: {job_data.get('company_name', 'Not specified')}
        - Location: {job_data.get('location', 'Not specified')}
        - Requirements: {job_data.get('requirements', 'Not specified')[:500]}
        
        Candidate Analysis Results:
        """
        
        for i, analysis in enumerate(analyses_data, 1):
            detailed_info += f"""
            
            Candidate {i}: {analysis.get('name', 'Unknown')}
            - Overall Match: {analysis.get('match_score', 0)}%
            - Skills Match: {analysis.get('skill_match_score', 0)}%
            - Experience Match: {analysis.get('experience_score', 0)}%
            - Education Match: {analysis.get('education_score', 0)}%
            - Strengths: {', '.join(analysis.get('strengths', [])[:3])}
            - Areas for Development: {', '.join(analysis.get('weaknesses', [])[:3])}
            """
        
        prompt = f"""
        Generate a comprehensive recruitment report with the following structure:
        
        {detailed_info}
        
        Please provide a detailed analysis including:
        1. Executive Summary
        2. Individual Candidate Assessments
        3. Comparative Analysis
        4. Hiring Recommendations
        5. Risk Assessment
        6. Next Steps
        
        Format as a professional recruitment report.
        """
        
        if plan_type == "premium":
            prompt += """
            
            Additionally include:
            - Market salary benchmarking insights
            - Cultural fit assessment
            - Long-term potential evaluation
            - Interview question suggestions
            """
        
        return [{"role": "user", "content": prompt}]
    
    def _create_comparison_report_prompt(self, job_data: Dict[str, Any], analyses_data: List[Dict[str, Any]], plan_type: str) -> list:
        """Create prompt for comparison report"""
        
        comparison_data = f"""
        Position: {job_data['title']}
        
        Candidates for Comparison:
        """
        
        for i, analysis in enumerate(analyses_data, 1):
            comparison_data += f"""
            
            Candidate {i}: {analysis.get('name', 'Unknown')}
            - Match Score: {analysis.get('match_score', 0)}%
            - Key Skills: {', '.join(analysis.get('skills', [])[:5])}
            - Experience Level: {len(analysis.get('experience', []))} positions
            - Education: {', '.join([edu.get('degree', '') for edu in analysis.get('education', [])])}
            """
        
        prompt = f"""
        Create a side-by-side comparison report for these candidates:
        
        {comparison_data}
        
        Provide:
        1. Comparative strengths and weaknesses
        2. Best fit for different aspects of the role
        3. Ranking with justification
        4. Interview and hiring recommendations
        5. Risk factors for each candidate
        
        Present in a clear, decision-making format.
        """
        
        return [{"role": "user", "content": prompt}]
    
    def _get_default_summary_report(self, analyses_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Default summary report structure"""
        total_candidates = len(analyses_data)
        avg_score = sum(a.get("match_score", 0) for a in analyses_data) / total_candidates if total_candidates > 0 else 0
        
        return {
            "report_content": f"Summary report for {total_candidates} candidates with average match score of {avg_score:.1f}%",
            "statistics": {
                "total_candidates": total_candidates,
                "average_match_score": round(avg_score, 2),
                "top_candidates": []
            }
        }
    
    def _get_default_detailed_report(self, analyses_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Default detailed report structure"""
        return {
            "report_content": "Detailed analysis report could not be generated",
            "candidate_details": []
        }
    
    def _get_default_comparison_report(self, analyses_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Default comparison report structure"""
        return {
            "report_content": "Comparison report could not be generated",
            "comparison_matrix": []
        }
    
    async def _store_report(self, report_data: Dict[str, Any]) -> str:
        """Store report in database"""
        try:
            query = """
                INSERT INTO generated_reports (
                    user_id, job_description_id, report_type,
                    report_content, report_metadata
                ) VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """
            
            metadata = {
                "candidates_count": report_data.get("candidates_count", 0),
                "ai_model_used": report_data.get("ai_model_used", "gpt-3.5-turbo"),
                "tokens_used": report_data.get("tokens_used", 0),
                "generation_cost": report_data.get("generation_cost", 0.0),
                "plan_type": report_data.get("plan_type", "free"),
                "generated_at": report_data.get("generated_at", "")
            }
            
            result = await self.db.fetch_one(
                query,
                (
                    report_data["user_id"],
                    report_data["job_description_id"],
                    report_data["report_type"],
                    json.dumps({
                        "content": report_data.get("report_content", ""),
                        "statistics": report_data.get("statistics", {}),
                        "candidate_details": report_data.get("candidate_details", []),
                        "comparison_matrix": report_data.get("comparison_matrix", [])
                    }),
                    json.dumps(metadata)
                )
            )
            
            return result["id"] if result else None
            
        except Exception as e:
            logger.error(f"Error storing report: {str(e)}")
            return None