import React, { useState, useEffect, useCallback } from 'react';
import { EnhancedGapHeatmap } from '../enhanced-gap-heatmap/EnhancedGapHeatmap';
import { WordGalaxy } from '../word-galaxy/WordGalaxy';
import { ServiceFallback, ServiceStatusIndicator } from '../error-handling/ServiceFallback';
import { Tailwind } from '@tailwindcss/ui';
import { stressTestUtility } from '../../utils/performance/stress-test';

interface Student {
  id: string;
  name: string;
  email: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

interface Gap {
  id: string;
  category: string;
  level: number;
  score: number;
  frequency: number;
  lastReviewed: Date;
  improvement: number;
  studentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

interface Assignment {
  id: string;
  name: string;
  description: string;
  progress: number;
  score?: number;
  createdAt: Date;
}

export const EnhancedDashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedGap, setSelectedGap] = useState<Gap | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'assignments' | 'stress-test'>('overview');
  const [selectedLevel, setSelectedLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStressTestRunning, setIsStressTestRunning] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({
    neo4j: true,
    aiService: true,
    database: true
  });

  // Mock data generator for demonstration
  const generateMockData = useCallback(() => {
    const levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const categories = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];

    const mockGaps: Gap[] = [];

    for (const level of levels) {
      for (const category of categories) {
        for (let i = 1; i <= 10; i++) {
          mockGaps.push({
            id: `${level}-${category}-${i}`,
            category,
            level: i,
            score: Math.floor(Math.random() * 100),
            frequency: Math.floor(Math.random() * 50),
            lastReviewed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            improvement: Math.floor(Math.random() * 40) - 20,
            studentLevel: level
          });
        }
      }
    }

    return mockGaps;
  }, []);

  // Initialize data
  useEffect(() => {
    // Set mock student
    setStudent({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      level: 'B1'
    });

    // Generate mock data
    const mockGaps = generateMockData();
    setGaps(mockGaps);

    // Mock assignments
    setAssignments([
      {
        id: '1',
        name: 'Vocabulary Builder - B1',
        description: 'Focus on intermediate vocabulary for B1 level',
        progress: 75,
        score: 82,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Grammar Practice - B1',
        description: 'Advanced grammar structures for B1 level',
        progress: 45,
        score: null,
        createdAt: new Date()
      }
    ]);
  }, [generateMockData]);

  // Simulate service status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setServiceStatus(prev => ({
        ...prev,
        neo4j: Math.random() > 0.1, // 90% uptime
        aiService: Math.random() > 0.15, // 85% uptime
        database: Math.random() > 0.05 // 95% uptime
      }));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle service recovery
  const handleServiceRestored = useCallback((service: string) => {
    console.log(`${service} service restored`);
    // Show notification or update UI
  }, []);

  // Run stress test
  const runStressTest = useCallback(async () => {
    setIsStressTestRunning(true);
    setError(null);

    try {
      const container = document.getElementById('stress-test-container');
      if (container) {
        await stressTestUtility.runStressTest(container);
      }
    } catch (err) {
      setError('Stress test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsStressTestRunning(false);
    }
  }, []);

  // Filter gaps by level
  const filteredGaps = gaps.filter(gap => gap.studentLevel === selectedLevel);

  // Mock word galaxy data
  const wordGalaxyNodes = [
    { id: '1', word: 'ubiquitous', x: 400, y: 300, radius: 20, group: 'vocabulary', connections: ['2', '3'], difficulty: 6, frequency: 45 },
    { id: '2', word: 'paradigm', x: 300, y: 200, radius: 18, group: 'vocabulary', connections: ['1', '4'], difficulty: 7, frequency: 32 },
    { id: '3', word: 'elaborate', x: 500, y: 250, radius: 16, group: 'expression', connections: ['1', '5'], difficulty: 5, frequency: 58 },
    { id: '4', word: 'subjunctive', x: 200, y: 350, radius: 15, group: 'grammar', connections: ['2', '6'], difficulty: 8, frequency: 28 },
    { id: '5', word: 'colloquial', x: 450, y: 400, radius: 17, group: 'expression', connections: ['3', '6'], difficulty: 6, frequency: 41 },
    { id: '6', word: 'idiom', x: 350, y: 450, radius: 19, group: 'idiom', connections: ['4', '5'], difficulty: 4, frequency: 65 }
  ];

  return (
    <ServiceFallback
      services={serviceStatus}
      onServiceRestored={handleServiceRestored}
    >
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">EduOntology Enhanced Dashboard</h1>
                <p className="text-gray-400">Personalized learning experience powered by AI</p>

                {/* Service Status Indicators */}
                <div className="flex gap-4 mt-4">
                  <ServiceStatusIndicator
                    serviceName="neo4j"
                    isHealthy={serviceStatus.neo4j}
                  />
                  <ServiceStatusIndicator
                    serviceName="aiService"
                    isHealthy={serviceStatus.aiService}
                  />
                  <ServiceStatusIndicator
                    serviceName="database"
                    isHealthy={serviceStatus.database}
                  />
                </div>
              </div>

              {/* Level Selector */}
              <div className="text-right">
                <div className="text-2xl font-bold">Level {selectedLevel}</div>
                <div className="text-sm text-gray-400">Current Student Level</div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as any)}
                  className="mt-2 px-3 py-1 bg-slate-800 text-white rounded border border-gray-600"
                >
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper Intermediate)</option>
                  <option value="C1">C1 (Advanced)</option>
                  <option value="C2">C2 (Proficient)</option>
                </select>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b border-gray-700">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'gaps', label: 'Gap Analysis' },
                { key: 'assignments', label: 'Assignments' },
                { key: 'stress-test', label: 'Performance Test' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-white mb-4">Word Galaxy</h3>
                  <WordGalaxy
                    nodes={wordGalaxyNodes}
                    onNodeClick={(node) => console.log('Node clicked:', node)}
                    onNodeHover={(node) => console.log('Node hover:', node)}
                  />
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-white mb-4">Experience Gap Heatmap</h3>
                  <EnhancedGapHeatmap
                    data={filteredGaps}
                    onGapClick={setSelectedGap}
                    studentLevel={selectedLevel}
                  />
                </div>
              </div>
            )}

            {/* Gap Analysis Tab */}
            {activeTab === 'gaps' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-white mb-4">Gap Analysis for Level {selectedLevel}</h3>
                  <EnhancedGapHeatmap
                    data={filteredGaps}
                    onGapClick={setSelectedGap}
                    studentLevel={selectedLevel}
                  />
                </div>

                {/* Gap Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Total Gaps</h4>
                    <p className="text-3xl font-bold text-blue-400">
                      {filteredGaps.length}
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Average Score</h4>
                    <p className="text-3xl font-bold text-green-400">
                      {Math.round(filteredGaps.reduce((sum, gap) => sum + gap.score, 0) / filteredGaps.length)}%
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Improving Areas</h4>
                    <p className="text-3xl font-bold text-yellow-400">
                      {filteredGaps.filter(gap => gap.improvement > 0).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="bg-slate-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{assignment.name}</h3>
                        <p className="text-gray-400">{assignment.description}</p>
                      </div>
                      {assignment.score && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">{assignment.score}%</div>
                          <div className="text-sm text-gray-400">Best Score</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{assignment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${assignment.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Created: {assignment.createdAt.toLocaleDateString()}</span>
                        {assignment.score && (
                          <span>Completed: {/* Add completion date */}</span>
                        )}
                      </div>
                    </div>

                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Continue Assignment
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Stress Test Tab */}
            {activeTab === 'stress-test' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Performance Stress Test</h3>

                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">
                      Test the platform's performance with large datasets (up to 500k vocabulary nodes).
                      This will validate the optimizations made for handling big data.
                    </p>

                    <button
                      onClick={runStressTest}
                      disabled={isStressTestRunning}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isStressTestRunning ? 'Running Test...' : 'Run Stress Test'}
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
                      <h4 className="text-red-400 font-medium mb-2">Test Error</h4>
                      <p className="text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Stress Test Results */}
                  <div id="stress-test-container" className="mt-6 h-96 bg-slate-900 rounded-lg border border-gray-700">
                    {/* Test results will be rendered here */}
                  </div>

                  {/* Test Metrics */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">FPS</h4>
                      <p className="text-2xl font-bold text-green-400">--</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Render Time</h4>
                      <p className="text-2xl font-bold text-blue-400">-- ms</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Nodes Processed</h4>
                      <p className="text-2xl font-bold text-yellow-400">--</p>
                    </div>
                  </div>
                </div>

                {/* Performance Optimization Info */}
                <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">Performance Optimizations</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Semantic zoom for detailed exploration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Progressive rendering for large datasets</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Virtual scrolling optimization</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Data sampling strategies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Memory usage monitoring</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ServiceFallback>
  );
};