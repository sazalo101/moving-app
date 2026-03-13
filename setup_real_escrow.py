#!/usr/bin/env python3
"""
Real Escrow System - Uses Actual Customer Transactions
Creates escrow records from real bookings and payments in the system
"""

from movers import app, db, User, Driver, Booking, Escrow, Payment, Transaction
from datetime import datetime, timezone

def setup_real_escrow_data():
    """Create escrow records from real transactions in the system"""
    with app.app_context():
        print("💰 REAL ESCROW SYSTEM - Using Actual Customer Transactions")
        print("=" * 70)
        
        # 1. Find all bookings that don't have escrow records
        print("\n🔍 Scanning for bookings without escrow records...")
        
        bookings_without_escrow = []
        all_bookings = Booking.query.all()
        
        for booking in all_bookings:
            existing_escrow = Escrow.query.filter_by(booking_id=booking.id).first()
            if not existing_escrow and booking.status in ['pending', 'accepted', 'in_progress', 'completed']:
                bookings_without_escrow.append(booking)
        
        print(f"Found: {len(bookings_without_escrow)} bookings without escrow records")
        print(f"Total bookings in system: {len(all_bookings)}")
        
        if len(bookings_without_escrow) == 0:
            print("\n✅ All bookings already have escrow records!")
            return
        
        # 2. Create escrow records from real bookings
        print(f"\n📝 Creating escrow records from real bookings...")
        
        created_count = 0
        total_escrow = 0
        
        for booking in bookings_without_escrow:
            # Skip invalid bookings
            if not booking.user_id or not booking.driver_id or not booking.price:
                continue
            
            # Calculate escrow amounts
            platform_fee_percentage = 10
            platform_fee = booking.price * (platform_fee_percentage / 100)
            driver_amount = booking.price - platform_fee
            
            # Create escrow record
            escrow = Escrow(
                booking_id=booking.id,
                user_id=booking.user_id,
                driver_id=booking.driver_id,
                amount=booking.price,
                platform_fee=platform_fee,
                driver_amount=driver_amount,
                status='held' if booking.status in ['pending', 'accepted', 'in_progress'] else 'released',
                created_at=booking.created_at if booking.created_at else datetime.now(timezone.utc),
                released_at=datetime.now(timezone.utc) if booking.status == 'completed' else None
            )
            
            db.session.add(escrow)
            db.session.flush()
            
            # Update driver earnings if order is completed
            if booking.status == 'completed':
                driver = Driver.query.get(booking.driver_id)
                if driver:
                    # Check if earnings already include this
                    existing_earnings_txn = Transaction.query.filter_by(
                        user_id=driver.user_id,
                        type='escrow_release',
                        merchant_request_id=f'ESCROW-{booking.id}'
                    ).first()
                    
                    if not existing_earnings_txn:
                        driver.earnings += driver_amount
                        driver.completed_orders += 1
                        
                        # Create transaction record
                        escrow_txn = Transaction(
                            user_id=driver.user_id,
                            transaction_id=f'ESCROW-{booking.id}',
                            amount=driver_amount,
                            type='escrow_release',
                            status='completed',
                            merchant_request_id=f'ESCROW-{booking.id}'
                        )
                        db.session.add(escrow_txn)
            
            created_count += 1
            total_escrow += driver_amount
            
            user = User.query.get(booking.user_id)
            driver = Driver.query.get(booking.driver_id)
            driver_user = User.query.get(driver.user_id) if driver else None
            
            print(f"\n  ✓ Escrow #{escrow.id} - Booking #{booking.id}")
            print(f"    Customer: {user.name if user else 'N/A'} ({user.email if user else 'N/A'})")
            print(f"    Driver: {driver_user.name if driver_user else 'N/A'}")
            print(f"    Route: {booking.pickup_location} → {booking.dropoff_location}")
            print(f"    Amount: KES {booking.price:.2f}")
            print(f"    Platform Fee (10%): KES {platform_fee:.2f}")
            print(f"    Driver Receives: KES {driver_amount:.2f}")
            print(f"    Status: {escrow.status.upper()}")
        
        db.session.commit()
        
        # 3. Display summary by driver
        print("\n" + "=" * 70)
        print("📊 ESCROW SUMMARY BY DRIVER")
        print("=" * 70)
        
        drivers = Driver.query.all()
        
        for driver in drivers:
            held_escrows = Escrow.query.filter_by(driver_id=driver.id, status='held').all()
            released_escrows = Escrow.query.filter_by(driver_id=driver.id, status='released').all()
            
            held_total = sum(e.driver_amount for e in held_escrows)
            released_total = sum(e.driver_amount for e in released_escrows)
            
            if held_escrows or released_escrows:
                driver_user = User.query.get(driver.user_id)
                print(f"\n👤 Driver: {driver_user.name}")
                print(f"   Email: {driver_user.email}")
                print(f"   Vehicle: {driver.vehicle_type} ({driver.license_plate})")
                print(f"   Verified: {'✓ Yes' if driver.is_verified else '✗ No'}")
                print(f"   Available Earnings: KES {driver.earnings:.2f}")
                print(f"   In Escrow (Held): KES {held_total:.2f} ({len(held_escrows)} order{'s' if len(held_escrows) != 1 else ''})")
                print(f"   Released (Completed): KES {released_total:.2f} ({len(released_escrows)} order{'s' if len(released_escrows) != 1 else ''})")
                print(f"   Total Potential: KES {(driver.earnings + held_total + released_total):.2f}")
        
        # 4. Display summary by customer
        print("\n" + "=" * 70)
        print("📊 ESCROW SUMMARY BY CUSTOMER")
        print("=" * 70)
        
        users = User.query.filter_by(role='user').all()
        
        for user in users:
            escrows = Escrow.query.filter_by(user_id=user.id).all()
            
            if escrows:
                held_total = sum(e.amount for e in escrows if e.status == 'held')
                released_total = sum(e.amount for e in escrows if e.status == 'released')
                
                print(f"\n👤 Customer: {user.name}")
                print(f"   Email: {user.email}")
                print(f"   Wallet Balance: KES {user.balance:.2f}")
                print(f"   Total In Escrow: KES {held_total:.2f} ({len([e for e in escrows if e.status == 'held'])} order{'s' if len([e for e in escrows if e.status == 'held']) != 1 else ''})")
                print(f"   Released Funds: KES {released_total:.2f}")
                print(f"   Total Transacted: KES {(held_total + released_total):.2f}")
        
        # 5. Final summary
        print("\n" + "=" * 70)
        print("✅ REAL ESCROW SYSTEM SETUP COMPLETE")
        print("=" * 70)
        
        total_in_escrow = sum(e.driver_amount for e in Escrow.query.filter_by(status='held').all())
        total_released = sum(e.driver_amount for e in Escrow.query.filter_by(status='released').all())
        total_escrows = Escrow.query.count()
        
        print(f"\n💰 System-Wide Escrow Status:")
        print(f"   Total Escrow Records: {total_escrows}")
        print(f"   Total In Escrow (Held): KES {total_in_escrow:.2f}")
        print(f"   Total Released: KES {total_released:.2f}")
        print(f"   Total Value: KES {(total_in_escrow + total_released):.2f}")
        
        print(f"\n📝 Created: {created_count} new escrow records")
        print(f"💵 Total Value Created: KES {total_escrow:.2f}")
        
        print("\n" + "=" * 70)
        print("🔗 NEXT STEPS:")
        print("=" * 70)
        print("\n1. Login as any driver with 'In Escrow' balance")
        print("2. Go to Driver Wallet")
        print("3. See real customer funds held for your pending orders")
        print("4. Complete orders to release funds to 'Available Now'")
        print("5. Withdraw to M-Pesa")
        print("\n" + "=" * 70)

if __name__ == '__main__':
    setup_real_escrow_data()
