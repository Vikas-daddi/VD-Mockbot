import ollama
import json

prompt = (
    "Evaluate this multiple-choice answer. "
    "Q: What is a core concept of Python Developer? "
    "Selected Option: A) Inheritance "
    "Output ONLY valid JSON with exactly four keys: "
    "'feedback' (string explaining if the option is correct and why), "
    "'relevance_score' (integer 1-5), "
    "'clarity_score' (integer 1-5), "
    "'correctness_score' (integer 1-5)."
)

try:
    response = ollama.chat(model='tinyllama', messages=[{'role': 'user', 'content': prompt}], format='json')
    result = json.loads(response['message']['content'])
    print("Feedback:", result.get('feedback'))
    print(f"Relevance: {result.get('relevance_score')}/5")
    print(f"Clarity: {result.get('clarity_score')}/5")
    print(f"Correctness: {result.get('correctness_score')}/5")
except Exception as e:
    print("Error:", e)
