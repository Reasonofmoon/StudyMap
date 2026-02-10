import React, { useState, useEffect } from 'react';
import { GapHeatmap } from './components/GapHeatmap';
import { WordGalaxy } from './components/WordGalaxy';
import { AssignmentType } from './shared/types';

// Generate mock data for demonstration
const generateMockData = () => {
  const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
  const gaps: { [key: string]: number } = {};

  words.forEach(word => {
    gaps[word] = Math.random();
  });

  return {
    words,
    gaps
  };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'galaxy' | 'heatmap'>('galaxy');
  const [data, setData] = useState(() => generateMockData());
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate data loading and API errors
  const simulateDataLoad = () => {
    setIsLoading(true);
    setError(null);

    // Simulate loading delay
    setTimeout(() => {
      // Simulate error 20% of the time
      if (Math.random() < 0.2) {
        setError('Failed to load data. Please check your connection.');
        setIsLoading(false);
        return;
      }

      setData(generateMockData());
      setIsLoading(false);
    }, 1000);
  };

  // Handle word click
  const handleWordClick = (word: string, gap: number) => {
    setSelectedWord(word);
    console.log(`Selected word: ${word}, Gap level: ${Math.round(gap * 100)}%`);
  };

  // Generate assignments for each type
  const generateAssignment = async (type: AssignmentType) => {
    setIsLoading(true);
    console.log(`Generating assignment for type: ${type}`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // This would normally make an API call to the backend
    console.log(`Assignment generated for ${type}: ${selectedWord}`);
    setIsLoading(false);
  };

  // Generate sample gap data for heatmap
  const getSampleGapData = () => {
    return Object.entries(data.gaps).map(([word, gap]) => ({
      word,
      gap,
      pos: ['noun', 'verb', 'adjective', 'adverb'][Math.floor(Math.random() * 4)],
      frequency: Math.floor(Math.random() * 100) + 1,
      lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EduOntology</h1>
              <p className="text-sm text-gray-600">AI-Powered Vocabulary Learning</p>
            </div>
            <button
              onClick={simulateDataLoad}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Word Info */}
        {selectedWord && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">Selected Word: <span className="text-indigo-600">{selectedWord}</span></h2>
            <p className="text-sm text-gray-600">
              Gap level: {Math.round(data.gaps[selectedWord] * 100)}% •
              Click "Generate Assignments" below to create personalized exercises.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('galaxy')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'galaxy'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Word Galaxy
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'heatmap'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gap Heatmap
            </button>
          </nav>
        </div>

        {/* Visualization Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading visualization...</p>
            </div>
          </div>
        ) : activeTab === 'galaxy' ? (
          <WordGalaxy
            words={data.words}
            gaps={data.gaps}
            width={1000}
            height={700}
            onWordClick={handleWordClick}
          />
        ) : (
          <GapHeatmap
            data={getSampleGapData()}
            width={800}
            height={600}
            onWordClick={handleWordClick}
          />
        )}

        {/* Assignment Generation Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Generate Assignments</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.values(AssignmentType).map(type => (
              <button
                key={type}
                onClick={() => generateAssignment(type)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Click any button to generate a personalized assignment for that exercise type.
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.words.length}</div>
              <div className="text-sm text-gray-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(data.gaps).filter(gap => gap < 0.3).length}
              </div>
              <div className="text-sm text-gray-600">Low Gap Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(data.gaps).filter(gap > 0.7).length}
              </div>
              <div className="text-sm text-gray-600">High Gap Words</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            EduOntology Platform • Built with React, D3.js, and AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;