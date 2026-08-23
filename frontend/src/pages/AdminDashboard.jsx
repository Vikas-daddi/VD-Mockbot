import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Users, FileText, CheckCircle, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    api.get('/admin/api/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
  }, [])

  return (
    <div className="container mt-5">
      <h2 className="mb-4 d-flex align-items-center gap-2" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
        Admin Dashboard
      </h2>
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Total Users</div>
                <div className="stat-number">{stats.total_users || 0}</div>
              </div>
              <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                <Users size={24} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Total Sessions</div>
                <div className="stat-number">{stats.total_sessions || 0}</div>
              </div>
              <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <FileText size={24} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Completed</div>
                <div className="stat-number">{stats.completed_sessions || 0}</div>
              </div>
              <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Avg Score</div>
                <div className="stat-number">
                  {stats.avg_score ? parseFloat(stats.avg_score).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}