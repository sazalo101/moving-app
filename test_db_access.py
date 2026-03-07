#!/usr/bin/env python3
from movers import app, db, User, Booking, Transaction, Driver

with app.app_context():
    print("Testing database access...")
    
    # Test User query
    try:
        user = db.session.get(User, 14)
        if user:
            print(f"✓ User 14 found: {user.name}")
        else:
            print("✗ User 14 not found")
    except Exception as e:
        print(f"✗ User query failed: {e}")
    
    # Test Booking query
    try:
        bookings = Booking.query.filter_by(user_id=14).limit(5).all()
        print(f"✓ Found {len(bookings)} bookings for user 14")
    except Exception as e:
        print(f"✗ Booking query failed: {e}")
    
    # Test Transaction query  
    try:
        transactions = Transaction.query.filter_by(user_id=14).limit(5).all()
        print(f"✓ Found {len(transactions)} transactions for user 14")
    except Exception as e:
        print(f"✗ Transaction query failed: {e}")
    
    # Test Driver query
    try:
        drivers = Driver.query.filter_by(is_available=True, is_verified=True).limit(5).all()
        print(f"✓ Found {len(drivers)} available verified drivers")
    except Exception as e:
        print(f"✗ Driver query failed: {e}")
    
    print("\nDatabase access test complete!")
