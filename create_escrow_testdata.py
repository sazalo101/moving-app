#!/usr/bin/env python3
"""
Setup Escrow Test Data
Creates test orders with funds in escrow for driver testing
"""

from movers import app, db, User, Driver, Booking, Escrow, Payment, Transaction
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone

def create_escrow_test_data():
    """Create test data with escrow funds"""
    with app.app_context():
        print("🔐 Setting up Escrow Test Data")
        print("=" * 60)
        
        # 1. Create test customer user
        print("📝 Creating test customer...")
        customer_email = "escrow_customer@test.com"
        existing_customer = User.query.filter_by(email=customer_email).first()
        
        if existing_customer:
            customer = existing_customer
            print(f"  Using existing customer: {customer.email}")
        else:
            customer = User(
                name="Test Customer",
                email=customer_email,
                phone="+254700000001",
                password=generate_password_hash("customer123"),
                role="user",
                balance=5000.00  # Start with KES 5000
            )
            db.session.add(customer)
            db.session.commit()
            print(f"  ✓ Created customer: {customer.email}")
        
        # 2. Create test driver user
        print("\n🚗 Creating test driver...")
        driver_email = "escrow_driver@test.com"
        existing_driver_user = User.query.filter_by(email=driver_email).first()
        
        if existing_driver_user:
            driver_user = existing_driver_user
            print(f"  Using existing driver user: {driver_user.email}")
        else:
            driver_user = User(
                name="Test Driver",
                email=driver_email,
                phone="+254700000002",
                password=generate_password_hash("driver123"),
                role="driver",
                balance=0
            )
            db.session.add(driver_user)
            db.session.commit()
            print(f"  ✓ Created driver user: {driver_user.email}")
        
        # 3. Create driver profile if not exists
        test_driver = Driver.query.filter_by(user_id=driver_user.id).first()
        if not test_driver:
            test_driver = Driver(
                user_id=driver_user.id,
                vehicle_type="Toyota Hiace",
                license_plate="KLP 123E",
                is_verified=True,
                earnings=0,
                completed_orders=0,
                ratings=4.8
            )
            db.session.add(test_driver)
            db.session.commit()
            print(f"  ✓ Created driver profile: {test_driver.vehicle_type}")
        else:
            print(f"  Using existing driver: {test_driver.vehicle_type}")
        
        # 4. Create test bookings with escrow in held status
        print("\n📦 Creating test bookings with escrow...")
        
        test_bookings = [
            {
                'user_id': customer.id,
                'driver_id': test_driver.id,
                'pickup_location': 'Nairobi Central Business District',
                'dropoff_location': 'Westlands, Nairobi',
                'distance': 8.5,
                'price': 1200.00,
                'status': 'accepted'  # Driver accepted but not completed
            },
            {
                'user_id': customer.id,
                'driver_id': test_driver.id,
                'pickup_location': 'Karen, Nairobi',
                'dropoff_location': 'South C, Nairobi',
                'distance': 12.0,
                'price': 1500.00,
                'status': 'accepted'
            },
            {
                'user_id': customer.id,
                'driver_id': test_driver.id,
                'pickup_location': 'Thika Road',
                'dropoff_location': 'Eastleigh, Nairobi',
                'distance': 15.0,
                'price': 1800.00,
                'status': 'in_progress'  # Driver actively working
            }
        ]
        
        created_count = 0
        total_escrow = 0
        
        for booking_data in test_bookings:
            # Check if booking already exists
            existing = Booking.query.filter_by(
                user_id=booking_data['user_id'],
                driver_id=booking_data['driver_id'],
                pickup_location=booking_data['pickup_location'],
                dropoff_location=booking_data['dropoff_location'],
                price=booking_data['price']
            ).first()
            
            if not existing:
                booking = Booking(
                    user_id=booking_data['user_id'],
                    driver_id=booking_data['driver_id'],
                    pickup_location=booking_data['pickup_location'],
                    dropoff_location=booking_data['dropoff_location'],
                    distance=booking_data['distance'],
                    price=booking_data['price'],
                    status=booking_data['status']
                )
                db.session.add(booking)
                db.session.flush()
                
                # Create escrow record
                platform_fee = booking_data['price'] * 0.10
                driver_amount = booking_data['price'] - platform_fee
                
                escrow = Escrow(
                    booking_id=booking.id,
                    user_id=booking_data['user_id'],
                    driver_id=booking_data['driver_id'],
                    amount=booking_data['price'],
                    platform_fee=platform_fee,
                    driver_amount=driver_amount,
                    status='held'  # Money held in escrow
                )
                db.session.add(escrow)
                
                db.session.commit()
                created_count += 1
                total_escrow += driver_amount
                
                print(f"  ✓ Booking #{booking.id}: {booking_data['pickup_location']}")
                print(f"    → Price: KES {booking_data['price']:.2f}")
                print(f"    → Driver gets: KES {driver_amount:.2f}")
                print(f"    → Status: {booking_data['status']}")
            else:
                print(f"  ℹ Booking already exists: {booking_data['pickup_location']}")
                escrow = Escrow.query.filter_by(
                    user_id=booking_data['user_id'],
                    driver_id=booking_data['driver_id'],
                    amount=booking_data['price']
                ).first()
                if escrow:
                    total_escrow += escrow.driver_amount
        
        # 5. Display summary
        print("\n" + "=" * 60)
        print("✅ ESCROW TEST DATA SETUP COMPLETE")
        print("=" * 60)
        
        # Get current escrow status
        driver_escrows = Escrow.query.filter_by(driver_id=test_driver.id, status='held').all()
        held_amount = sum(e.driver_amount for e in driver_escrows)
        
        print(f"\n👤 Customer Account:")
        print(f"   Email: {customer.email}")
        print(f"   Password: customer123")
        print(f"   Remaining Balance: KES {customer.balance:.2f}")
        
        print(f"\n🚗 Driver Account:")
        print(f"   Email: {driver_email}")
        print(f"   Password: driver123")
        print(f"   Vehicle: {test_driver.vehicle_type} ({test_driver.license_plate})")
        print(f"   Verified: {'✓ Yes' if test_driver.is_verified else '✗ No'}")
        print(f"   Current Earnings: KES {test_driver.earnings:.2f}")
        print(f"   In Escrow (Held): KES {held_amount:.2f}")
        print(f"   Total Potential: KES {(test_driver.earnings + held_amount):.2f}")
        print(f"   Completed Orders: {test_driver.completed_orders}")
        print(f"   Rating: {test_driver.ratings}/5.0")
        
        print(f"\n💰 Escrow Status:")
        print(f"   Pending Orders: {len(driver_escrows)}")
        print(f"   Total Held: KES {held_amount:.2f}")
        
        if driver_escrows:
            print(f"\n📋 Pending Orders:")
            for i, escrow in enumerate(driver_escrows, 1):
                booking = Booking.query.get(escrow.booking_id)
                print(f"   {i}. Booking #{booking.id}")
                print(f"      From: {booking.pickup_location}")
                print(f"      To: {booking.dropoff_location}")
                print(f"      Pending Release: KES {escrow.driver_amount:.2f}")
        
        print("\n" + "=" * 60)
        print("🔗 NEXT STEPS:")
        print("=" * 60)
        print("1. Login as Driver:")
        print(f"   Email: {driver_email}")
        print(f"   Password: driver123")
        print("\n2. Go to Driver Wallet")
        print("   You should see:")
        print(f"   - In Escrow: KES {held_amount:.2f}")
        print(f"   - [number] pending orders")
        print("\n3. Complete an order:")
        print("   - Go to Available Orders")
        print("   - Accept order (if not already accepted)")
        print("   - Click 'Mark as Completed'")
        print("   - Funds automatically release to 'Available Now'")
        print("\n4. Withdraw funds:")
        print("   - Use Quick Withdraw or custom amount")
        print("   - Funds sent to M-Pesa")
        print("=" * 60)

if __name__ == '__main__':
    create_escrow_test_data()
