"""
Quick test script to verify Gemini API is working
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test Gemini API
import google.generativeai as genai

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in .env file")
    sys.exit(1)

print(f"✓ API Key found: {api_key[:20]}...")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    print("\n🔄 Testing Gemini API with a simple prompt...")
    response = model.generate_content("Say hello in one word")
    
    print(f"✅ SUCCESS! Gemini responded: {response.text}")
    print("\n✓ Your Gemini API key is working correctly!")
    
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    print("\nThis could mean:")
    print("1. Your API key is invalid")
    print("2. You don't have access to gemini-2.0-flash-exp model")
    print("3. Network connectivity issue")
    sys.exit(1)
