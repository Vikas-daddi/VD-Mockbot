import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Interview() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentQNum, setCurrentQNum] = useState(0)
  const [totalQ, setTotalQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!sessionId) {
      alert('No session ID. Redirecting to dashboard.')
      navigate('/dashboard')
      return
    }
    loadNextQuestion()
    initSpeech()
  }, [sessionId])

  const initSpeech = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (e) => setAnswer(e.results[0][0].transcript)
    recognition.onerror = () => {
      setIsListening(false)
      alert('Voice error – please type your answer')
    }
    recognitionRef.current = recognition
  }

  const loadNextQuestion = async () => {
    setLoading(true)
    setError('')
    setFeedback('')
    try {
      const res = await api.get(`/user/api/next_question?session_id=${sessionId}`)
      const data = res.data
      if (data.completed) {
        navigate(`/session/${sessionId}`)
      } else if (data.question) {
        setCurrentQuestion(data.question)
        setCurrentQNum(data.current_q)
        setTotalQ(data.total_q)
        setAnswer('')
      } else {
        setError('No question received.')
      }
    } catch (err) {
      setError('Failed to load question.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return alert('Please provide an answer')
    setLoading(true)
    try {
      const res = await api.post('/user/api/submit_answer', {
        session_id: sessionId,
        answer: answer,
        question: currentQuestion
      })
      const data = res.data
      setFeedback(data.feedback)
      if (data.completed) {
        setTimeout(() => navigate(`/session/${sessionId}`), 3000)
      } else {
        setTimeout(() => loadNextQuestion(), 2500)
      }
    } catch (err) {
      alert('Error submitting answer')
    } finally {
      setLoading(false)
    }
  }

  const startVoice = () => {
    if (!recognitionRef.current) return alert('Voice not supported')
    if (isListening) recognitionRef.current.stop()
    else recognitionRef.current.start()
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-success"></div><p>Loading...</p></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div className="interview-container">
      {/* Left panel – Question & answer input */}
      <div className="interview-question-panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="session-progress">Question {currentQNum} of {totalQ}</span>
          <div className="timer-circle">⏱️ Answer time</div>
        </div>
        <div className="progress mb-4">
          <div className="progress-bar" style={{ width: `${(currentQNum/totalQ)*100}%` }}></div>
        </div>
        <div className="question-text">{currentQuestion}</div>
        <textarea
          className="form-control mb-3"
          rows="4"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here or use voice input..."
        />
        <div className="d-flex gap-3">
          <button className="btn btn-success px-4" onClick={submitAnswer} disabled={loading}>
            {loading ? 'Processing...' : 'Submit Answer'}
          </button>
          <button
            className={`voice-button ${isListening ? 'listening' : ''}`}
            onClick={startVoice}
          >
            {isListening ? '🔴 Listening...' : '🎤 Speak'}
          </button>
        </div>
      </div>

      {/* Right panel – Live feedback / AI answer preview */}
      <div className="interview-answer-panel">
        <h5 className="mb-3" style={{ color: '#2E7D32' }}>🤖 AI Feedback</h5>
        {feedback ? (
          <div className="live-feedback">
            {feedback.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        ) : (
          <div className="text-muted text-center py-5">
            <p>Your AI feedback will appear here after you submit your answer.</p>
            <p className="small">💡 Tip: speak or type naturally – the AI evaluates relevance, clarity, and correctness.</p>
          </div>
        )}
      </div>
    </div>
  )
}