import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function UserDashboard() {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 })
  const [showModal, setShowModal] = useState(false)
  const [newRole, setNewRole] = useState('Python Developer')
  const [newDifficulty, setNewDifficulty] = useState('Medium')
  const [newCategory, setNewCategory] = useState('General')
  const [newQCount, setNewQCount] = useState(5)
  const { user } = useAuth()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.get('/user/api/sessions')
      if (Array.isArray(res.data)) {
        setSessions(res.data)
        const completed = res.data.filter(s => s.completed_at).length
        const totalScore = res.data.reduce((acc, s) => acc + (s.final_avg_score || 0), 0)
        const avg = res.data.length ? (totalScore / res.data.length).toFixed(1) : 0
        setStats({
          total: res.data.length,
          completed,
          avgScore: avg
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const startSession = async () => {
    try {
      const res = await api.post('/user/api/start_session', {
        role: newRole,
        difficulty: newDifficulty,
        category: newCategory,
        question_count: newQCount
      })
      window.location.href = `/interview?session_id=${res.data.session_id}`
    } catch (err) {
      alert('Failed to start session')
    }
  }

  const resumeSession = (sessionId) => {
    window.location.href = `/interview?session_id=${sessionId}`
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section mb-5">
        <div>
          <h1 className="display-6 fw-bold" style={{ color: '#1B5E20' }}>Welcome back, {user?.username}!</h1>
          <p className="text-muted">Track your progress and continue where you left off.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4 py-2 shadow-sm" onClick={() => setShowModal(true)}>
          + New Mock Interview
        </button>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center">
            <div className="stat-icon bg-success bg-opacity-10 rounded-circle p-3 me-3">
              <span style={{ fontSize: '1.8rem' }}>📅</span>
            </div>
            <div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center">
            <div className="stat-icon bg-success bg-opacity-10 rounded-circle p-3 me-3">
              <span style={{ fontSize: '1.8rem' }}>✅</span>
            </div>
            <div>
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center">
            <div className="stat-icon bg-success bg-opacity-10 rounded-circle p-3 me-3">
              <span style={{ fontSize: '1.8rem' }}>📈</span>
            </div>
            <div>
              <div className="stat-number">{stats.avgScore}</div>
              <div className="stat-label">Avg. Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4 pb-0">
          <h4 className="mb-0" style={{ color: '#1B5E20' }}>Recent Interview Sessions</h4>
          <p className="text-muted small">Your latest practice sessions</p>
        </div>
        <div className="card-body">
          {sessions.length === 0 ? (
            <div className="text-center py-5">
              <p className="lead">No sessions yet</p>
              <button className="btn btn-outline-success rounded-pill" onClick={() => setShowModal(true)}>
                Start your first interview
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {sessions.slice(0, 6).map(session => {
                const isCompleted = !!session.completed_at
                const progressPercent = (session.current_question_index / session.question_count) * 100
                return (
                  <div className="col-md-6 col-lg-4" key={session.id}>
                    <div className="session-card h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="session-title mb-0">{session.title.split(' - ')[0]}</h5>
                        <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-progress'}`}>
                          {isCompleted ? '✓ Completed' : '🔄 In progress'}
                        </span>
                      </div>
                      <div className="text-muted small mb-2">
                        📅 {new Date(session.started_at).toLocaleDateString()}
                      </div>
                      <div className="mb-2">
                        <div className="progress" style={{ height: '6px' }}>
                          <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="session-progress">{session.current_question_index}/{session.question_count} questions</span>
                          <span className="fw-bold" style={{ color: '#2E7D32' }}>
                            {session.final_avg_score ? `${session.final_avg_score.toFixed(1)}` : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-2">
                        {isCompleted ? (
                          <Link to={`/session/${session.id}`} className="btn btn-sm btn-outline-success w-100 rounded-pill">
                            📄 View Report
                          </Link>
                        ) : (
                          <button className="btn btn-sm btn-success w-100 rounded-pill" onClick={() => resumeSession(session.id)}>
                            ▶ Resume Interview
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#1B5E20' }}>✨ New Mock Interview</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Job Role</label>
                  <input type="text" className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)} />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Difficulty</label>
                    <select className="form-select" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}>
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category</label>
                    <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                      <option>General</option><option>Data Structures</option><option>Algorithms</option>
                      <option>System Design</option><option>Databases</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Number of Questions</label>
                  <input type="number" className="form-control" value={newQCount} onChange={e => setNewQCount(e.target.value)} min={1} max={20} />
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button className="btn btn-secondary rounded-pill" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary rounded-pill px-4" onClick={startSession}>Start Interview →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}