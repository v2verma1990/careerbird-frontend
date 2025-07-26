"""
Multi-Tier Vector Service for Recruiter AI
- Free Plan: Supabase Vector (pgvector)
- Basic Plan: Pinecone (better performance)
- Premium Plan: Pinecone + Advanced features
"""

import os
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class VectorService:
    """
    Multi-tier vector service supporting different plans
    """
    
    def __init__(self, db_service):
        self.db = db_service
        self.pinecone_client = None
        self.pinecone_index = None
        
        # Initialize Pinecone for Basic/Premium plans
        self._initialize_pinecone()
        
        logger.info("Multi-tier vector service initialized")
    
    def _initialize_pinecone(self):
        """Initialize Pinecone for Basic/Premium plans"""
        if os.getenv("PINECONE_API_KEY"):
            try:
                import pinecone
                pinecone.init(
                    api_key=os.getenv("PINECONE_API_KEY"),
                    environment=os.getenv("PINECONE_ENVIRONMENT", "us-east-1-aws")
                )
                
                index_name = os.getenv("PINECONE_INDEX_NAME", "resume-analysis")
                if index_name in pinecone.list_indexes():
                    self.pinecone_index = pinecone.Index(index_name)
                    logger.info("Pinecone initialized successfully")
                else:
                    logger.warning(f"Pinecone index '{index_name}' not found")
                    
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone: {str(e)}")
    
    def _get_vector_provider(self, plan_type: str) -> str:
        """Determine vector provider based on plan"""
        plan_lower = plan_type.lower()
        
        if plan_lower == "free":
            return "supabase"
        elif plan_lower in ["basic", "premium"]:
            return "pinecone" if self.pinecone_index else "supabase"
        else:
            return "supabase"
    
    def _get_embedding_model(self, plan_type: str) -> str:
        """Get embedding model based on plan"""
        if plan_type.lower() == "premium":
            return "text-embedding-3-large"  # 3072 dimensions
        else:
            return "text-embedding-ada-002"  # 1536 dimensions
    
    def _get_embedding_dimensions(self, plan_type: str) -> int:
        """Get embedding dimensions based on plan"""
        return 3072 if plan_type.lower() == "premium" else 1536
    
    def _get_max_candidates(self, plan_type: str) -> int:
        """Get maximum candidates based on plan"""
        limits = {
            "free": 5,
            "basic": 15,
            "premium": 50
        }
        return limits.get(plan_type.lower(), 5)
    
    async def store_resume_embeddings(
        self,
        resume_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        plan_type: str = "free"
    ) -> bool:
        """
        Store resume embeddings based on plan
        """
        try:
            provider = self._get_vector_provider(plan_type)
            
            if provider == "pinecone" and self.pinecone_index:
                return await self._store_in_pinecone(resume_id, chunks, embeddings, plan_type)
            else:
                return await self._store_in_supabase(resume_id, chunks, embeddings, plan_type)
                
        except Exception as e:
            logger.error(f"Error storing resume embeddings: {str(e)}")
            return False
    
    async def _store_in_pinecone(
        self,
        resume_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        plan_type: str
    ) -> bool:
        """Store embeddings in Pinecone"""
        try:
            # Prepare vectors for Pinecone
            vectors = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{resume_id}_{i}"
                metadata = {
                    "resume_id": resume_id,
                    "chunk_index": i,
                    "chunk_text": chunk[:1000],  # Pinecone metadata limit
                    "plan_type": plan_type,
                    "model_version": self._get_embedding_model(plan_type),
                    "created_at": datetime.utcnow().isoformat()
                }
                vectors.append((vector_id, embedding, metadata))
            
            # Upsert to Pinecone
            self.pinecone_index.upsert(vectors)
            
            # Also store metadata in Supabase for backup
            await self._store_metadata_in_supabase(resume_id, chunks, embeddings, plan_type, "pinecone")
            
            logger.info(f"Stored {len(embeddings)} embeddings in Pinecone for resume {resume_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing in Pinecone: {str(e)}")
            return False
    
    async def _store_in_supabase(
        self,
        resume_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        plan_type: str
    ) -> bool:
        """Store embeddings in Supabase Vector"""
        try:
            embedding_data = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                embedding_data.append({
                    "resume_id": resume_id,
                    "chunk_index": i,
                    "chunk_text": chunk,
                    "embedding": embedding,
                    "model_version": self._get_embedding_model(plan_type),
                    "plan_type": plan_type,
                    "created_at": datetime.utcnow().isoformat()
                })
            
            success = await self.db.store_resume_embeddings(embedding_data)
            
            if success:
                logger.info(f"Stored {len(embeddings)} embeddings in Supabase for resume {resume_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error storing in Supabase: {str(e)}")
            return False
    
    async def _store_metadata_in_supabase(
        self,
        resume_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        plan_type: str,
        vector_provider: str
    ) -> bool:
        """Store metadata in Supabase for backup/reference"""
        try:
            metadata = {
                "resume_id": resume_id,
                "vector_provider": vector_provider,
                "chunk_count": len(chunks),
                "embedding_dimensions": len(embeddings[0]) if embeddings else 0,
                "model_version": self._get_embedding_model(plan_type),
                "plan_type": plan_type,
                "created_at": datetime.utcnow().isoformat()
            }
            
            return await self.db.store_vector_metadata(metadata)
            
        except Exception as e:
            logger.error(f"Error storing metadata: {str(e)}")
            return False
    
    async def find_similar_candidates(
        self,
        job_embedding: List[float],
        limit: int = 10,
        threshold: float = 0.7,
        plan_type: str = "free",
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar candidates using appropriate vector provider
        """
        try:
            provider = self._get_vector_provider(plan_type)
            max_limit = self._get_max_candidates(plan_type)
            limit = min(limit, max_limit)
            
            if provider == "pinecone" and self.pinecone_index:
                return await self._search_pinecone(job_embedding, limit, threshold, filters)
            else:
                return await self._search_supabase(job_embedding, limit, threshold, filters)
                
        except Exception as e:
            logger.error(f"Error finding similar candidates: {str(e)}")
            return []
    
    async def _search_pinecone(
        self,
        job_embedding: List[float],
        limit: int,
        threshold: float,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search using Pinecone"""
        try:
            # Build Pinecone filter
            pinecone_filter = {}
            if filters:
                for key, value in filters.items():
                    pinecone_filter[key] = {"$eq": value}
            
            # Query Pinecone
            results = self.pinecone_index.query(
                vector=job_embedding,
                top_k=limit,
                include_metadata=True,
                filter=pinecone_filter if pinecone_filter else None
            )
            
            # Process results
            processed_results = []
            for match in results.matches:
                if match.score >= threshold:
                    processed_results.append({
                        "resume_id": match.metadata.get("resume_id"),
                        "similarity_score": float(match.score),
                        "match_percentage": round(match.score * 100, 2),
                        "chunk_text": match.metadata.get("chunk_text", ""),
                        "model_version": match.metadata.get("model_version", ""),
                        "metadata": match.metadata,
                        "vector_provider": "pinecone"
                    })
            
            logger.info(f"Found {len(processed_results)} candidates using Pinecone")
            return processed_results
            
        except Exception as e:
            logger.error(f"Error searching Pinecone: {str(e)}")
            return []
    
    async def _search_supabase(
        self,
        job_embedding: List[float],
        limit: int,
        threshold: float,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search using Supabase Vector"""
        try:
            similar_resumes = await self.db.vector_similarity_search(
                query_embedding=job_embedding,
                limit=limit,
                threshold=threshold,
                filters=filters
            )
            
            processed_results = []
            for resume in similar_resumes:
                similarity_score = float(resume.get("similarity", 0))
                
                processed_results.append({
                    "resume_id": resume["resume_id"],
                    "similarity_score": similarity_score,
                    "match_percentage": round(similarity_score * 100, 2),
                    "chunk_text": resume.get("chunk_text", ""),
                    "model_version": resume.get("model_version", ""),
                    "metadata": resume.get("metadata", {}),
                    "vector_provider": "supabase"
                })
            
            logger.info(f"Found {len(processed_results)} candidates using Supabase")
            return processed_results
            
        except Exception as e:
            logger.error(f"Error searching Supabase: {str(e)}")
            return []
    
    async def store_job_embeddings(
        self,
        job_id: str,
        job_text: str,
        embedding: List[float],
        plan_type: str = "free"
    ) -> bool:
        """Store job description embeddings"""
        try:
            provider = self._get_vector_provider(plan_type)
            
            if provider == "pinecone" and self.pinecone_index:
                # Store in Pinecone
                metadata = {
                    "job_id": job_id,
                    "job_text": job_text[:1000],  # Pinecone limit
                    "plan_type": plan_type,
                    "model_version": self._get_embedding_model(plan_type),
                    "created_at": datetime.utcnow().isoformat()
                }
                
                self.pinecone_index.upsert([(f"job_{job_id}", embedding, metadata)])
            
            # Always store in Supabase for backup/reference
            embedding_data = {
                "job_description_id": job_id,
                "job_text": job_text,
                "embedding": embedding,
                "model_version": self._get_embedding_model(plan_type),
                "plan_type": plan_type,
                "vector_provider": provider,
                "created_at": datetime.utcnow().isoformat()
            }
            
            success = await self.db.store_job_embeddings(embedding_data)
            
            if success:
                logger.info(f"Stored job embedding for job {job_id} using {provider}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error storing job embeddings: {str(e)}")
            return False
    
    async def get_vector_stats(self, user_id: str) -> Dict[str, Any]:
        """Get vector storage statistics"""
        try:
            stats = await self.db.get_embedding_stats(user_id)
            
            # Add provider information
            stats["providers"] = {
                "supabase": {
                    "available": True,
                    "plans": ["free", "basic", "premium"]
                },
                "pinecone": {
                    "available": self.pinecone_index is not None,
                    "plans": ["basic", "premium"]
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting vector stats: {str(e)}")
            return {}
    
    async def clear_cache(self, user_id: str, plan_type: str = "free") -> bool:
        """Clear cached embeddings"""
        try:
            provider = self._get_vector_provider(plan_type)
            
            # Clear from Supabase
            supabase_success = await self.db.clear_user_embeddings(user_id)
            
            # Clear from Pinecone if applicable
            pinecone_success = True
            if provider == "pinecone" and self.pinecone_index:
                try:
                    # Note: Pinecone doesn't have direct user-based deletion
                    # This would require tracking vector IDs by user
                    logger.info("Pinecone cache clearing requires manual implementation")
                except Exception as e:
                    logger.error(f"Error clearing Pinecone cache: {str(e)}")
                    pinecone_success = False
            
            return supabase_success and pinecone_success
            
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False