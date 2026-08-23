# 🎤 VD MockBot – AI Mock Interview Platform

**VD MockBot** is a full‑stack web application that helps job seekers practice interviews with an AI interviewer.  
It generates realistic questions, evaluates your answers (with scores on relevance, clarity, correctness), and provides constructive feedback.  
Built with **Flask** (backend) and **React** (frontend), it supports **voice input**, **session tracking**, **leaderboard**, **admin dashboard**, and **PWA installation** (works like a native app).

![Demo](https://via.placeholder.com/800x400?text=VD+MockBot+Screenshot)  
*(Add your own screenshot later)*

---

## ✨ Features

- 🔐 **User authentication** – Register, login, JWT tokens, roles (user / admin)
- 🎤 **Voice input** – Speak your answers (Chrome/Edge)
- 🤖 **AI‑powered interviews** – Unlimited unique questions (via Ollama with `tinyllama` or `llama3.2`)
- 📊 **Performance tracking** – Dashboard with session history, progress, and average scores
- 🏆 **Leaderboard** – Compare your scores with other users
- 👑 **Admin panel** – View system stats and manage users
- 🔁 **Resume incomplete sessions** – Continue where you left off
- 📱 **PWA installable** – Add to home screen and use offline (cached static assets)
- 🎨 **Modern UI** – Green/white theme, glass‑morphic cards, responsive design

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Flask, Flask‑JWT‑Extended, SQLAlchemy |
| Database    | SQLite (development), PostgreSQL (production ready) |
| AI          | Ollama (local) – `tinyllama` / `llama3.2` |
| Frontend    | React, Vite, Bootstrap 5, Lucide Icons |
| Auth        | JWT (stored in localStorage)       |
| Voice       | Web Speech API (Chrome/Edge)        |
| PWA         | Vite PWA plugin                     |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Python 3.10+** and **Node.js 18+**
- **Ollama** installed ([ollama.com](https://ollama.com))  
  Pull the model: `ollama pull tinyllama`
- **Git** (optional)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Vikas-daddi/vd-mockbot.git
   cd vd-mockbot