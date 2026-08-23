import ollama, json

prompt = (
    "You are a technical interviewer. Ask a standard multiple-choice interview question for a Python Developer. "
    "Output ONLY a raw JSON object with exactly three keys: 'question' (string containing the actual question text), "
    "'options' (an array of exactly 4 strings for the possible choices, e.g. 'A) ...', 'B) ...'), "
    "and 'recommendation' (a string containing a brief hint on how to approach the answer)."
)

try:
    response = ollama.chat(model='tinyllama', messages=[{'role': 'user', 'content': prompt}], format='json')
    content = response['message']['content']
    print(content)
    result = json.loads(content)
    print("Keys:", result.keys())
except Exception as e:
    print("Error:", e)
