import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function SessionDetail() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    api.get(`/user/api/session_data/${id}`)
      .then(res => {
        setSession(res.data.session)
        setAnswers(res.data.answers)
      })
      .catch(console.error)
  }, [id])

  if (!session) return <div>Loading...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h3>{session.title}</h3>
        <p>Started: {new Date(session.started_at).toLocaleString()}</p>
        <p>Role: {session.role} | Difficulty: {session.difficulty} | Category: {session.category}</p>
        <p>Final Average Score: {session.final_avg_score.toFixed(2)} / 5</p>
        <p>{session.final_feedback}</p>
      </div>
      <div className="card-body">
        <h4>Question & Answer Details</h4>
        {answers.map((ans, idx) => (
          <div key={idx} className="border p-3 mb-3">
            <strong>Q{idx+1}:</strong> {ans.question}<br />
            <strong>Your answer:</strong> {ans.answer}<br />
            <strong>Feedback:</strong> {ans.feedback}<br />
            <strong>Scores:</strong> Relevance {ans.scores.relevance}/5, Clarity {ans.scores.clarity}/5, Correctness {ans.scores.correctness}/5
          </div>
        ))}
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        <button className="btn btn-secondary ms-2" onClick={() => {
          const dataStr = JSON.stringify(answers, null, 2)
          const blob = new Blob([dataStr], {type: 'application/json'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `session_${id}.json`
          a.click()
          URL.revokeObjectURL(url)
        }}>Export as JSON</button>
      </div>
    </div>
  )
}