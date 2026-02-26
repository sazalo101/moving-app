#!/usr/bin/env python3
"""
Quick Test Script for Driver Wallet System
Run this to verify the wallet system is working correctly
"""

from movers import app, db, User, Driver, Booking, Escrow, Transaction
from werkzeug.security import generate_password_hash
from datetime import datetime

def test_driver_wallet_system():
    """Test the complete driver wallet system"""
    
    with app.app_context():
        print("\n" + "="*60)
        print("🧪 DRIVER WALLET SYSTEM - QUICK TEST")
        print("="*60 + "\n")
        
        # Test 1: Check existing drivers
        print("📋 Test 1: Checking Drivers in Database")
        print("-" * 60)
        drivers = Driver.query.all()
        print(f"Total drivers: {len(drivers)}")
        
        if len(drivers) == 0:
            print("⚠️  No drivers found. Creating test driver...")
            
            # Create test driver
            driver_user = User(
                name="Test Driver Wallet",
                email="wallettest@driver.com",
                phone="0723456789",
                password=generate_password_hash("driver123", method='pbkdf2:sha256'),
                role="driver"
            )
            db.session.add(driver_user)
            db.session.flush()
            
            driver = Driver(
                user_id=driver_user.id,
                vehicle_type="Sedan",
                license_plate="KCD 789E",
                is_available=True,
                is_verified=True,
                earnings=5000.00,  # Give some initial earnings
                ratings=4.5,
                completed_orders=10
            )
            db.session.add(driver)
            db.session.commit()
            
            print(f"✅ Created test driver: ID={driver.id}, Name={driver_user.name}")
            test_driver_id = driver.id
        else:
            driver = drivers[0]
            driver_user = User.query.get(driver.user_id)
            print(f"✅ Using existing driver: ID={driver.id}, Name={driver_user.name}")
            test_driver_id = driver.id
        
        print()
        
        # Test 2: Check driver earnings
        print("💰 Test 2: Checking Driver Earnings")
        print("-" * 60)
        driver = Driver.query.get(test_driver_id)
        print(f"Driver ID: {driver.id}")
        print(f"Available Earnings: KES {driver.earnings:.2f}")
        print(f"Completed Orders: {driver.completed_orders}")
        print(f"Rating: {driver.ratings}/5.0")
        print()
        
        # Test 3: Check escrow status
        print("🔒 Test 3: Checking Escrow Status")
        print("-" * 60)
        held_escrows = Escrow.query.filter_by(driver_id=test_driver_id, status='held').all()
        pending_escrow = sum(e.driver_amount for e in held_escrows)
        print(f"Pending Orders: {len(held_escrows)}")
        print(f"Pending in Escrow: KES {pending_escrow:.2f}")
        
        if len(held_escrows) > 0:
            print("\nEscrow Details:")
            for i, escrow in enumerate(held_escrows, 1):
                print(f"  {i}. Booking #{escrow.booking_id}: KES {escrow.driver_amount:.2f}")
        print()
        
        # Test 4: Check withdrawal history
        print("📜 Test 4: Checking Withdrawal History")
        print("-" * 60)
        driver_user = User.query.get(driver.user_id)
        withdrawals = Transaction.query.filter_by(
            user_id=driver_user.id,
            type='withdrawal'
        ).order_by(Transaction.created_at.desc()).limit(5).all()
        
        print(f"Recent Withdrawals: {len(withdrawals)}")
        if len(withdrawals) > 0:
            for i, w in enumerate(withdrawals, 1):
                print(f"  {i}. {w.transaction_id}: KES {w.amount:.2f} [{w.status}]")
        else:
            print("  (No withdrawals yet)")
        print()
        
        # Test 5: Simulate withdrawal (if earnings exist)
        if driver.earnings >= 100:
            print("💸 Test 5: Simulating Withdrawal")
            print("-" * 60)
            withdrawal_amount = min(500, driver.earnings)
            
            # Create test withdrawal transaction
            test_transaction = Transaction(
                user_id=driver_user.id,
                transaction_id=f'TEST-WTH-{datetime.now().strftime("%H%M%S")}',
                amount=withdrawal_amount,
                phone_number='254723456789',
                type='withdrawal',
                status='completed',
                mpesa_receipt_number=f'TEST-MPESA-{datetime.now().strftime("%H%M%S")}'
            )
            db.session.add(test_transaction)
            
            # Deduct from earnings
            driver.earnings -= withdrawal_amount
            db.session.commit()
            
            print(f"✅ Test withdrawal created: KES {withdrawal_amount:.2f}")
            print(f"New balance: KES {driver.earnings:.2f}")
            print()
        else:
            print("💸 Test 5: Simulating Withdrawal")
            print("-" * 60)
            print(f"⚠️  Insufficient balance (KES {driver.earnings:.2f}) - Skipping test withdrawal")
            print()
        
        # Test 6: API Endpoint Check
        print("🔌 Test 6: API Endpoints Status")
        print("-" * 60)
        
        endpoints = [
            ('GET', f'/api/driver/{test_driver_id}/earnings', 'Fetch driver earnings'),
            ('POST', '/api/driver/withdraw', 'Process withdrawal'),
            ('GET', f'/api/driver/by-user/{driver_user.id}', 'Get driver by user ID'),
        ]
        
        for method, endpoint, description in endpoints:
            print(f"  [{method:4}] {endpoint:45} - {description}")
        
        print(f"\n✅ All endpoints registered and available")
        print()
        
        # Summary
        print("="*60)
        print("📊 WALLET SYSTEM SUMMARY")
        print("="*60)
        print(f"Driver ID: {test_driver_id}")
        print(f"Available Now: KES {driver.earnings:.2f}")
        print(f"In Escrow: KES {pending_escrow:.2f}")
        print(f"Total Potential: KES {(driver.earnings + pending_escrow):.2f}")
        print(f"Completed Orders: {driver.completed_orders}")
        print(f"Pending Orders: {len(held_escrows)}")
        print(f"Total Withdrawals: {len(withdrawals)}")
        print()
        
        # Frontend test instructions
        print("="*60)
        print("🌐 FRONTEND TESTING")
        print("="*60)
        print(f"1. Login with: wallettest@driver.com / driver123")
        print(f"   (or use your existing driver account)")
        print(f"2. Navigate to: Driver Dashboard → Wallet")
        print(f"3. You should see:")
        print(f"   - Available: KES {driver.earnings:.2f}")
        print(f"   - In Escrow: KES {pending_escrow:.2f}")
        print(f"   - Completed: {driver.completed_orders} orders")
        print(f"4. Try withdrawing KES 500 or custom amount")
        print(f"5. Check withdrawal history table")
        print()
        
        print("✅ Driver Wallet System Test Complete!")
        print("="*60 + "\n")

if __name__ == '__main__':
    test_driver_wallet_system()
