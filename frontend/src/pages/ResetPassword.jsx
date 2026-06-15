import React, { useState } from 'react'
import { api } from '../api'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/auth/api/reset_password/${token}`, { password })
      alert('Password updated. Please login.')
      navigate('/login')
    } catch (err) {
      setError('Reset link invalid or expired.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">Set New Password</div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>New Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Reset Password</button>
            </form>
            <p className="mt-3"><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}