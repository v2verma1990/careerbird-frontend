import { useState, useEffect, useCallback, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useAuth } from './useAuth';

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressPercentage: number;
  processedItems: number;
  totalItems: number;
  failedItems: number;
  estimatedCompletionTime?: string;
  currentItem?: string;
  partialResults?: any;
  errorMessage?: string;
  lastUpdated: string;
}

export interface JobResult {
  jobId: string;
  resultData: any;
  timestamp: string;
}

export interface JobError {
  jobId: string;
  errorMessage: string;
  timestamp: string;
}

interface UseJobProgressOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
}

export const useJobProgress = (options: UseJobProgressOptions = {}) => {
  const { autoConnect = true, reconnectInterval = 5000 } = options;
  const { token } = useAuth();
  
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  const [jobProgress, setJobProgress] = useState<Map<string, JobProgress>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscribedJobsRef = useRef<Set<string>>(new Set());

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    if (!token) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl('/jobProgressHub', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Connection state change handler
      newConnection.onreconnecting(() => {
        setConnectionState(HubConnectionState.Reconnecting);
        setError('Reconnecting to server...');
      });

      newConnection.onreconnected(() => {
        setConnectionState(HubConnectionState.Connected);
        setError(null);
        
        // Re-subscribe to all jobs
        subscribedJobsRef.current.forEach(jobId => {
          newConnection.invoke('JoinJobGroup', jobId).catch(console.error);
        });
      });

      newConnection.onclose(() => {
        setConnectionState(HubConnectionState.Disconnected);
        setError('Connection lost');
        
        // Schedule reconnection
        if (autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            initializeConnection();
          }, reconnectInterval);
        }
      });

      // Progress update handler
      newConnection.on('ProgressUpdate', (progressData: JobProgress) => {
        setJobProgress(prev => new Map(prev.set(progressData.jobId, progressData)));
      });

      // Job completed handler
      newConnection.on('JobCompleted', (result: JobResult) => {
        setJobProgress(prev => {
          const current = prev.get(result.jobId);
          if (current) {
            const updated = {
              ...current,
              status: 'completed' as const,
              progressPercentage: 100,
              partialResults: result.resultData,
              lastUpdated: result.timestamp
            };
            return new Map(prev.set(result.jobId, updated));
          }
          return prev;
        });
      });

      // Job failed handler
      newConnection.on('JobFailed', (error: JobError) => {
        setJobProgress(prev => {
          const current = prev.get(error.jobId);
          if (current) {
            const updated = {
              ...current,
              status: 'failed' as const,
              errorMessage: error.errorMessage,
              lastUpdated: error.timestamp
            };
            return new Map(prev.set(error.jobId, updated));
          }
          return prev;
        });
      });

      // Start connection
      await newConnection.start();
      setConnection(newConnection);
      setConnectionState(HubConnectionState.Connected);
      setError(null);

    } catch (err) {
      console.error('Failed to initialize SignalR connection:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      
      // Schedule retry
      if (autoConnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          initializeConnection();
        }, reconnectInterval);
      }
    }
  }, [token, autoConnect, reconnectInterval]);

  // Subscribe to job updates
  const subscribeToJob = useCallback(async (jobId: string) => {
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('Cannot subscribe to job: connection not ready');
      return false;
    }

    try {
      await connection.invoke('JoinJobGroup', jobId);
      subscribedJobsRef.current.add(jobId);
      
      // Fetch initial job status
      const response = await fetch(`/api/recruiter/jobs/${jobId}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const initialProgress: JobProgress = await response.json();
        setJobProgress(prev => new Map(prev.set(jobId, initialProgress)));
      }

      return true;
    } catch (err) {
      console.error('Failed to subscribe to job:', err);
      return false;
    }
  }, [connection, token]);

  // Unsubscribe from job updates
  const unsubscribeFromJob = useCallback(async (jobId: string) => {
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('LeaveJobGroup', jobId);
      subscribedJobsRef.current.delete(jobId);
      setJobProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    } catch (err) {
      console.error('Failed to unsubscribe from job:', err);
    }
  }, [connection]);

  // Submit bulk analysis job
  const submitBulkAnalysisJob = useCallback(async (
    resumeIds: string[],
    jobDescriptionId: string,
    userId: string,
    planType: string = 'free'
  ) => {
    try {
      const response = await fetch('/api/recruiter/analyze/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeIds,
          jobDescriptionId,
          userId,
          planType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Auto-subscribe to the new job
      if (result.jobId) {
        await subscribeToJob(result.jobId);
      }

      return result;
    } catch (err) {
      console.error('Failed to submit bulk analysis job:', err);
      throw err;
    }
  }, [token, subscribeToJob]);

  // Cancel job
  const cancelJob = useCallback(async (jobId: string, userId: string) => {
    try {
      const response = await fetch(`/api/recruiter/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local state
      setJobProgress(prev => {
        const current = prev.get(jobId);
        if (current) {
          const updated = {
            ...current,
            status: 'cancelled' as const,
            lastUpdated: new Date().toISOString()
          };
          return new Map(prev.set(jobId, updated));
        }
        return prev;
      });

      return result;
    } catch (err) {
      console.error('Failed to cancel job:', err);
      throw err;
    }
  }, [token]);

  // Get user jobs
  const getUserJobs = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/recruiter/queue/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get user jobs:', err);
      throw err;
    }
  }, [token]);

  // Connect/disconnect manually
  const connect = useCallback(() => {
    if (connectionState === HubConnectionState.Disconnected) {
      initializeConnection();
    }
  }, [connectionState, initializeConnection]);

  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (connection) {
      try {
        await connection.stop();
      } catch (err) {
        console.error('Error stopping connection:', err);
      }
    }

    setConnection(null);
    setConnectionState(HubConnectionState.Disconnected);
    subscribedJobsRef.current.clear();
    setJobProgress(new Map());
  }, [connection]);

  // Initialize connection on mount
  useEffect(() => {
    if (autoConnect && token) {
      initializeConnection();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, initializeConnection, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === HubConnectionState.Connected,
    error,

    // Job progress data
    jobProgress: Object.fromEntries(jobProgress),
    getJobProgress: (jobId: string) => jobProgress.get(jobId),

    // Actions
    connect,
    disconnect,
    subscribeToJob,
    unsubscribeFromJob,
    submitBulkAnalysisJob,
    cancelJob,
    getUserJobs
  };
};

export default useJobProgress;import { useState, useEffect, useCallback, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useAuth } from './useAuth';

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressPercentage: number;
  processedItems: number;
  totalItems: number;
  failedItems: number;
  estimatedCompletionTime?: string;
  currentItem?: string;
  partialResults?: any;
  errorMessage?: string;
  lastUpdated: string;
}

export interface JobResult {
  jobId: string;
  resultData: any;
  timestamp: string;
}

export interface JobError {
  jobId: string;
  errorMessage: string;
  timestamp: string;
}

interface UseJobProgressOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
}

export const useJobProgress = (options: UseJobProgressOptions = {}) => {
  const { autoConnect = true, reconnectInterval = 5000 } = options;
  const { token } = useAuth();
  
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  const [jobProgress, setJobProgress] = useState<Map<string, JobProgress>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscribedJobsRef = useRef<Set<string>>(new Set());

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    if (!token) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl('/jobProgressHub', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Connection state change handler
      newConnection.onreconnecting(() => {
        setConnectionState(HubConnectionState.Reconnecting);
        setError('Reconnecting to server...');
      });

      newConnection.onreconnected(() => {
        setConnectionState(HubConnectionState.Connected);
        setError(null);
        
        // Re-subscribe to all jobs
        subscribedJobsRef.current.forEach(jobId => {
          newConnection.invoke('JoinJobGroup', jobId).catch(console.error);
        });
      });

      newConnection.onclose(() => {
        setConnectionState(HubConnectionState.Disconnected);
        setError('Connection lost');
        
        // Schedule reconnection
        if (autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            initializeConnection();
          }, reconnectInterval);
        }
      });

      // Progress update handler
      newConnection.on('ProgressUpdate', (progressData: JobProgress) => {
        setJobProgress(prev => new Map(prev.set(progressData.jobId, progressData)));
      });

      // Job completed handler
      newConnection.on('JobCompleted', (result: JobResult) => {
        setJobProgress(prev => {
          const current = prev.get(result.jobId);
          if (current) {
            const updated = {
              ...current,
              status: 'completed' as const,
              progressPercentage: 100,
              partialResults: result.resultData,
              lastUpdated: result.timestamp
            };
            return new Map(prev.set(result.jobId, updated));
          }
          return prev;
        });
      });

      // Job failed handler
      newConnection.on('JobFailed', (error: JobError) => {
        setJobProgress(prev => {
          const current = prev.get(error.jobId);
          if (current) {
            const updated = {
              ...current,
              status: 'failed' as const,
              errorMessage: error.errorMessage,
              lastUpdated: error.timestamp
            };
            return new Map(prev.set(error.jobId, updated));
          }
          return prev;
        });
      });

      // Start connection
      await newConnection.start();
      setConnection(newConnection);
      setConnectionState(HubConnectionState.Connected);
      setError(null);

    } catch (err) {
      console.error('Failed to initialize SignalR connection:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      
      // Schedule retry
      if (autoConnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          initializeConnection();
        }, reconnectInterval);
      }
    }
  }, [token, autoConnect, reconnectInterval]);

  // Subscribe to job updates
  const subscribeToJob = useCallback(async (jobId: string) => {
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('Cannot subscribe to job: connection not ready');
      return false;
    }

    try {
      await connection.invoke('JoinJobGroup', jobId);
      subscribedJobsRef.current.add(jobId);
      
      // Fetch initial job status
      const response = await fetch(`/api/recruiter/jobs/${jobId}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const initialProgress: JobProgress = await response.json();
        setJobProgress(prev => new Map(prev.set(jobId, initialProgress)));
      }

      return true;
    } catch (err) {
      console.error('Failed to subscribe to job:', err);
      return false;
    }
  }, [connection, token]);

  // Unsubscribe from job updates
  const unsubscribeFromJob = useCallback(async (jobId: string) => {
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('LeaveJobGroup', jobId);
      subscribedJobsRef.current.delete(jobId);
      setJobProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    } catch (err) {
      console.error('Failed to unsubscribe from job:', err);
    }
  }, [connection]);

  // Submit bulk analysis job
  const submitBulkAnalysisJob = useCallback(async (
    resumeIds: string[],
    jobDescriptionId: string,
    userId: string,
    planType: string = 'free'
  ) => {
    try {
      const response = await fetch('/api/recruiter/analyze/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeIds,
          jobDescriptionId,
          userId,
          planType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Auto-subscribe to the new job
      if (result.jobId) {
        await subscribeToJob(result.jobId);
      }

      return result;
    } catch (err) {
      console.error('Failed to submit bulk analysis job:', err);
      throw err;
    }
  }, [token, subscribeToJob]);

  // Cancel job
  const cancelJob = useCallback(async (jobId: string, userId: string) => {
    try {
      const response = await fetch(`/api/recruiter/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local state
      setJobProgress(prev => {
        const current = prev.get(jobId);
        if (current) {
          const updated = {
            ...current,
            status: 'cancelled' as const,
            lastUpdated: new Date().toISOString()
          };
          return new Map(prev.set(jobId, updated));
        }
        return prev;
      });

      return result;
    } catch (err) {
      console.error('Failed to cancel job:', err);
      throw err;
    }
  }, [token]);

  // Get user jobs
  const getUserJobs = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/recruiter/queue/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get user jobs:', err);
      throw err;
    }
  }, [token]);

  // Connect/disconnect manually
  const connect = useCallback(() => {
    if (connectionState === HubConnectionState.Disconnected) {
      initializeConnection();
    }
  }, [connectionState, initializeConnection]);

  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (connection) {
      try {
        await connection.stop();
      } catch (err) {
        console.error('Error stopping connection:', err);
      }
    }

    setConnection(null);
    setConnectionState(HubConnectionState.Disconnected);
    subscribedJobsRef.current.clear();
    setJobProgress(new Map());
  }, [connection]);

  // Initialize connection on mount
  useEffect(() => {
    if (autoConnect && token) {
      initializeConnection();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, initializeConnection, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === HubConnectionState.Connected,
    error,

    // Job progress data
    jobProgress: Object.fromEntries(jobProgress),
    getJobProgress: (jobId: string) => jobProgress.get(jobId),

    // Actions
    connect,
    disconnect,
    subscribeToJob,
    unsubscribeFromJob,
    submitBulkAnalysisJob,
    cancelJob,
    getUserJobs
  };
};

export default useJobProgress;