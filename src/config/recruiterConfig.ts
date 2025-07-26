// Recruiter Dashboard Configuration
// This file contains all configurable settings for the recruiter features

export interface VectorDBConfig {
  provider: 'supabase' | 'pinecone' | 'faiss' | 'chroma';
  apiKey?: string;
  environment?: string;
  indexName?: string;
  dimension: number;
}

export interface LLMConfig {
  provider: 'openai' | 'claude' | 'mistral';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ProcessingConfig {
  method: 'redis' | 'azure-functions' | 'aws-lambda' | 'direct';
  connectionString?: string;
  queueName?: string;
  maxConcurrency: number;
  timeout: number;
}

export interface PlanConfig {
  free: {
    vectorDB: VectorDBConfig;
    processing: ProcessingConfig;
    features: string[];
  };
  basic: {
    vectorDB: VectorDBConfig;
    processing: ProcessingConfig;
    features: string[];
  };
  premium: {
    vectorDB: VectorDBConfig;
    processing: ProcessingConfig;
    features: string[];
  };
}

// Vector Database Configurations
const vectorDBConfigs: Record<string, VectorDBConfig> = {
  supabase: {
    provider: 'supabase',
    dimension: 1536, // OpenAI embedding dimension
  },
  pinecone: {
    provider: 'pinecone',
    apiKey: process.env.VITE_PINECONE_API_KEY,
    environment: process.env.VITE_PINECONE_ENVIRONMENT || 'us-east-1-aws',
    indexName: process.env.VITE_PINECONE_INDEX_NAME || 'resume-analysis',
    dimension: 1536,
  },
};

// LLM Configurations - Check candidate dashboard for OpenAI usage patterns
const llmConfigs: Record<string, LLMConfig> = {
  openai: {
    provider: 'openai',
    apiKey: process.env.VITE_OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview', // Same as candidate dashboard
    maxTokens: 4000,
    temperature: 0.7,
  },
  claude: {
    provider: 'claude',
    apiKey: process.env.VITE_ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.7,
  },
  mistral: {
    provider: 'mistral',
    apiKey: process.env.VITE_MISTRAL_API_KEY,
    model: 'mistral-large-latest',
    maxTokens: 4000,
    temperature: 0.7,
  },
};

// Processing Configurations
const processingConfigs: Record<string, ProcessingConfig> = {
  redis: {
    method: 'redis',
    connectionString: process.env.VITE_REDIS_CONNECTION_STRING || 'redis://localhost:6379',
    queueName: 'resume-processing',
    maxConcurrency: 3,
    timeout: 300000, // 5 minutes
  },
  'azure-functions': {
    method: 'azure-functions',
    connectionString: process.env.VITE_AZURE_SERVICE_BUS_CONNECTION_STRING,
    queueName: 'resume-processing-premium',
    maxConcurrency: 20,
    timeout: 600000, // 10 minutes
  },
  direct: {
    method: 'direct',
    maxConcurrency: 1,
    timeout: 120000, // 2 minutes
  },
};

// Plan-specific configurations
export const recruiterPlanConfig: PlanConfig = {
  free: {
    vectorDB: vectorDBConfigs.supabase, // Free uses Supabase Vector
    processing: processingConfigs.redis, // Free uses Redis locally
    features: [
      'resume_analysis',
      'basic_skill_matching',
      'simple_reports',
    ],
  },
  basic: {
    vectorDB: vectorDBConfigs.pinecone, // Basic uses Pinecone
    processing: processingConfigs['azure-functions'], // Basic uses Azure Functions
    features: [
      'resume_analysis',
      'skill_gap_analysis',
      'candidate_comparison',
      'ai_reports',
      'bulk_processing',
    ],
  },
  premium: {
    vectorDB: vectorDBConfigs.pinecone, // Premium uses Pinecone
    processing: processingConfigs['azure-functions'], // Premium uses Azure Functions
    features: [
      'resume_analysis',
      'advanced_skill_matching',
      'skill_gap_analysis',
      'candidate_comparison',
      'ai_reports',
      'bulk_processing',
      'advanced_analytics',
      'custom_scoring',
      'api_access',
    ],
  },
};

// Feature definitions
export const recruiterFeatures = {
  resume_analysis: {
    name: 'Resume Analysis',
    description: 'AI-powered analysis of resumes against job descriptions',
    icon: 'FileSearch',
  },
  skill_gap_analysis: {
    name: 'Skill Gap Analysis',
    description: 'Identify missing skills and competency gaps',
    icon: 'TrendingUp',
  },
  candidate_comparison: {
    name: 'Candidate Comparison',
    description: 'Side-by-side comparison of multiple candidates',
    icon: 'Users',
  },
  bulk_processing: {
    name: 'Bulk Processing',
    description: 'Process multiple resumes simultaneously',
    icon: 'Upload',
  },
  ai_reports: {
    name: 'AI Reports',
    description: 'Generate detailed PDF reports with AI insights',
    icon: 'FileText',
  },
  advanced_analytics: {
    name: 'Advanced Analytics',
    description: 'Deep insights and hiring trends analysis',
    icon: 'BarChart3',
  },
  find_candidates: {
    name: 'Find Best Candidates',
    description: 'Use AI to find the best candidates based on job description',
    icon: 'UserPlus',
  },
  optimize_job: {
    name: 'Optimize Job Description',
    description: 'Create an optimized job description using AI',
    icon: 'Sparkles',
  },
  candidate_analysis: {
    name: 'Candidate Analysis',
    description: 'Analyze candidate applications and generate reports',
    icon: 'PieChart',
  },
};

// Get configuration for a specific plan
export const getConfigForPlan = (planType: string) => {
  const normalizedPlan = planType.toLowerCase();
  if (normalizedPlan === 'recruiter') return recruiterPlanConfig.premium;
  return recruiterPlanConfig[normalizedPlan as keyof PlanConfig] || recruiterPlanConfig.free;
};

// Get LLM configuration (same for all plans but configurable)
export const getLLMConfig = (): LLMConfig => {
  return llmConfigs.openai; // Default to OpenAI, matching candidate dashboard
};

// Scoring weights for different aspects
export const scoringWeights = {
  skillMatch: 0.4,
  experience: 0.3,
  education: 0.2,
  atsCompliance: 0.1,
};

// Default analysis parameters
export const analysisDefaults = {
  minMatchScore: 60, // Minimum score to be considered a good match
  maxCandidatesPerComparison: 10,
  embeddingBatchSize: 50,
  processingTimeout: 300000, // 5 minutes
};

// Plan feature matrix for UI display
export const planFeatureMatrix = {
  free: {
    vectorDB: 'Supabase Vector',
    processing: 'Redis (Local)',
    maxResumes: 3,
    maxComparisons: 3,
    reports: 'Basic',
    support: 'Community',
  },
  basic: {
    vectorDB: 'Pinecone',
    processing: 'Azure Functions',
    maxResumes: 25,
    maxComparisons: 25,
    reports: 'Advanced',
    support: 'Email',
  },
  premium: {
    vectorDB: 'Pinecone',
    processing: 'Azure Functions',
    maxResumes: 'Unlimited',
    maxComparisons: 'Unlimited',
    reports: 'Premium + Custom',
    support: 'Priority',
  },
};