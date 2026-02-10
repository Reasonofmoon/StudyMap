import React, { useEffect, useState, useCallback } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  error?: string;
}

interface ServiceFallbackProps {
  children: React.ReactNode;
  services: {
    neo4j?: boolean;
    aiService?: boolean;
    database?: boolean;
  };
  fallbackTimeout?: number;
  onServiceRestored?: (service: string) => void;
  maxRetryAttempts?: number;
}

export const ServiceFallback: React.FC<ServiceFallbackProps> = ({
  children,
  services,
  fallbackTimeout = 5000,
  onServiceRestored,
  maxRetryAttempts = 3
}) => {
  const [serviceStatus, setServiceStatus] = useState<Record<string, ServiceStatus>>({});
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Initialize service status
  useEffect(() => {
    const initialStatus: Record<string, ServiceStatus> = {};
    Object.keys(services).forEach(service => {
      initialStatus[service] = {
        name: service,
        status: 'healthy',
        lastChecked: new Date()
      };
    });
    setServiceStatus(initialStatus);
    setRetryAttempts(Object.keys(services).reduce((acc, service) => ({ ...acc, [service]: 0 }), {}));
  }, [services]);

  // Check service status
  const checkServiceStatus = useCallback(async (serviceName: string) => {
    setIsChecking(true);

    try {
      // Simulate service check
      const isHealthy = services[serviceName as keyof typeof services];

      setServiceStatus(prev => ({
        ...prev,
        [serviceName]: {
          name: serviceName,
          status: isHealthy ? 'healthy' : 'degraded',
          lastChecked: new Date()
        }
      }));

      // If service was down and now healthy, trigger callback
      if (prevStatus && prevStatus.status !== 'healthy' && isHealthy) {
        onServiceRestored?.(serviceName);
      }
    } catch (error) {
      setServiceStatus(prev => ({
        ...prev,
        [serviceName]: {
          name: serviceName,
          status: 'down',
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));

      // Increment retry attempts
      setRetryAttempts(prev => ({
        ...prev,
        [serviceName]: prev[serviceName] + 1
      }));
    } finally {
      setIsChecking(false);
    }
  }, [services, onServiceRestored]);

  // Auto-check services periodically
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(services).forEach(service => {
        checkServiceStatus(service);
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [services, checkServiceStatus]);

  // Check if any service is down
  useEffect(() => {
    const isAnyServiceDown = Object.values(serviceStatus).some(
      service => service.status === 'down' || service.status === 'degraded'
    );

    setShowFallback(isAnyServiceDown);
  }, [serviceStatus]);

  // Auto-retry failed services
  useEffect(() => {
    Object.entries(serviceStatus).forEach(([serviceName, status]) => {
      if (
        status.status === 'down' &&
        retryAttempts[serviceName] < maxRetryAttempts
      ) {
        const timer = setTimeout(() => {
          checkServiceStatus(serviceName);
        }, fallbackTimeout);

        return () => clearTimeout(timer);
      }
    });
  }, [serviceStatus, retryAttempts, maxRetryAttempts, fallbackTimeout, checkServiceStatus]);

  // Render fallback UI when services are down
  if (showFallback) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Alert Banner */}
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-yellow-400 text-lg font-medium">
                  Service Issues Detected
                </h3>
                <div className="mt-2 text-yellow-200 text-sm">
                  <p>
                    Some services are experiencing issues. Using cached data and fallback mechanisms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Service Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(serviceStatus).map(([serviceName, status]) => (
                <div
                  key={serviceName}
                  className={`p-4 rounded-lg border ${
                    status.status === 'healthy'
                      ? 'bg-green-900 border-green-700'
                      : status.status === 'degraded'
                      ? 'bg-yellow-900 border-yellow-700'
                      : 'bg-red-900 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          status.status === 'healthy'
                            ? 'bg-green-400'
                            : status.status === 'degraded'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="text-white capitalize">{serviceName}</span>
                    </div>
                    <span className={`text-sm ${
                      status.status === 'healthy'
                        ? 'text-green-400'
                        : status.status === 'degraded'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {status.status}
                    </span>
                  </div>
                  {status.error && (
                    <div className="mt-2 text-xs text-red-300">
                      {status.error}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    Last checked: {status.lastChecked.toLocaleTimeString()}
                  </div>
                  {retryAttempts[serviceName] > 0 && (
                    <div className="mt-1 text-xs text-yellow-400">
                      Retry attempts: {retryAttempts[serviceName]}/{maxRetryAttempts}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fallback Content */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Using Fallback Content
            </h3>
            <div className="text-gray-300 space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">Neo4j Database</h4>
                <p className="text-sm">
                  Using locally cached knowledge graph data. Some features may be limited.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">AI Service</h4>
                <p className="text-sm">
                  Using pre-generated question templates. Personalized content may be limited.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Main Database</h4>
                <p className="text-sm">
                  Working normally. Your learning progress is being saved locally.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                Object.keys(services).forEach(service => {
                  checkServiceStatus(service);
                });
              }}
              disabled={isChecking}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Checking...' : 'Retry Services'}
            </button>

            <button
              onClick={() => setShowFallback(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Continue with Limited Functionality
            </button>

            <button
              onClick={() => {
                // Clear retry attempts
                setRetryAttempts(Object.keys(services).reduce((acc, service) => ({ ...acc, [service]: 0 }), {}));
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Reset Retry Attempts
            </button>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-gray-700">
            <h4 className="font-medium text-white mb-2">Tips:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Check your internet connection if services are marked as down</li>
              <li>• Retry connections if the issue persists</li>
              <li>• Continue with limited functionality while services recover</li>
              <li>• Your learning progress is safely stored locally</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render normal content when all services are healthy
  return <>{children}</>;
};

// Export individual service status components for direct use
export const ServiceStatusIndicator: React.FC<{
  serviceName: string;
  isHealthy: boolean;
  lastChecked?: Date;
  error?: string;
}> = ({ serviceName, isHealthy, lastChecked, error }) => {
  const statusColor = isHealthy ? 'green' : 'red';
  const statusText = isHealthy ? 'Healthy' : 'Service Unavailable';

  return (
    <div className={`flex items-center space-x-2 p-2 rounded ${
      isHealthy ? 'bg-green-900/20' : 'bg-red-900/20'
    }`}>
      <div
        className={`w-2 h-2 rounded-full ${
          isHealthy ? 'bg-green-400' : 'bg-red-400'
        }`}
      />
      <span className="text-sm text-white capitalize">{serviceName}</span>
      <span className={`text-xs ${
        isHealthy ? 'text-green-400' : 'text-red-400'
      }`}>
        {statusText}
      </span>
      {lastChecked && (
        <span className="text-xs text-gray-400">
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

// Custom hook for service monitoring
export const useServiceMonitor = () => {
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const checkService = useCallback(async (name: string, checkFn: () => Promise<boolean>) => {
    try {
      const isHealthy = await checkFn();
      setServices(prev => ({ ...prev, [name]: isHealthy }));
      if (!isHealthy) {
        setErrors(prev => ({ ...prev, [name]: new Error(`${name} is unavailable`) }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } catch (error) {
      setServices(prev => ({ ...prev, [name]: false }));
      setErrors(prev => ({ ...prev, [name]: error as Error }));
    }
  }, []);

  return {
    services,
    errors,
    checkService,
    isAllHealthy: Object.values(services).every(status => status)
  };
};