/**
 * EduOntology Gap Analysis Component
 * Analyzes learning gaps between current and target levels
 */

import React, { useState, useEffect } from 'react'
import { useGapAnalysis } from '@/hooks/useNeo4j'
import { GapAnalysisResponse } from '@/types/gap-analysis'

interface GapAnalysisProps {
  nodeId: string
  targetLevel?: number
  onGapResolved?: (gapId: string) => void
}

interface GapItem {
  id: string
  type: 'vocabulary' | 'theme'
  title: string
  description: string
  difficulty: number
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed'
}

export const GapAnalysis: React.FC<GapAnalysisProps> = ({
  nodeId,
  targetLevel = 10,
  onGapResolved,
}) => {
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: performGapAnalysis } = useGapAnalysis(nodeId, targetLevel)

  useEffect(() => {
    const analyzeGaps = async () => {
      setLoading(true)
      try {
        performGapAnalysis(undefined, {
          onSuccess: (data) => {
            setGaps(transformGapData(data))
          },
          onError: (err) => {
            setError('Failed to analyze gaps')
          }
        })
      } catch (err) {
        setError('Failed to analyze gaps')
      } finally {
        setLoading(false)
      }
    }

    if (nodeId) {
      analyzeGaps()
    }
  }, [nodeId, targetLevel, performGapAnalysis])

  const transformGapData = (data: GapAnalysisResponse): GapItem[] => {
    const gapItems: GapItem[] = []

    // Transform missing prerequisites
    data.missingPrerequisites.forEach(prereq => {
      gapItems.push({
        id: prereq.id,
        type: prereq.type.toLowerCase() as 'vocabulary' | 'theme',
        title: prereq.term || prereq.name || 'Unknown',
        description: generateDescription(prereq, data.currentNode),
        difficulty: 'difficultyLevel' in prereq ? prereq.difficultyLevel : 5,
        priority: calculatePriority(prereq, data.currentNode),
        status: 'pending'
      })
    })

    // Sort by priority and difficulty
    return gapItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.difficulty - a.difficulty
    })
  }

  const generateDescription = (prereq: any, target: any): string => {
    if (prereq.type === 'Vocabulary') {
      return `Vocabulary term that must be mastered before understanding ${target.term || target.name}`
    } else {
      return `Concept that should be understood before tackling ${target.name || target.term}`
    }
  }

  const calculatePriority = (prereq: any, target: any): 'high' | 'medium' | 'low' => {
    const difficultyDiff = Math.abs(
      ('difficultyLevel' in prereq ? prereq.difficultyLevel : 5) -
      ('difficultyLevel' in target ? target.difficultyLevel : 5)
    )

    if (difficultyDiff > 3) return 'high'
    if (difficultyDiff > 1) return 'medium'
    return 'low'
  }

  const handleGapStatusChange = (gapId: string, status: 'pending' | 'in-progress' | 'completed') => {
    setGaps(prev => prev.map(gap =>
      gap.id === gapId ? { ...gap, status } : gap
    ))

    if (status === 'completed' && onGapResolved) {
      onGapResolved(gapId)
    }
  }

  const getGapScoreColor = (score: number): string => {
    if (score >= 80) return '#f44336' // Red
    if (score >= 50) return '#ff9800' // Orange
    return '#4caf50' // Green
  }

  const calculateProgress = (): number => {
    const completed = gaps.filter(g => g.status === 'completed').length
    const total = gaps.length
    return total > 0 ? (completed / total) * 100 : 0
  }

  if (loading) {
    return (
      <div className="gap-analysis loading">
        <div className="loading-spinner"></div>
        <p>Analyzing learning gaps...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gap-analysis error">
        <p>{error}</p>
      </div>
    )
  }

  const progress = calculateProgress()

  return (
    <div className="gap-analysis">
      <div className="header">
        <h2>Gap Analysis</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, backgroundColor: getGapScoreColor(100 - progress) }}
          ></div>
        </div>
        <div className="progress-text">
          {Math.round(progress)}% Completed
        </div>
      </div>

      {gaps.length === 0 ? (
        <div className="no-gaps">
          <p className="success">No learning gaps detected!</p>
        </div>
      ) : (
        <div className="gaps-list">
          {gaps.map((gap) => (
            <div key={gap.id} className={`gap-item ${gap.status}`}>
              <div className="gap-header">
                <div className="gap-title">
                  <span className={`type-badge ${gap.type}`}>{gap.type}</span>
                  <h3>{gap.title}</h3>
                </div>
                <div className="gap-priority">
                  <span className={`priority-badge ${gap.priority}`}>
                    {gap.priority}
                  </span>
                  <span className="difficulty">Level {gap.difficulty}</span>
                </div>
              </div>

              <div className="gap-description">
                {gap.description}
              </div>

              <div className="gap-actions">
                <div className="status-selector">
                  <button
                    className={`status-btn ${gap.status === 'pending' ? 'active' : ''}`}
                    onClick={() => handleGapStatusChange(gap.id, 'pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`status-btn ${gap.status === 'in-progress' ? 'active' : ''}`}
                    onClick={() => handleGapStatusChange(gap.id, 'in-progress')}
                  >
                    In Progress
                  </button>
                  <button
                    className={`status-btn ${gap.status === 'completed' ? 'active' : ''}`}
                    onClick={() => handleGapStatusChange(gap.id, 'completed')}
                  >
                    Completed
                  </button>
                </div>

                <div className="gap-actions-buttons">
                  <button className="btn-primary">
                    Study Now
                  </button>
                  <button className="btn-secondary">
                    Add to Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .gap-analysis {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin: 10px 0;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          color: #666;
        }

        .no-gaps {
          text-align: center;
          padding: 40px;
        }

        .success {
          color: #4caf50;
          font-size: 18px;
        }

        .gaps-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gap-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background-color: #fff;
          transition: all 0.3s ease;
        }

        .gap-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .gap-item.completed {
          border-color: #4caf50;
          background-color: #f1f8e9;
        }

        .gap-item.in-progress {
          border-color: #ff9800;
          background-color: #fff3e0;
        }

        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .gap-title h3 {
          margin: 0;
          color: #333;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-right: 10px;
        }

        .type-badge.vocabulary {
          background-color: #e8f5e8;
          color: #2e7d32;
        }

        .type-badge.theme {
          background-color: #e3f2fd;
          color: #1565c0;
        }

        .priority-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
        }

        .priority-badge.high {
          background-color: #ffebee;
          color: #c62828;
        }

        .priority-badge.medium {
          background-color: #fff3e0;
          color: #ef6c00;
        }

        .priority-badge.low {
          background-color: #e8f5e8;
          color: #2e7d32;
        }

        .gap-description {
          color: #666;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .gap-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-selector {
          display: flex;
          gap: 10px;
        }

        .status-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .status-btn.active {
          background-color: #2196f3;
          color: #fff;
          border-color: #2196f3;
        }

        .status-btn:hover {
          background-color: #f5f5f5;
        }

        .status-btn.active:hover {
          background-color: #1976d2;
        }

        .gap-actions-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: #2196f3;
          color: #fff;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .btn-primary:hover {
          background-color: #1976d2;
        }

        .btn-secondary {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fff;
          color: #333;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background-color: #f5f5f5;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2196f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error {
          text-align: center;
          padding: 40px;
          color: #f44336;
        }
      `}</style>
    </div>
  )
}

export default GapAnalysis