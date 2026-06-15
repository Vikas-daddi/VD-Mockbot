import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    api.get('/admin/api/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
  }, [])

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div className="row">
        <div className="col-md-3"><div className="card bg-primary text-white"><div className="card-body">Total Users: {stats.total_users}</div></div></div>
        <div className="col-md-3"><div className="card bg-success text-white"><div className="card-body">Total Sessions: {stats.total_sessions}</div></div></div>
        <div className="col-md-3"><div className="card bg-info text-white"><div className="card-body">Completed: {stats.completed_sessions}</div></div></div>
        <div className="col-md-3"><div className="card bg-warning text-white"><div className="card-body">Avg Score: {stats.avg_score}</div></div></div>
      </div>
    </div>
  )
}