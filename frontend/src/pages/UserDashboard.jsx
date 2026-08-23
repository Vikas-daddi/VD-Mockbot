import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Play, FileText, TrendingUp, Calendar, CheckCircle, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function UserDashboard() {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 })
  const [chartData, setChartData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newRole, setNewRole] = useState('Python Developer')
  const [newDifficulty, setNewDifficulty] = useState('Medium')
  const [newCategory, setNewCategory] = useState('General')
  const [newFormat, setNewFormat] = useState('Open-Ended')
  const [newQCount, setNewQCount] = useState(5)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.get('/user/api/sessions')
      if (Array.isArray(res.data)) {
        setSessions(res.data)
        const completed = res.data.filter(s => s.completed_at)
        const totalScore = completed.reduce((acc, s) => acc + (s.final_avg_score || 0), 0)
        const avg = completed.length ? (totalScore / completed.length).toFixed(1) : 0
        setStats({
          total: res.data.length,
          completed: completed.length,
          avgScore: avg
        })
        
        // Prepare chart data (reverse to show chronological)
        const cData = completed.slice(0, 10).reverse().map((s, idx) => ({
          name: `S${idx + 1}`,
          score: Math.round(s.final_avg_score * 10) / 10
        }))
        setChartData(cData)
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
        format: newFormat,
        question_count: newQCount
      })
      navigate(`/interview?session_id=${res.data.session_id}`)
    } catch (err) {
      alert('Failed to start session')
    }
  }

  const resumeSession = (sessionId) => {
    navigate(`/interview?session_id=${sessionId}`)
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold mb-1">Welcome back, {user?.username}!</h1>
          <p className="text-muted mb-0">Track your progress and continue where you left off.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-4" onClick={() => setShowModal(true)}>
          <Play size={18} /> New Mock Interview
        </button>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center gap-4">
            <div className="p-3 rounded-circle" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Calendar size={32} />
            </div>
            <div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center gap-4">
            <div className="p-3 rounded-circle" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle size={32} />
            </div>
            <div>
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card d-flex align-items-center gap-4">
            <div className="p-3 rounded-circle" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f43f5e' }}>
              <TrendingUp size={32} />
            </div>
            <div>
              <div className="stat-number">{stats.avgScore}</div>
              <div className="stat-label">Avg. Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-lg-8">
          <div className="card h-100 border-0 shadow-sm glass-panel p-4">
            <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
              <Activity size={20} className="text-primary" /> Performance History
            </h5>
            {chartData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                      itemStyle={{ color: '#4f46e5' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                Complete more sessions to see your progress chart.
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4">
           <div className="card h-100 border-0 shadow-sm glass-panel p-4">
              <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                <FileText size={20} className="text-primary" /> Quick Start
              </h5>
              <div className="d-flex flex-column gap-3 h-100 justify-content-center">
                 <button className="btn btn-outline-light d-flex justify-content-between align-items-center" onClick={() => { setNewRole('Software Engineer'); setShowModal(true); }}>
                   Software Engineer <span>→</span>
                 </button>
                 <button className="btn btn-outline-light d-flex justify-content-between align-items-center" onClick={() => { setNewRole('Data Scientist'); setShowModal(true); }}>
                   Data Scientist <span>→</span>
                 </button>
                 <button className="btn btn-outline-light d-flex justify-content-between align-items-center" onClick={() => { setNewRole('Product Manager'); setShowModal(true); }}>
                   Product Manager <span>→</span>
                 </button>
                 <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>
                   Custom Role
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm glass-panel p-4">
        <h5 className="mb-4 fw-bold">Recent Sessions</h5>
        {sessions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-3">No sessions yet</p>
            <button className="btn btn-primary px-4" onClick={() => setShowModal(true)}>
              Start your first interview
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {sessions.slice(0, 6).map(session => {
              const isCompleted = !!session.completed_at
              const progressPercent = (session.current_question_index / session.question_count) * 100
              return (
                <div className="col-md-6 col-xl-4" key={session.id}>
                  <div className="session-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="session-title mb-0">{session.title.split(' - ')[0]}</h6>
                      <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-progress'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="text-muted small mb-4">
                      {new Date(session.started_at).toLocaleDateString()} • {session.difficulty}
                    </div>
                    
                    <div className="mt-auto">
                      <div className="progress mb-2">
                        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="small text-muted">{session.current_question_index}/{session.question_count} questions</span>
                        {isCompleted && (
                          <span className="fw-bold text-success">
                            {session.final_avg_score ? `${session.final_avg_score.toFixed(1)} / 10` : '—'}
                          </span>
                        )}
                      </div>
                      
                      {isCompleted ? (
                        <Link to={`/session/${session.id}`} className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2">
                          <FileText size={16} /> View Report
                        </Link>
                      ) : (
                        <button className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" onClick={() => resumeSession(session.id)}>
                          <Play size={16} /> Resume
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

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title">New Mock Interview</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <label className="form-label">Job Role</label>
                  <input type="text" className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. Frontend Developer" />
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Difficulty</label>
                    <select className="form-select" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}>
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                      <option>General</option><option>Data Structures</option><option>Algorithms</option>
                      <option>System Design</option><option>Behavioral</option>
                    </select>
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Format</label>
                    <select className="form-select" value={newFormat} onChange={e => setNewFormat(e.target.value)}>
                      <option>Open-Ended</option>
                      <option>MCQ</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Number of Questions</label>
                    <input type="number" className="form-control" value={newQCount} onChange={e => setNewQCount(e.target.value)} min={1} max={20} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button className="btn btn-outline-light" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={startSession}>Start Interview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}