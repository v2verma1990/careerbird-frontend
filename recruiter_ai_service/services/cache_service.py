"""
Cache Service for Recruiter AI
Implements cost-saving caching using Supabase database
Similar to candidate dashboard caching strategy
"""

import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self, db_service):
        self.db = db_service
        
    async def get_cached_result(self, cache_key: str, cache_type: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached result if it exists and hasn't expired
        
        Args:
            cache_key: Unique cache key
            cache_type: Type of cache (embedding, analysis, comparison, etc.)
            
        Returns:
            Cached result or None if not found/expired
        """
        try:
            query = """
                SELECT output_data, model_used, tokens_used, cost_usd, expires_at
                FROM ai_cache 
                WHERE cache_key = %s AND cache_type = %s AND expires_at > NOW()
            """
            
            result = await self.db.fetch_one(query, (cache_key, cache_type))
            
            if result:
                logger.info(f"Cache hit for {cache_type} key: {cache_key[:8]}...")
                return {
                    "output_data": result["output_data"],
                    "model_used": result["model_used"],
                    "tokens_used": result["tokens_used"],
                    "cost_usd": result["cost_usd"]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    async def cache_result(
        self,
        cache_key: str,
        cache_type: str,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        model_used: str,
        tokens_used: int,
        cost_usd: float,
        ttl_hours: int = 24
    ) -> bool:
        """
        Cache a result with expiration
        
        Args:
            cache_key: Unique cache key
            cache_type: Type of cache
            input_data: Input data for hash generation
            output_data: Result to cache
            model_used: OpenAI model used
            tokens_used: Number of tokens consumed
            cost_usd: Cost in USD
            ttl_hours: Time to live in hours
            
        Returns:
            True if cached successfully
        """
        try:
            # Generate input hash
            input_hash = hashlib.sha256(
                json.dumps(input_data, sort_keys=True).encode()
            ).hexdigest()
            
            expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
            
            query = """
                INSERT INTO ai_cache (
                    cache_key, cache_type, input_hash, output_data, 
                    model_used, tokens_used, cost_usd, expires_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (cache_key) DO UPDATE SET
                    output_data = EXCLUDED.output_data,
                    model_used = EXCLUDED.model_used,
                    tokens_used = EXCLUDED.tokens_used,
                    cost_usd = EXCLUDED.cost_usd,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
            """
            
            await self.db.execute(
                query,
                (
                    cache_key, cache_type, input_hash, json.dumps(output_data),
                    model_used, tokens_used, cost_usd, expires_at
                )
            )
            
            logger.info(f"Cached {cache_type} result | key: {cache_key[:8]}... | cost: ${cost_usd:.4f}")
            return True
            
        except Exception as e:
            logger.error(f"Error caching result: {str(e)}")
            return False
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        try:
            stats_query = """
                SELECT 
                    cache_type,
                    COUNT(*) as total_entries,
                    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
                    SUM(tokens_used) as total_tokens,
                    SUM(cost_usd) as total_cost_saved,
                    AVG(cost_usd) as avg_cost_per_entry
                FROM ai_cache 
                GROUP BY cache_type
            """
            
            results = await self.db.fetch_all(stats_query)
            
            stats = {
                "cache_types": {},
                "total_entries": 0,
                "total_active": 0,
                "total_tokens_saved": 0,
                "total_cost_saved": 0.0
            }
            
            for row in results:
                cache_type = row["cache_type"]
                stats["cache_types"][cache_type] = {
                    "total_entries": row["total_entries"],
                    "active_entries": row["active_entries"],
                    "total_tokens": row["total_tokens"] or 0,
                    "total_cost_saved": float(row["total_cost_saved"] or 0),
                    "avg_cost_per_entry": float(row["avg_cost_per_entry"] or 0)
                }
                
                stats["total_entries"] += row["total_entries"]
                stats["total_active"] += row["active_entries"]
                stats["total_tokens_saved"] += row["total_tokens"] or 0
                stats["total_cost_saved"] += float(row["total_cost_saved"] or 0)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {"error": str(e)}
    
    async def clear_expired_cache(self) -> int:
        """Clear expired cache entries"""
        try:
            delete_query = "DELETE FROM ai_cache WHERE expires_at <= NOW()"
            result = await self.db.execute(delete_query)
            
            # Get count of deleted rows (implementation depends on your DB driver)
            count_query = "SELECT changes()" # SQLite syntax, adjust for PostgreSQL
            # For PostgreSQL, you might need to use RETURNING or check result
            
            logger.info(f"Cleared expired cache entries")
            return 0  # Return actual count based on your DB implementation
            
        except Exception as e:
            logger.error(f"Error clearing expired cache: {str(e)}")
            return 0
    
    async def invalidate_cache_by_type(self, cache_type: str) -> bool:
        """Invalidate all cache entries of a specific type"""
        try:
            query = "DELETE FROM ai_cache WHERE cache_type = %s"
            await self.db.execute(query, (cache_type,))
            
            logger.info(f"Invalidated all {cache_type} cache entries")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {str(e)}")
            return False
    
    async def get_cache_hit_rate(self, cache_type: Optional[str] = None) -> Dict[str, float]:
        """
        Calculate cache hit rate (would need to track hits/misses)
        This is a placeholder - implement based on your tracking needs
        """
        try:
            # This would require additional tracking in your application
            # For now, return a placeholder
            return {
                "hit_rate": 0.0,
                "total_requests": 0,
                "cache_hits": 0,
                "cache_misses": 0
            }
            
        except Exception as e:
            logger.error(f"Error calculating hit rate: {str(e)}")
            return {"error": str(e)}