const API_BASE_URL = 'http://127.0.0.1:5000';

let currentQuestion = '';
let currentDifficulty = 'Medium';
let currentRole = '';
let currentCategory = '';
let timerInterval = null;
let timerActive = false;
let timerSeconds = 60;

let recognition = null;
let isListening = false;

// DOM elements
const loadQuestionBtn = document.getElementById('loadQuestion');
const questionCard = document.getElementById('questionCard');
const answerCard = document.getElementById('answerCard');
const feedbackCard = document.getElementById('feedbackCard');
const questionBox = document.getElementById('questionBox');
const answerTextarea = document.getElementById('answer');
const submitAnswerBtn = document.getElementById('submitAnswer');
const feedbackDiv = document.getElementById('feedback');
const nextQuestionBtn = document.getElementById('nextQuestion');
const roleInput = document.getElementById('role');
const difficultySelect = document.getElementById('difficulty');
const categorySelect = document.getElementById('category');
const timerSecondsInput = document.getElementById('timerSeconds');
const toggleTimerBtn = document.getElementById('toggleTimerBtn');
const timerDisplay = document.getElementById('timerDisplay');
const voiceBtn = document.getElementById('voiceBtn');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const showHistoryBtn = document.getElementById('showHistoryBtn');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyListDiv = document.getElementById('historyList');

let scoreChart = null;

// ---------- Speech Recognition Setup ----------
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
        isListening = true;
        voiceBtn.textContent = '🔴 Listening...';
        answerTextarea.placeholder = 'Speak now...';
    };
    recognition.onend = () => {
        isListening = false;
        voiceBtn.textContent = '🎤 Speak Answer';
        answerTextarea.placeholder = 'Type or speak your answer...';
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        answerTextarea.value = transcript;
    };
    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        alert('Speech recognition error. Please type your answer.');
        voiceBtn.textContent = '🎤 Speak Answer';
        isListening = false;
    };
    voiceBtn.addEventListener('click', () => {
        if (!recognition) return;
        if (isListening) recognition.stop();
        else recognition.start();
    });
} else {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Not supported';
}

// ---------- Timer Functions ----------
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerActive = true;
    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerActive = false;
            timerDisplay.textContent = 'Time is up! Please submit your answer.';
            alert('Time is up! Submit your answer now.');
        } else {
            timerSeconds--;
            timerDisplay.textContent = `⏱️ Time remaining: ${timerSeconds}s`;
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerActive = false;
    timerDisplay.textContent = '';
}

toggleTimerBtn.addEventListener('click', () => {
    if (timerActive) {
        stopTimer();
        toggleTimerBtn.textContent = 'Enable Timer';
        timerDisplay.textContent = '';
    } else {
        timerSeconds = parseInt(timerSecondsInput.value) || 60;
        startTimer();
        toggleTimerBtn.textContent = 'Disable Timer';
    }
});

// ---------- Save to Local Storage ----------
function saveToHistory(role, difficulty, category, question, answer, feedback) {
    // Extract scores from feedback (simple regex)
    const scores = { relevance: 0, clarity: 0, correctness: 0 };
    const relevanceMatch = feedback.match(/Relevance\s*(\d+)\/5/i);
    const clarityMatch = feedback.match(/Clarity\s*(\d+)\/5/i);
    const correctnessMatch = feedback.match(/Correctness\s*(\d+)\/5/i);
    if (relevanceMatch) scores.relevance = parseInt(relevanceMatch[1]);
    if (clarityMatch) scores.clarity = parseInt(clarityMatch[1]);
    if (correctnessMatch) scores.correctness = parseInt(correctnessMatch[1]);
    
    const session = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        role,
        difficulty,
        category,
        question,
        answer,
        feedback,
        scores
    };
    let history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
    history.unshift(session); // newest first
    localStorage.setItem('interviewHistory', JSON.stringify(history));
    updateDashboard();
    alert('Session saved!');
}

function updateDashboard() {
    const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
    if (history.length === 0) {
        if (scoreChart) scoreChart.destroy();
        historyListDiv.innerHTML = '<p>No sessions yet. Complete an interview to see stats.</p>';
        return;
    }
    
    // Calculate average scores
    let totalRelevance = 0, totalClarity = 0, totalCorrectness = 0;
    history.forEach(s => {
        totalRelevance += s.scores.relevance;
        totalClarity += s.scores.clarity;
        totalCorrectness += s.scores.correctness;
    });
    const avgRelevance = totalRelevance / history.length;
    const avgClarity = totalClarity / history.length;
    const avgCorrectness = totalCorrectness / history.length;
    
    // Render chart
    const ctx = document.getElementById('scoreChart').getContext('2d');
    if (scoreChart) scoreChart.destroy();
    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Relevance', 'Clarity', 'Correctness'],
            datasets: [{
                label: 'Average Score (out of 5)',
                data: [avgRelevance, avgClarity, avgCorrectness],
                backgroundColor: ['#667eea', '#764ba2', '#11998e']
            }]
        },
        options: {
            scales: { y: { max: 5, beginAtZero: true } }
        }
    });
    
    // Show recent history items
    historyListDiv.innerHTML = '<strong>Recent Sessions:</strong><br>';
    history.slice(0, 10).forEach(s => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<strong>${s.date}</strong> — ${s.role} (${s.difficulty})<br>
                         Scores: R${s.scores.relevance} C${s.scores.clarity} Co${s.scores.correctness}<br>
                         <em>${s.question.substring(0, 80)}...</em>`;
        div.onclick = () => {
            alert(`Full answer:\n${s.answer}\n\nFeedback:\n${s.feedback}`);
        };
        historyListDiv.appendChild(div);
    });
}

function exportHistory() {
    const history = localStorage.getItem('interviewHistory');
    if (!history || history === '[]') {
        alert('No history to export.');
        return;
    }
    const blob = new Blob([history], {type: 'text/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview_history_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    alert('History exported as JSON file.');
}

function clearHistory() {
    if (confirm('Delete all interview history? This cannot be undone.')) {
        localStorage.removeItem('interviewHistory');
        updateDashboard();
        alert('History cleared.');
    }
}

showHistoryBtn.addEventListener('click', () => updateDashboard());
exportHistoryBtn.addEventListener('click', exportHistory);
clearHistoryBtn.addEventListener('click', clearHistory);

// ---------- Load Question ----------
loadQuestionBtn.addEventListener('click', async () => {
    const role = roleInput.value.trim();
    const difficulty = difficultySelect.value;
    const category = categorySelect.value;
    if (!role) {
        alert('Please enter a job role');
        return;
    }
    currentRole = role;
    currentDifficulty = difficulty;
    currentCategory = category;
    
    loadQuestionBtn.disabled = true;
    loadQuestionBtn.textContent = 'Loading...';
    if (timerActive) stopTimer();
    try {
        const url = `${API_BASE_URL}/question?role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}&category=${encodeURIComponent(category)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.question) {
            currentQuestion = data.question;
            questionBox.textContent = currentQuestion;
            questionCard.style.display = 'block';
            answerCard.style.display = 'block';
            feedbackCard.style.display = 'none';
            answerTextarea.value = '';
            feedbackDiv.innerHTML = '';
            // Reset timer if enabled
            if (toggleTimerBtn.textContent === 'Disable Timer') {
                timerSeconds = parseInt(timerSecondsInput.value) || 60;
                startTimer();
            }
        } else {
            alert('Failed to get question.');
        }
    } catch (error) {
        console.error(error);
        alert('Backend error. Make sure backend is running on port 5000.');
    } finally {
        loadQuestionBtn.disabled = false;
        loadQuestionBtn.textContent = '🔍 Get Interview Question';
    }
});

// ---------- Submit Answer ----------
submitAnswerBtn.addEventListener('click', async () => {
    const answer = answerTextarea.value.trim();
    if (!answer) {
        alert('Please provide an answer.');
        return;
    }
    if (timerActive) stopTimer();
    submitAnswerBtn.disabled = true;
    submitAnswerBtn.textContent = 'Evaluating...';
    try {
        const response = await fetch(`${API_BASE_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: currentQuestion,
                answer: answer,
                difficulty: currentDifficulty
            })
        });
        const data = await response.json();
        if (data.feedback) {
            feedbackDiv.innerHTML = data.feedback.replace(/\n/g, '<br>');
            feedbackCard.style.display = 'block';
            answerCard.style.display = 'none';
        } else {
            alert('Error: ' + (data.error || 'Unknown'));
        }
    } catch (error) {
        console.error(error);
        alert('Failed to get feedback.');
    } finally {
        submitAnswerBtn.disabled = false;
        submitAnswerBtn.textContent = '📨 Submit & Get Feedback';
    }
});

// ---------- Save Session ----------
saveSessionBtn.addEventListener('click', () => {
    if (!currentQuestion || !answerTextarea.value.trim() || !feedbackDiv.innerText) {
        alert('Complete an interview first (question → answer → feedback) before saving.');
        return;
    }
    saveToHistory(currentRole, currentDifficulty, currentCategory, currentQuestion, answerTextarea.value, feedbackDiv.innerText);
});

// ---------- Next Question ----------
nextQuestionBtn.addEventListener('click', () => {
    loadQuestionBtn.click();
});

// Initial dashboard load
updateDashboard();