import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import { Mic, LayoutDashboard, Trophy, Settings, Users, LogOut, Play } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showModal, setShowModal] = useState(false)
  const [newRole, setNewRole] = useState('Python Developer')
  const [newDifficulty, setNewDifficulty] = useState('Medium')
  const [newCategory, setNewCategory] = useState('General')
  const [newFormat, setNewFormat] = useState('Open-Ended')
  const [newQCount, setNewQCount] = useState(5)

  const handleLogout = () => {
    logout()
    navigate('/login')
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
      window.location.href = `/interview?session_id=${res.data.session_id}`
    } catch (err) {
      alert('Failed to start session')
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <Mic size={24} className="text-primary-light" />
            <span>MockBot AI</span>
          </Link>
          <button className="navbar-toggler btn-outline-light" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center gap-2">
              {user ? (
                <>
                  <li className="nav-item">
                    <Link className={`nav-link d-flex align-items-center gap-2 ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link d-flex align-items-center gap-2 ${isActive('/leaderboard') ? 'active' : ''}`} to="/leaderboard">
                      <Trophy size={18} /> Leaderboard
                    </Link>
                  </li>
                  
                  {user.role === 'admin' && (
                    <>
                      <li className="nav-item">
                        <Link className={`nav-link d-flex align-items-center gap-2 ${isActive('/admin') ? 'active' : ''}`} to="/admin">
                          <Settings size={18} /> Admin
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className={`nav-link d-flex align-items-center gap-2 ${isActive('/admin/users') ? 'active' : ''}`} to="/admin/users">
                          <Users size={18} /> Users
                        </Link>
                      </li>
                    </>
                  )}
                  
                  <li className="nav-item ms-lg-3 d-flex gap-3 align-items-center">
                    <button className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4" onClick={() => setShowModal(true)}>
                      <Play size={16} /> New Interview
                    </button>
                    <button className="btn btn-outline-light d-flex align-items-center gap-2 rounded-pill px-4" onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item ms-lg-2">
                    <Link className="btn btn-primary rounded-pill px-4" to="/register">Get Started</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Modal for starting a new interview */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title">Start New Mock Interview</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <label className="form-label">Job Role</label>
                  <input type="text" className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)} />
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
    </>
  )
}