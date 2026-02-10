import React, { useState, useEffect } from 'react';
import { WordGalaxy } from '../word-galaxy/WordGalaxy';
import { GapHeatmap } from '../gap-heatmap/GapHeatmap';
import { Tailwind } from '@tailwindcss/ui';

interface Student {
  id: string;
  name: string;
  email: string;
  level: number;
}

interface Gap {
  id: string;
  category: string;
  level: number;
  score: number;
  frequency: number;
  lastReviewed: Date;
  improvement: number;
}

interface Assignment {
  id: string;
  name: string;
  description: string;
  progress: number;
  score?: number;
  createdAt: Date;
}

export const Dashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedGap, setSelectedGap] = useState<Gap | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'assignments'>('overview');

  // Mock data - in real app, fetch from API
  useEffect(() => {
    // Mock student data
    setStudent({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      level: 5
    });

    // Mock gap data
    setGaps([
      { id: '1', category: 'vocabulary', level: 3, score: 45, frequency: 25, lastReviewed: new Date(), improvement: -5 },
      { id: '2', category: 'grammar', level: 5, score: 72, frequency: 18, lastReviewed: new Date(), improvement: 12 },
      { id: '3', category: 'listening', level: 4, score: 58, frequency: 22, lastReviewed: new Date(), improvement: -2 },
      { id: '4', category: 'speaking', level: 6, score: 83, frequency: 15, lastReviewed: new Date(), improvement: 18 },
      { id: '5', category: 'reading', level: 5, score: 76, frequency: 20, lastReviewed: new Date(), improvement: 8 },
      { id: '6', category: 'writing', level: 4, score: 62, frequency: 19, lastReviewed: new Date(), improvement: 3 }
    ]);

    // Mock assignment data
    setAssignments([
      {
        id: '1',
        name: 'Vocabulary Builder',
        description: 'Focus on intermediate vocabulary',
        progress: 75,
        score: 82,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Grammar Practice',
        description: 'Advanced grammar structures',
        progress: 45,
        score: null,
        createdAt: new Date()
      }
    ]);
  }, []);

  // Mock word galaxy data
  const wordGalaxyNodes = [
    { id: '1', word: 'ubiquitous', x: 400, y: 300, radius: 20, group: 'vocabulary', connections: ['2', '3'], difficulty: 6, frequency: 45 },
    { id: '2', word: 'paradigm', x: 300, y: 200, radius: 18, group: 'vocabulary', connections: ['1', '4'], difficulty: 7, frequency: 32 },
    { id: '3', word: 'elaborate', x: 500, y: 250, radius: 16, group: 'expression', connections: ['1', '5'], difficulty: 5, frequency: 58 },
    { id: '4', word: 'subjunctive', x: 200, y: 350, radius: 15, group: 'grammar', connections: ['2', '6'], difficulty: 8, frequency: 28 },
    { id: '5', word: 'colloquial', x: 450, y: 400, radius: 17, group: 'expression', connections: ['3', '6'], difficulty: 6, frequency: 41 },
    { id: '6', word: 'idiom', x: 350, y: 450, radius: 19, group: 'idiom', connections: ['4', '5'], difficulty: 4, frequency: 65 }
  ];

  const handleGapClick = (gap: Gap) => {
    setSelectedGap(gap);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">EduOntology Dashboard</h1>
          <p className="text-gray-400">Personalized learning experience powered by AI</p>

          {student && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{student.name}</h2>
                  <p className="text-gray-400">{student.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">Level {student.level}</div>
                  <div className="text-sm text-gray-400">Current Progress</div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'gaps', label: 'Gaps Analysis' },
              { key: 'assignments', label: 'Assignments' }
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
              <WordGalaxy
                nodes={wordGalaxyNodes}
                onNodeClick={(node) => console.log('Node clicked:', node)}
                onNodeHover={(node) => console.log('Node hover:', node)}
              />

              <GapHeatmap
                data={gaps}
                onGapClick={handleGapClick}
              />
            </div>
          )}

          {/* Gaps Analysis Tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gaps.map(gap => (
                  <div
                    key={gap.id}
                    className="p-4 bg-slate-800 rounded-lg border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleGapClick(gap)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold capitalize">{gap.category}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        gap.score >= 70 ? 'bg-green-600' :
                        gap.score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {gap.score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Level {gap.level}</p>
                      <p>Frequency: {gap.frequency}</p>
                      <p>Improvement: {gap.improvement > 0 ? '+' : ''}{gap.improvement}%</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedGap && (
                <div className="p-6 bg-slate-800 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-bold mb-4 capitalize">{selectedGap.category} - Level {selectedGap.level}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span className="font-bold">{selectedGap.score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span>{selectedGap.frequency} times</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Improvement:</span>
                          <span className={selectedGap.improvement >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {selectedGap.improvement > 0 ? '+' : ''}{selectedGap.improvement}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">AI Suggestions</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Focus on vocabulary building exercises</li>
                        <li>• Review related grammar concepts</li>
                        <li>• Practice with audio materials</li>
                        <li>• Complete 3 practice sessions this week</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {assignments.map(assignment => (
                <div key={assignment.id} className="p-6 bg-slate-800 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{assignment.name}</h3>
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
                        <span>Completed on: {/* Add completion date */}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};