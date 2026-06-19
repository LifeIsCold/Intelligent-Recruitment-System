import requests

def test_endpoint_raw(url):
    try:
        response = requests.get(url, timeout=5)
        print(f"URL: {url}")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Raw content: {response.text[:200]}")  # Show first 200 chars
        print("-" * 50)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

print("Testing CV Scoring Service (RAW OUTPUT)...")
print("="*60)

test_endpoint_raw("http://localhost:8000/")
test_endpoint_raw("http://localhost:8000/health")
test_endpoint_raw("http://127.0.0.1:8000/health")

print("="*60)