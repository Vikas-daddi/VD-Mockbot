import React, { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/api/register', { username, email, password })
      alert('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.msg || 'Registration failed'
      setError(msg)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">Register</div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Username</label>
                <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label>Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label>Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Register</button>
            </form>
            <p className="mt-3"><Link to="/login">Already have an account? Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}