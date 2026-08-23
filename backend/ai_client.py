import os
from groq import Groq

# Initialize Groq client
client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

def generate_question(role, difficulty, category):
    """Generate an interview question using Groq (free, fast)."""
    diff_prompt = {
        "Easy": "basic",
        "Medium": "standard",
        "Hard": "challenging"
    }.get(difficulty, "standard")
    cat_part = f" Focus on {category}." if category != "General" else ""
    prompt = f"You are a technical interviewer. Ask a {diff_prompt} interview question for {role}.{cat_part} Keep under 30 words. Return only the question."
    
    completion = client.chat.completions.create(
        model="llama3-70b-8192",  # free, fast, and good
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    return completion.choices[0].message.content.strip()

def evaluate_answer(question, answer, difficulty):
    """Evaluate candidate's answer using Groq."""
    prompt = f"Evaluate this {difficulty} answer.\nQ: {question}\nA: {answer}\nGive scores: Relevance/5, Clarity/5, Correctness/5 and 2-3 sentences of feedback."
    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    return completion.choices[0].message.content.strip()