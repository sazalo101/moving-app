#!/usr/bin/env python3
"""Test the optimized payment flow speed"""
import requests
import json
import time

def test_payment_speed():
    """Simulate a payment and measure response time"""
    
    print("="*60)
    print("Testing Optimized Payment Flow")
    print("="*60)
    
    # Test data
    payload = {
        'user_id': 14,
        'driver_id': 1,
        'pickup_location': 'Westlands',
        'dropoff_location': 'CBD',
        'distance': 5.0,
        'price': 15.0,
        'phone_number': '0758670512',
        'promo_code': None
    }
    
    print(f"\n1. Initiating payment...")
    start_time = time.time()
    
    try:
        # Initiate payment
        response = requests.post(
            'http://localhost:5000/api/user/book-driver-mpesa',
            json=payload,
            timeout=10
        )
        
        init_time = time.time() - start_time
        print(f"   ✓ Payment initiated in {init_time:.2f}s")
        
        data = response.json()
        
        if not data.get('success'):
            print(f"   ✗ Error: {data.get('error')}")
            return
        
        transaction_id = data.get('transaction_id')
        is_simulated = data.get('simulated', False)
        
        print(f"   Transaction ID: {transaction_id}")
        print(f"   Simulated (sandbox): {is_simulated}")
        print(f"   Message: {data.get('message')}")
        
        # Check status immediately
        print(f"\n2. Checking payment status...")
        status_start = time.time()
        
        status_response = requests.get(
            f'http://localhost:5000/api/mpesa/check-status/{transaction_id}',
            timeout=5
        )
        
        status_time = time.time() - status_start
        status_data = status_response.json()
        
        print(f"   ✓ Status checked in {status_time:.2f}s")
        print(f"   Status: {status_data.get('status')}")
        
        total_time = time.time() - start_time
        
        print(f"\n" + "="*60)
        print(f"RESULTS:")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Payment initiation: {init_time:.2f}s")
        print(f"  Status check: {status_time:.2f}s")
        
        if is_simulated and status_data.get('status') == 'completed':
            print(f"\n  ✅ EXCELLENT! Payment completed in {total_time:.2f}s")
            print(f"  This is much faster than the previous 2-90 second wait!")
        else:
            print(f"\n  ⚠️  Payment status: {status_data.get('status')}")
        
        print("="*60)
        
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")

if __name__ == '__main__':
    test_payment_speed()
