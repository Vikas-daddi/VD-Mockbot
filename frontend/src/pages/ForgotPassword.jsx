import React, { useState } from 'react'
import { api } from '../api'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/auth/api/forgot_password', { email })
      setMessage('If that email is registered, a reset link has been sent.')
    } catch (err) {
      console.error(err)
      setMessage('Error sending reset link.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">Reset Password</div>
          <div className="card-body">
            {message && <div className="alert alert-info">{message}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Send Reset Link</button>
            </form>
            <p className="mt-3"><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}