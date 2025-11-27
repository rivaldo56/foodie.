import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env file
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Loaded API Key: '{api_key}'")

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment.")
    exit(1)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello, are you working?")
    print("Success! Response from Gemini:")
    print(response.text)
except Exception as e:
    print(f"Error calling Gemini API: {e}")
