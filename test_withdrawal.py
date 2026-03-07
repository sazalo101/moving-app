#!/usr/bin/env python3
"""Test driver withdrawal functionality"""
import requests
import json
from movers import app, db, Driver, User

def test_withdrawal():
    print("="*60)
    print("Testing Driver Withdrawal")
    print("="*60)
    
    # First, check driver earnings in the database
    with app.app_context():
        driver = db.session.get(Driver, 3)  # Driver ID 3
        if driver:
            print(f"\nDriver ID 3 Status:")
            print(f"  Current Earnings: KES {driver.earnings}")
            print(f"  User ID: {driver.user_id}")
            user = db.session.get(User, driver.user_id)
            print(f"  User Name: {user.name if user else 'N/A'}")
            print(f"  Phone: {user.phone if user else 'N/A'}")
            
            # Add some test earnings if needed
            if driver.earnings < 20:
                print(f"\n⚠️  Insufficient earnings for withdrawal test")
                print(f"  Adding KES 100 for testing...")
                driver.earnings += 100
                db.session.commit()
                print(f"  New balance: KES {driver.earnings}")
        else:
            print("✗ Driver ID 3 not found")
            return
    
    # Test withdrawal
    print(f"\n2. Testing withdrawal of KES 20...")
    
    payload = {
        'driver_id': 3,
        'amount': 20,
        'phone_number': '0758670512'
    }
    
    try:
        response = requests.post(
            'http://localhost:5000/api/driver/withdraw',
            json=payload,
            timeout=15
        )
        
        print(f"\n   Status Code: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            print(f"   ✅ SUCCESS!")
            print(f"   Message: {data.get('message')}")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Remaining Earnings: KES {data.get('remaining_earnings')}")
            print(f"   Simulated: {data.get('simulated', False)}")
        else:
            print(f"   ✗ Failed: {data.get('error')}")
            
        print(f"\n   Full Response:")
        print(f"   {json.dumps(data, indent=4)}")
        
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    print("="*60)

if __name__ == '__main__':
    test_withdrawal()
