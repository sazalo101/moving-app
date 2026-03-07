#!/usr/bin/env python3
import requests
import json
import sys

def test_endpoint(name, url, method='GET', data=None):
    try:
        print(f"\n{'='*60}")
        print(f"Testing: {name}")
        print(f"URL: {url}")
        print(f"Method: {method}")
        
        if method == 'GET':
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Response:")
            print(json.dumps(data, indent=2)[:500])  # First 500 chars
        else:
            print(f"Error: {response.text[:200]}")
            
    except requests.exceptions.Timeout:
        print(f"ERROR: Request timed out after 5 seconds")
    except Exception as e:
        print(f"ERROR: {str(e)}")

# Test the three customer endpoints
print("Testing Customer Endpoints...")

test_endpoint(
    "Order History",
    "http://localhost:5000/api/user/order-history/14"
)

test_endpoint(
    "Payment History",
    "http://localhost:5000/api/user/payment-history/14"
)

test_endpoint(
    "Search Drivers",
    "http://localhost:5000/api/user/search-drivers",
    method='POST',
    data={
        'pickup_location': 'CBD',
        'dropoff_location': 'Westlands',
        'distance': 5.0
    }
)

print(f"\n{'='*60}")
print("Testing complete!")
