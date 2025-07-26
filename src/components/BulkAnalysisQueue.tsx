import React, { useState, useEffect } from 'react';
import { useJobProgress, JobProgress } from '../hooks/useJobProgress';
import { useAuth } from '../hooks/useAuth';

interface BulkAnalysisQueueProps {
  resumeIds: string[];
  jobDescriptionId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

const BulkAnalysisQueue: React.FC<BulkAnalysisQueueProps> = ({
  resumeIds,
  jobDescriptionId,
  onComplete,
  onError
}) => {
  const { user } = useAuth();
  const {
    isConnected,
    connectionState,
    error: connectionError,
    jobProgress,
    submitBulkAnalysisJob,
    cancelJob,
    subscribeToJob
  } = useJobProgress();

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentJob = currentJobId ? jobProgress[currentJobId] : null;

  // Handle job completion
  useEffect(() => {
    if (currentJob?.status === 'completed' && currentJob.partialResults) {
      setResults(currentJob.partialResults);
      onComplete?.(currentJob.partialResults);
    } else if (currentJob?.status === 'failed' && currentJob.errorMessage) {
      onError?.(currentJob.errorMessage);
    }
  }, [currentJob?.status, currentJob?.partialResults, currentJob?.errorMessage, onComplete, onError]);

  const handleSubmitJob = async () => {
    if (!user?.id || !isConnected) return;

    setIsSubmitting(true);
    try {
      const result = await submitBulkAnalysisJob(
        resumeIds,
        jobDescriptionId,
        user.id,
        user.planType || 'free'
      );

      setCurrentJobId(result.jobId);
    } catch (err) {
      console.error('Failed to submit job:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async () => {
    if (!currentJobId || !user?.id) return;

    try {
      await cancelJob(currentJobId, user.id);
      setCurrentJobId(null);
    } catch (err) {
      console.error('Failed to cancel job:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Bulk Resume Analysis
        </h3>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Connection Error: {connectionError}
          </p>
        </div>
      )}

      {/* Job Submission */}
      {!currentJobId && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Resumes to analyze:</span>
                <span className="ml-2 font-medium">{resumeIds.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated time:</span>
                <span className="ml-2 font-medium">{resumeIds.length * 2} minutes</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitJob}
            disabled={isSubmitting || !isConnected}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Start Bulk Analysis'}
          </button>
        </div>
      )}

      {/* Job Progress */}
      {currentJob && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(currentJob.status)}</span>
              <span className={`font-medium ${getStatusColor(currentJob.status)}`}>
                {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
              </span>
            </div>
            
            {currentJob.status === 'processing' && (
              <button
                onClick={handleCancelJob}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Cancel Job
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(currentJob.progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Job Statistics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">{currentJob.processedItems}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{currentJob.failedItems}</div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {currentJob.totalItems - currentJob.processedItems - currentJob.failedItems}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Current Item */}
          {currentJob.currentItem && currentJob.status === 'processing' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Currently processing: <span className="font-medium">{currentJob.currentItem}</span>
              </p>
            </div>
          )}

          {/* Error Message */}
          {currentJob.errorMessage && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-800">
                Error: {currentJob.errorMessage}
              </p>
            </div>
          )}

          {/* Timing Information */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Last updated: {formatTime(currentJob.lastUpdated)}</div>
            {currentJob.estimatedCompletionTime && currentJob.status === 'processing' && (
              <div>
                Estimated completion: {formatTime(currentJob.estimatedCompletionTime)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && currentJob?.status === 'completed' && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900">Analysis Results</h4>
          
          <div className="bg-green-50 p-4 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium text-green-800">Analysis Completed</span>
            </div>
            <div className="text-sm text-green-700">
              Successfully analyzed {currentJob.processedItems} out of {currentJob.totalItems} resumes
              {currentJob.failedItems > 0 && (
                <span className="text-orange-600">
                  {' '}({currentJob.failedItems} failed)
                </span>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(results) && results.map((result, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Resume {index + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.success && result.analysis && (
                  <div className="text-sm text-gray-600">
                    Match Score: {result.analysis.matchScore || 'N/A'}%
                  </div>
                )}
                
                {!result.success && result.error && (
                  <div className="text-sm text-red-600">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setCurrentJobId(null);
              setResults(null);
            }}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkAnalysisQueue;import React, { useState, useEffect } from 'react';
import { useJobProgress, JobProgress } from '../hooks/useJobProgress';
import { useAuth } from '../hooks/useAuth';

interface BulkAnalysisQueueProps {
  resumeIds: string[];
  jobDescriptionId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

const BulkAnalysisQueue: React.FC<BulkAnalysisQueueProps> = ({
  resumeIds,
  jobDescriptionId,
  onComplete,
  onError
}) => {
  const { user } = useAuth();
  const {
    isConnected,
    connectionState,
    error: connectionError,
    jobProgress,
    submitBulkAnalysisJob,
    cancelJob,
    subscribeToJob
  } = useJobProgress();

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentJob = currentJobId ? jobProgress[currentJobId] : null;

  // Handle job completion
  useEffect(() => {
    if (currentJob?.status === 'completed' && currentJob.partialResults) {
      setResults(currentJob.partialResults);
      onComplete?.(currentJob.partialResults);
    } else if (currentJob?.status === 'failed' && currentJob.errorMessage) {
      onError?.(currentJob.errorMessage);
    }
  }, [currentJob?.status, currentJob?.partialResults, currentJob?.errorMessage, onComplete, onError]);

  const handleSubmitJob = async () => {
    if (!user?.id || !isConnected) return;

    setIsSubmitting(true);
    try {
      const result = await submitBulkAnalysisJob(
        resumeIds,
        jobDescriptionId,
        user.id,
        user.planType || 'free'
      );

      setCurrentJobId(result.jobId);
    } catch (err) {
      console.error('Failed to submit job:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async () => {
    if (!currentJobId || !user?.id) return;

    try {
      await cancelJob(currentJobId, user.id);
      setCurrentJobId(null);
    } catch (err) {
      console.error('Failed to cancel job:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Bulk Resume Analysis
        </h3>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Connection Error: {connectionError}
          </p>
        </div>
      )}

      {/* Job Submission */}
      {!currentJobId && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Resumes to analyze:</span>
                <span className="ml-2 font-medium">{resumeIds.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated time:</span>
                <span className="ml-2 font-medium">{resumeIds.length * 2} minutes</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitJob}
            disabled={isSubmitting || !isConnected}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Start Bulk Analysis'}
          </button>
        </div>
      )}

      {/* Job Progress */}
      {currentJob && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(currentJob.status)}</span>
              <span className={`font-medium ${getStatusColor(currentJob.status)}`}>
                {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
              </span>
            </div>
            
            {currentJob.status === 'processing' && (
              <button
                onClick={handleCancelJob}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Cancel Job
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(currentJob.progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Job Statistics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">{currentJob.processedItems}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{currentJob.failedItems}</div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {currentJob.totalItems - currentJob.processedItems - currentJob.failedItems}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Current Item */}
          {currentJob.currentItem && currentJob.status === 'processing' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Currently processing: <span className="font-medium">{currentJob.currentItem}</span>
              </p>
            </div>
          )}

          {/* Error Message */}
          {currentJob.errorMessage && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-800">
                Error: {currentJob.errorMessage}
              </p>
            </div>
          )}

          {/* Timing Information */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Last updated: {formatTime(currentJob.lastUpdated)}</div>
            {currentJob.estimatedCompletionTime && currentJob.status === 'processing' && (
              <div>
                Estimated completion: {formatTime(currentJob.estimatedCompletionTime)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && currentJob?.status === 'completed' && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900">Analysis Results</h4>
          
          <div className="bg-green-50 p-4 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium text-green-800">Analysis Completed</span>
            </div>
            <div className="text-sm text-green-700">
              Successfully analyzed {currentJob.processedItems} out of {currentJob.totalItems} resumes
              {currentJob.failedItems > 0 && (
                <span className="text-orange-600">
                  {' '}({currentJob.failedItems} failed)
                </span>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(results) && results.map((result, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Resume {index + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.success && result.analysis && (
                  <div className="text-sm text-gray-600">
                    Match Score: {result.analysis.matchScore || 'N/A'}%
                  </div>
                )}
                
                {!result.success && result.error && (
                  <div className="text-sm text-red-600">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setCurrentJobId(null);
              setResults(null);
            }}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkAnalysisQueue;