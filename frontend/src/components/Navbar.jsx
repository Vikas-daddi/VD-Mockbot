import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [newRole, setNewRole] = useState('Python Developer')
  const [newDifficulty, setNewDifficulty] = useState('Medium')
  const [newCategory, setNewCategory] = useState('General')
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
        question_count: newQCount
      })
      window.location.href = `/interview?session_id=${res.data.session_id}`
    } catch (err) {
      alert('Failed to start session')
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">🎤 VD MockBot</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {user ? (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                  {/* Interview link now opens modal instead of direct navigation */}
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'white' }}>
                      Interview
                    </button>
                  </li>
                  <li className="nav-item"><Link className="nav-link" to="/leaderboard">Leaderboard</Link></li>
                  {user.role === 'admin' && (
                    <>
                      <li className="nav-item"><Link className="nav-link" to="/admin">Admin</Link></li>
                      <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                    </>
                  )}
                  <li className="nav-item">
                    <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Modal for starting a new interview */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Start New Mock Interview</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Job Role</label>
                  <input type="text" className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label>Difficulty</label>
                  <select className="form-select" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label>Category</label>
                  <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    <option>General</option><option>Data Structures</option><option>Algorithms</option>
                    <option>System Design</option><option>Databases</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label>Number of Questions</label>
                  <input type="number" className="form-control" value={newQCount} onChange={e => setNewQCount(e.target.value)} min={1} max={20} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={startSession}>Start Interview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}