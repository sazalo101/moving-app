"""
Test script for M-Pesa payment processing
"""
import requests
import json

def test_payment_endpoint():
    """Test the book-driver-mpesa endpoint"""
    url = "http://127.0.0.1:5000/api/user/book-driver-mpesa"
    
    payload = {
        "user_id": 1,
        "driver_id": 1,
        "pickup_location": "Nairobi CBD",
        "dropoff_location": "Westlands",
        "distance": 5.5,
        "price": 500,
        "phone_number": "0712345678"
    }
    
    print("=" * 60)
    print("TESTING M-PESA PAYMENT ENDPOINT")
    print("=" * 60)
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\nSending request...\n")
    
    try:
        response = requests.post(
            url,
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.ok:
            print("\n✅ Request successful!")
        else:
            print(f"\n❌ Request failed with status {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("=" * 60)

if __name__ == '__main__':
    test_payment_endpoint()
