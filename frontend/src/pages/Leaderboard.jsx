import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/user/api/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-success"></div><p>Loading top performers...</p></div>

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0" style={{ color: '#2E7D32' }}>🏆 Top Performers</h2>
        <p className="text-muted">Based on average interview scores</p>
      </div>
      <div className="card-body">
        {leaders.length === 0 ? (
          <div className="text-center py-5">
            <p>No completed sessions yet.</p>
            <p>Be the first to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>Average Score</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((user, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>
                      {idx + 1}
                      {idx === 0 && ' 🥇'}
                      {idx === 1 && ' 🥈'}
                      {idx === 2 && ' 🥉'}
                    </td>
                    <td>{user.username}</td>
                    <td>
                      <span style={{ background: '#E8F5E9', padding: '0.2rem 0.8rem', borderRadius: '40px', color: '#2E7D32', fontWeight: 'bold' }}>
                        {user.avg_score} / 5
                      </span>
                    </td>
                    <td>{user.sessions} session{user.sessions !== 1 ? 's' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}