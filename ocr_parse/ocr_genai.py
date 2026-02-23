import google.generativeai as genai
import json
import re

GOOGLE_API_KEY = "YOUR_API_KEY"
genai.configure(api_key=GOOGLE_API_KEY)

MODEL_CONFIG = {
    "temperature": 0.2,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=MODEL_CONFIG,
)

def gemini_json_output(user_prompt):
    response = model.generate_content(user_prompt)
    text = response.text.strip()

    # 🔥 Remove markdown code blocks if present
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)

    try:
        return json.loads(text)
    except:
        raise ValueError("Invalid JSON returned from Gemini")