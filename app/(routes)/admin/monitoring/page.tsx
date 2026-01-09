'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
  healthy: boolean;
  message?: string;
  duration: number;
  metadata?: any;
}

interface HealthData {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  version: string;
  environment: string;
  checks: Record<string, HealthCheck>;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    version: string;
    platform: string;
  };
}

interface MetricsData {
  timestamp: string;
  cache: Record<string, { size: number; max: number }>;
  rateLimiting: Record<string, { activeEntries: number; totalRequests: number }>;
  errors: { total: number; unresolved: number; byLevel: Record<string, number> };
  memory: {
    current: NodeJS.MemoryUsage;
    average: NodeJS.MemoryUsage;
    history: Array<{ timestamp: string; usage: NodeJS.MemoryUsage }>;
  };
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    cpuUsage: NodeJS.CpuUsage;
    environment: string;
  };
  performance: {
    averageResponseTime: string;
    successRate: string;
    throughput: string;
  };
}

/**
 * System Monitoring Dashboard
 * Real-time monitoring of application health and performance
 */
export default function MonitoringPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Failed to load health data');
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const loadMetricsData = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to load metrics data');
      const data = await response.json();
      setMetricsData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([loadHealthData(), loadMetricsData()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const clearCaches = async () => {
    try {
      const response = await fetch('/api/metrics/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearCaches: true }),
      });
      
      if (response.ok) {
        alert('Caches cleared successfully');
        loadData();
      } else {
        throw new Error('Failed to clear caches');
      }
    } catch (err) {
      alert('Error clearing caches: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatBytes = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHealthColor = (healthy: boolean): string => {
    return healthy ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  if (loading && !healthData && !metricsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time health and performance monitoring
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={clearCaches}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Clear Caches
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        )}

        {/* System Status Overview */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getHealthColor(healthData.status === 'healthy')}`}>
                  <span className="text-2xl">
                    {healthData.status === 'healthy' ? '✅' : '❌'}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-semibold">
                    {healthData.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-semibold">{formatUptime(healthData.system.uptime)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🧠</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-semibold">{formatBytes(healthData.system.memory.heapUsed)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-semibold">{healthData.responseTime}ms</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Checks Detail */}
        {healthData && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Health Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(healthData.checks).map(([name, check]) => (
                <div
                  key={name}
                  className={`border rounded-lg p-4 ${
                    check.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getHealthColor(check.healthy)}`}>
                      {check.healthy ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{check.message}</p>
                  <div className="text-xs text-gray-500">
                    Duration: {check.duration}ms
                  </div>
                  {check.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      <details>
                        <summary className="cursor-pointer">Metadata</summary>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(check.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Status */}
        {metricsData && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Cache Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(metricsData.cache).map(([name, stats]) => (
                <div key={name} className="border rounded-lg p-4">
                  <h3 className="font-medium capitalize mb-2">{name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Size: {stats.size} / {stats.max}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(stats.size / stats.max) * 100}%` }}
                      ></div>
                    </div>
                    <div>Usage: {Math.round((stats.size / stats.max) * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Limiting Status */}
        {metricsData && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Rate Limiting</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(metricsData.rateLimiting).map(([name, stats]) => (
                <div key={name} className="border rounded-lg p-4">
                  <h3 className="font-medium capitalize mb-2">{name} Rate Limiter</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Active Entries: {stats.activeEntries}</div>
                    <div>Total Requests: {stats.totalRequests}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Status */}
        {metricsData && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Error Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Errors:</span>
                    <span className="font-medium">{metricsData.errors.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unresolved:</span>
                    <span className={`font-medium ${metricsData.errors.unresolved > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {metricsData.errors.unresolved}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">By Level</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(metricsData.errors.byLevel).map(([level, count]) => (
                    <div key={level} className="flex justify-between">
                      <span className="capitalize">{level}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Information */}
        {healthData && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Application</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Version: {healthData.version}</div>
                  <div>Environment: {healthData.environment}</div>
                  <div>Platform: {healthData.system.platform}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Runtime</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Node.js: {healthData.system.version}</div>
                  <div>Uptime: {formatUptime(healthData.system.uptime)}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Memory</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Heap Used: {formatBytes(healthData.system.memory.heapUsed)}</div>
                  <div>Heap Total: {formatBytes(healthData.system.memory.heapTotal)}</div>
                  <div>External: {formatBytes(healthData.system.memory.external)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}