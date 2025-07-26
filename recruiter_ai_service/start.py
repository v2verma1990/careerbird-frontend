#!/usr/bin/env python3
"""
Startup script for Recruiter AI Service
"""

import os
import sys
import logging
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('recruiter_ai.log')
    ]
)

logger = logging.getLogger(__name__)

def check_environment():
    """Check required environment variables"""
    required_vars = [
        "OPENAI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please set these variables in your .env file or environment")
        return False
    
    return True

def main():
    """Main startup function"""
    logger.info("Starting Recruiter AI Service...")
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Start the service
    try:
        import uvicorn
        from main import app
        
        # Configuration
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", "8001"))
        
        logger.info(f"Starting server on {host}:{port}")
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            reload=os.getenv("ENVIRONMENT", "production") == "development"
        )
        
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()