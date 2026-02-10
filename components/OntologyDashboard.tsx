/**
 * EduOntology Dashboard Component
 * Main dashboard integrating all visualization components
 */

import React, { useState, useEffect } from 'react'
import { useVocabularies, useThemes, usePassages } from '@/hooks/useNeo4j'
import { LearningPathVisualization } from './LearningPathVisualization'
import { LayeredMapVisualization } from './LayeredMapVisualization'
import { GapAnalysis } from './GapAnalysis'
import { Vocabulary, Theme, Passage, LearningPathResponse } from '@/types'

interface OntologyDashboardProps {
  selectedNode?: string
}

export const OntologyDashboard: React.FC<OntologyDashboardProps> = ({
  selectedNode,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'paths' | 'gaps'>('map')
  const [selectedVocabulary, setSelectedVocabulary] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedPassage, setSelectedPassage] = useState<string | null>(null)

  // Fetch data from Neo4j
  const { data: vocabulariesData, isLoading: isLoadingVocabs } = useVocabularies({
    first: 50,
    skip: 0,
  })

  const { data: themesData, isLoading: isLoadingThemes } = useThemes({
    first: 30,
    skip: 0,
  })

  const { data: passagesData, isLoading: isLoadingPassages } = usePassages({
    first: 20,
    skip: 0,
  })

  // Filter data based on selections
  const vocabularies: Vocabulary[] = vocabulariesData?.data || []
  const themes: Theme[] = themesData?.data || []
  const passages: Passage[] = passagesData?.data || []

  const filteredVocabularies = selectedVocabulary
    ? vocabularies.filter(v => v.id === selectedVocabulary)
    : vocabularies

  const filteredThemes = selectedTheme
    ? themes.filter(t => t.id === selectedTheme)
    : themes

  const filteredPassages = selectedPassage
    ? passages.filter(p => p.id === selectedPassage)
    : passages

  // Sample learning path data
  const sampleLearningPath: LearningPathResponse = {
    id: 'path_1',
    startNode: {
      id: 'v1',
      type: 'Vocabulary',
      term: 'Basic',
      name: null,
    },
    endNode: {
      id: 'v10',
      type: 'Vocabulary',
      term: 'Advanced',
      name: null,
    },
    steps: [
      {
        currentNode: {
          id: 'v1',
          type: 'Vocabulary',
          term: 'Basic',
          name: null,
        },
        nextNode: {
          id: 'v2',
          type: 'Vocabulary',
          term: 'Intermediate',
          name: null,
        },
        relationshipType: 'PRECEDES',
        confidence: 90,
      },
      {
        currentNode: {
          id: 'v2',
          type: 'Vocabulary',
          term: 'Intermediate',
          name: null,
        },
        nextNode: {
          id: 'v10',
          type: 'Vocabulary',
          term: 'Advanced',
          name: null,
        },
        relationshipType: 'REQUIRES',
        confidence: 75,
      },
    ],
    totalDifficulty: 15,
    estimatedTime: 60,
  }

  const handleNodeClick = (node: Vocabulary | Theme | Passage) => {
    console.log('Node clicked:', node)
    // Implementation for node click handling
  }

  const handleStepClick = (step: any) => {
    console.log('Step clicked:', step)
    // Implementation for step click handling
  }

  const handleGapResolved = (gapId: string) => {
    console.log('Gap resolved:', gapId)
    // Implementation for gap resolution
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="map-tab">
            <div className="map-controls">
              <h3>3-Layer Map Visualization</h3>
              <p>
                This visualization shows the distribution of educational content across three layers:
                Elementary (1-3), Middle (4-7), and College (8-10) levels.
              </p>
            </div>
            <LayeredMapVisualization
              vocabularies={filteredVocabularies}
              themes={filteredThemes}
              passages={filteredPassages}
              width={1000}
              height={600}
              onNodeClick={handleNodeClick}
            />
          </div>
        )

      case 'paths':
        return (
          <div className="paths-tab">
            <div className="path-controls">
              <h3>Learning Path Visualization</h3>
              <p>
                Explore the learning paths between concepts, showing prerequisites
                and progression routes.
              </p>
            </div>
            <LearningPathVisualization
              learningPath={sampleLearningPath}
              width={800}
              height={400}
              onStepClick={handleStepClick}
            />
          </div>
        )

      case 'gaps':
        return (
          <div className="gaps-tab">
            <div className="gap-controls">
              <h3>Gap Analysis</h3>
              <p>
                Identify and track learning gaps between your current knowledge
                and target proficiency levels.
              </p>
            </div>
            {selectedNode ? (
              <GapAnalysis
                nodeId={selectedNode}
                targetLevel={8}
                onGapResolved={handleGapResolved}
              />
            ) : (
              <div className="no-selection">
                <p>Please select a node to analyze its learning gaps.</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const renderStats = () => {
    const totalItems = vocabularies.length + themes.length + passages.length
    const avgDifficulty = vocabularies.length > 0
      ? vocabularies.reduce((sum, v) => sum + v.difficultyLevel, 0) / vocabularies.length
      : 0

    return (
      <div className="stats-panel">
        <div className="stat-item">
          <span className="stat-label">Total Items</span>
          <span className="stat-value">{totalItems}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Vocabularies</span>
          <span className="stat-value">{vocabularies.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Themes</span>
          <span className="stat-value">{themes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Passages</span>
          <span className="stat-value">{passages.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg. Difficulty</span>
          <span className="stat-value">{avgDifficulty.toFixed(1)}</span>
        </div>
      </div>
    )
  }

  const renderFilters = () => {
    return (
      <div className="filters-panel">
        <h3>Filters</h3>

        <div className="filter-group">
          <label>Difficulty Level:</label>
          <select
            value=""
            onChange={(e) => {
              // Implementation for difficulty filter
            }}
          >
            <option value="">All Levels</option>
            <option value="1-3">Elementary (1-3)</option>
            <option value="4-7">Middle (4-7)</option>
            <option value="8-10">College (8-10)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <div className="checkbox-group">
            <label>
              <input type="checkbox" checked={true} readOnly />
              Vocabularies
            </label>
            <label>
              <input type="checkbox" checked={true} readOnly />
              Themes
            </label>
            <label>
              <input type="checkbox" checked={true} readOnly />
              Passages
            </label>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingVocabs || isLoadingThemes || isLoadingPassages) {
    return (
      <div className="ontology-dashboard loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Ontology Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ontology-dashboard">
      <div className="dashboard-header">
        <h1>EduOntology Dashboard</h1>
        <p>Interactive visualization and analysis of educational content relationships</p>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          {renderStats()}
          {renderFilters()}
        </div>

        <div className="main-content">
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              3-Layer Map
            </button>
            <button
              className={`tab-btn ${activeTab === 'paths' ? 'active' : ''}`}
              onClick={() => setActiveTab('paths')}
            >
              Learning Paths
            </button>
            <button
              className={`tab-btn ${activeTab === 'gaps' ? 'active' : ''}`}
              onClick={() => setActiveTab('gaps')}
            >
              Gap Analysis
            </button>
          </div>

          {renderContent()}
        </div>
      </div>

      <style jsx>{`
        .ontology-dashboard {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          text-align: center;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 300;
        }

        .dashboard-header p {
          margin: 0.5rem 0 0;
          opacity: 0.9;
        }

        .dashboard-content {
          display: flex;
          flex: 1;
          gap: 1rem;
          padding: 1rem;
        }

        .sidebar {
          width: 300px;
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .stats-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .stat-value {
          font-weight: bold;
          color: #333;
        }

        .filters-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          color: #333;
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          color: #333;
        }

        .tab-btn.active {
          border-bottom-color: #667eea;
          color: #667eea;
        }

        .map-tab,
        .paths-tab,
        .gaps-tab {
          flex: 1;
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .map-controls,
        .path-controls,
        .gap-controls {
          margin-bottom: 1rem;
        }

        .map-controls h3,
        .path-controls h3,
        .gap-controls h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .map-controls p,
        .path-controls p,
        .gap-controls p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background-color: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .loading-content {
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default OntologyDashboard