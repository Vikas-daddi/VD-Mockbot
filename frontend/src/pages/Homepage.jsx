import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Homepage() {
  const { user } = useAuth()

  return (
    <>
      {/* Hero Section */}
      <div className="hero text-white py-5" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="container py-5 text-center">
          <h1 className="display-2 fw-bold mb-4">VD MockBot</h1>
          <p className="lead fs-2 mb-3">Master interviews with AI</p>
          <p className="lead mb-5">Real conversations, instant feedback, and job‑ready confidence.</p>
          {!user ? (
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/register" className="btn btn-light btn-lg px-5 py-3 rounded-pill">🚀 Start Free</Link>
              <Link to="/login" className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill">Sign In</Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn btn-light btn-lg px-5 py-3 rounded-pill">📊 Go to Dashboard</Link>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="container my-5 py-4">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-semibold">Why practice with <span className="text-primary">VD MockBot</span>?</h2>
          <p className="lead text-secondary">Everything you need to succeed</p>
        </div>
        <div className="row g-4">
          {[
            { icon: '🎤', title: 'Voice Interview', desc: 'Answer naturally with speech recognition. Feels like the real thing.' },
            { icon: '🤖', title: 'AI Smart Feedback', desc: 'Get instant scores on relevance, clarity & correctness.' },
            { icon: '📊', title: 'Progress Analytics', desc: 'Track your improvement with detailed session history.' },
            { icon: '🎚️', title: 'Custom Difficulty', desc: 'Easy, Medium, Hard – challenge yourself.' },
            { icon: '📋', title: 'Export Reports', desc: 'Download transcripts and share with mentors.' },
            { icon: '🏆', title: 'Leaderboard', desc: 'Compete globally and see how you rank.' }
          ].map((feature, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card h-100 text-center p-4 border-0 shadow-hover">
                <div className="feature-icon display-1">{feature.icon}</div>
                <h3 className="h4 fw-bold mt-3">{feature.title}</h3>
                <p className="text-muted">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5">How It Works</h2>
            <p className="lead">Three simple steps to interview mastery</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 text-center">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="display-4">1</span>
              </div>
              <h4>Create Account</h4>
              <p>Sign up in seconds – free forever.</p>
            </div>
            <div className="col-md-4 text-center">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="display-4">2</span>
              </div>
              <h4>Choose Settings</h4>
              <p>Select role, difficulty, and question count.</p>
            </div>
            <div className="col-md-4 text-center">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="display-4">3</span>
              </div>
              <h4>Practice & Improve</h4>
              <p>Answer, get feedback, and review reports.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials / Stats */}
      <div className="container py-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <div className="card p-4">
              <h3 className="display-4 fw-bold text-primary">500+</h3>
              <p className="mb-0">Mock interviews completed</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4">
              <h3 className="display-4 fw-bold text-primary">98%</h3>
              <p className="mb-0">User satisfaction rate</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4">
              <h3 className="display-4 fw-bold text-primary">10k+</h3>
              <p className="mb-0">Questions generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-dark text-white py-5" style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
        <div className="container text-center py-4">
          <h2 className="display-5 mb-4">Ready to boost your career?</h2>
          <p className="lead mb-4">Join thousands of professionals who aced their interviews.</p>
          {!user ? (
            <Link to="/register" className="btn btn-light btn-lg rounded-pill px-5">Get Started Now →</Link>
          ) : (
            <Link to="/dashboard" className="btn btn-light btn-lg rounded-pill px-5">Go to Dashboard →</Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4">
        <div className="container">
          <small>&copy; 2026 VD MockBot – AI Mock Interview Platform. All rights reserved.</small>
          <div className="mt-2">
            <Link to="/" className="text-white-50 text-decoration-none me-3">Home</Link>
            <Link to="/login" className="text-white-50 text-decoration-none me-3">Login</Link>
            <Link to="/register" className="text-white-50 text-decoration-none">Register</Link>
          </div>
        </div>
      </footer>
    </>
  )
}