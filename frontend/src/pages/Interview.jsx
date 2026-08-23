import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Mic, Send, StopCircle, RefreshCw, Volume2, VolumeX, MessageSquare, Lightbulb } from 'lucide-react'

export default function Interview() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [options, setOptions] = useState([])
  const [recommendation, setRecommendation] = useState('')
  const [currentQNum, setCurrentQNum] = useState(0)
  const [totalQ, setTotalQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [typedFeedback, setTypedFeedback] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (!sessionId) {
      alert('No session ID. Redirecting to dashboard.')
      navigate('/dashboard')
      return
    }
    loadNextQuestion()
    initSpeech()
    
    return () => {
      if (synthRef.current) synthRef.current.cancel()
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    }
  }, [sessionId])

  const initSpeech = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (e) => {
      let finalTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' '
        }
      }
      if (finalTranscript) {
        setAnswer(prev => prev + finalTranscript)
      }
    }
    recognition.onerror = () => {
      setIsListening(false)
    }
    recognitionRef.current = recognition
  }

  const speakQuestion = (text) => {
    if (!ttsEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    synthRef.current.speak(utterance)
  }

  const loadNextQuestion = async () => {
    setLoading(true)
    setError('')
    setFeedback('')
    setTypedFeedback('')
    try {
      const res = await api.get(`/user/api/next_question?session_id=${sessionId}`)
      const data = res.data
      if (data.completed) {
        navigate(`/session/${sessionId}`)
      } else if (data.question) {
        setCurrentQuestion(data.question)
        setOptions(data.options || [])
        setRecommendation(data.recommendation || '')
        setCurrentQNum(data.current_q)
        setTotalQ(data.total_q)
        setAnswer('')
        setTimeout(() => speakQuestion(data.question), 500)
      } else {
        setError('No question received.')
      }
    } catch (err) {
      setError('Failed to load question.')
    } finally {
      setLoading(false)
    }
  }

  // Typewriter effect for feedback
  useEffect(() => {
    if (feedback) {
      setTypedFeedback('')
      let i = 0
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
      typingTimerRef.current = setInterval(() => {
        setTypedFeedback(prev => prev + feedback.charAt(i))
        i++
        if (i >= feedback.length) {
          clearInterval(typingTimerRef.current)
        }
      }, 15) // Speed of typing
    }
  }, [feedback])

  const submitAnswer = async () => {
    if (!answer.trim()) return alert('Please provide an answer')
    if (synthRef.current) synthRef.current.cancel()
    if (isListening && recognitionRef.current) recognitionRef.current.stop()
    
    setLoading(true)
    try {
      const res = await api.post('/user/api/submit_answer', {
        session_id: sessionId,
        answer: answer,
        question: currentQuestion
      })
      const data = res.data
      setFeedback(data.feedback)
      
      // Auto-progress after reading feedback
      if (data.completed) {
        setTimeout(() => navigate(`/session/${sessionId}`), 6000)
      } else {
        setTimeout(() => loadNextQuestion(), 5000)
      }
    } catch (err) {
      alert('Error submitting answer')
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert('Voice recognition not supported on this browser.')
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      if (synthRef.current) synthRef.current.cancel() // Stop AI speaking if user starts talking
      recognitionRef.current.start()
    }
  }

  if (loading && !currentQuestion) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <RefreshCw size={48} className="text-primary mb-3" style={{ animation: 'spin 2s linear infinite' }} />
        <h4 className="text-muted">Loading your interview...</h4>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  if (error) return <div className="container mt-5"><div className="alert alert-danger rounded-4">{error}</div></div>

  const isMCQ = options && options.length > 0;

  return (
    <div className="interview-container">
      {/* Left panel – Question & answer input */}
      <div className="interview-panel question-panel">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill shadow-sm">
              Question {currentQNum} of {totalQ}
            </span>
            <button 
              className="btn btn-outline-light btn-sm rounded-circle p-2"
              onClick={() => {
                setTtsEnabled(!ttsEnabled)
                if (ttsEnabled && synthRef.current) synthRef.current.cancel()
              }}
              title="Toggle Text-to-Speech"
            >
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          <span className="text-muted small">⏱️ Take your time</span>
        </div>
        
        <div className="progress mb-5">
          <div className="progress-bar" style={{ width: `${(currentQNum/totalQ)*100}%` }}></div>
        </div>
        
        <div className="question-text">
          {currentQuestion}
        </div>

        {recommendation && (
          <div className="mb-4 p-3 rounded d-flex gap-3 align-items-start" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981' }}>
             <Lightbulb size={24} className="text-success flex-shrink-0 mt-1" />
             <div>
               <strong className="d-block text-success mb-1">AI Recommendation</strong>
               <span className="text-muted small">{recommendation}</span>
             </div>
          </div>
        )}
        
        <div className="mt-auto">
          {isMCQ ? (
            <div className="d-flex flex-column gap-3 mb-4">
              {options.map((opt, idx) => (
                <button 
                  key={idx} 
                  className={`btn text-start p-3 border ${answer === opt ? 'btn-primary' : 'btn-outline-light'}`}
                  onClick={() => setAnswer(opt)}
                  style={{ borderRadius: '12px' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="form-control mb-4 custom-scrollbar"
              rows="5"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here or click the microphone to speak..."
              style={{ resize: 'none', fontSize: '1.1rem' }}
            />
          )}
          
          <div className="d-flex gap-3 align-items-center">
            {!isMCQ && (
              <button 
                className={`voice-button flex-grow-1 justify-content-center py-3 fs-5 ${isListening ? 'listening' : ''}`}
                onClick={toggleVoice}
              >
                {isListening ? (
                  <>
                    <StopCircle size={24} /> Stop Recording
                    <div className="voice-waves ms-2">
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                    </div>
                  </>
                ) : (
                  <><Mic size={24} /> Speak Answer</>
                )}
              </button>
            )}
            
            <button 
              className={`btn btn-primary d-flex align-items-center justify-content-center gap-2 py-3 fs-5 rounded-pill shadow ${isMCQ ? 'w-100' : 'px-5'}`} 
              onClick={submitAnswer} 
              disabled={loading || isListening}
            >
              {loading ? <RefreshCw className="spinner" size={20} /> : <Send size={20} />}
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Right panel – Live feedback / AI answer preview */}
      <div className="interview-panel feedback-panel">
        <h5 className="mb-4 d-flex align-items-center gap-2 pb-3 border-bottom border-secondary" style={{ color: '#818cf8' }}>
          <MessageSquare size={24} /> AI Assistant
        </h5>
        
        {feedback ? (
          <div className="live-feedback shadow-sm">
            {typedFeedback.split('\n').map((line, i) => (
              <p key={i} className="mb-2" style={{ minHeight: '1.5rem' }}>{line}</p>
            ))}
            {typedFeedback.length < feedback.length && <span className="cursor-blink">|</span>}
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50">
            <MessageSquare size={48} className="mb-3" />
            <p className="text-center">Your AI feedback will appear here after you submit your answer.</p>
            <p className="small text-center mt-3">💡 Tip: Speak clearly and naturally. The AI evaluates your relevance, clarity, and correctness.</p>
          </div>
        )}
        
        <style>{`
          .cursor-blink { animation: blink 1s step-end infinite; }
          @keyframes blink { 50% { opacity: 0; } }
          .spinner { animation: spin 2s linear infinite; }
        `}</style>
      </div>
    </div>
  )
}