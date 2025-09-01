import requests
import json

# Test the AI backend API
def test_summarization_api():
    url = "http://127.0.0.1:8000/summarize"
    
    # Sample news content for testing
    test_text = """
    Breaking news: A major technological breakthrough has been announced by researchers at leading universities. 
    The new innovation promises to revolutionize the way we interact with artificial intelligence systems. 
    Scientists have developed a method that significantly improves the accuracy and efficiency of machine learning models.
    The research team spent over three years developing this technology, which could have applications in various industries
    including healthcare, finance, and transportation. The breakthrough addresses several long-standing challenges in AI
    and opens up new possibilities for future developments.
    """
    
    payload = {
        "text": test_text,
        "min_length": 30,
        "max_length": 100
    }
    
    try:
        print("Testing AI summarization API...")
        print(f"Sending request to: {url}")
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API test successful!")
            print(f"Summary: {result['summary']}")
        else:
            print(f"❌ API test failed with status code: {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the FastAPI server is running")
        print("Run: uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check():
    url = "http://127.0.0.1:8000/health"
    
    try:
        print("Testing health check...")
        response = requests.get(url)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check successful!")
            print(f"Status: {result['status']}")
            print(f"Model ready: {result['model_ready']}")
        else:
            print(f"❌ Health check failed with status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    print("=== AI Backend API Test ===\n")
    test_health_check()
    print("\n" + "="*30 + "\n")
    test_summarization_api()