#!/usr/bin/env python3
"""
Fix missing escrow records for completed transactions
"""
from movers import app, db, Escrow, Booking, Transaction, User, Driver, Notification

def fix_escrow_records():
    """Create escrow records for completed transactions that don't have them"""
    with app.app_context():
        print("🔍 Scanning for completed transactions without escrow records...\n")
        
        # Find all completed booking payment transactions
        completed_transactions = Transaction.query.filter_by(
            type='booking_payment',
            status='completed'
        ).all()
        
        fixed_count = 0
        
        for transaction in completed_transactions:
            if not transaction.booking_id:
                print(f"  ⚠️  Transaction {transaction.transaction_id} has no booking_id - skipping")
                continue
            
            booking = Booking.query.get(transaction.booking_id)
            if not booking:
                print(f"  ⚠️  Booking {transaction.booking_id} not found - skipping")
                continue
            
            # Check if escrow already exists
            existing_escrow = Escrow.query.filter_by(booking_id=booking.id).first()
            if existing_escrow:
                print(f"  ✓ Booking {booking.id} already has escrow record")
                continue
            
            print(f"\n  🔧 Fixing Booking {booking.id}:")
            print(f"     Transaction Amount: KES {transaction.amount}")
            print(f"     Current Status: {booking.status}")
            
            # Update booking status
            if booking.status == 'pending_payment':
                booking.status = 'pending'
                print(f"     Updated status: pending_payment → pending")
            
            # Calculate platform fee (10%)
            platform_fee_percentage = 10
            platform_fee = transaction.amount * (platform_fee_percentage / 100)
            driver_amount = transaction.amount - platform_fee
            
            # Create escrow record
            escrow = Escrow(
                booking_id=booking.id,
                user_id=booking.user_id,
                driver_id=booking.driver_id,
                amount=transaction.amount,
                platform_fee=platform_fee,
                driver_amount=driver_amount,
                status='held'
            )
            db.session.add(escrow)
            
            print(f"     Created escrow:")
            print(f"       - Total: KES {transaction.amount}")
            print(f"       - Platform Fee (10%): KES {platform_fee}")
            print(f"       - Driver Amount: KES {driver_amount}")
            print(f"       - Status: held")
            
            # Notify driver if not already notified
            user = User.query.get(booking.user_id)
            if user:
                notification = Notification(
                    driver_id=booking.driver_id,
                    message=f'New booking request from {user.name}. Amount: KES {transaction.amount:.2f} (KES {driver_amount:.2f} for you after fees)'
                )
                db.session.add(notification)
                print(f"     Created notification for driver")
            
            fixed_count += 1
        
        if fixed_count > 0:
            db.session.commit()
            print(f"\n✅ Successfully fixed {fixed_count} booking(s) and created escrow records!")
        else:
            print("\n✅ All bookings already have escrow records or no completed transactions found.")
        
        # Show final statistics
        print("\n=== Final Statistics ===")
        print(f"Total Escrow Records: {Escrow.query.count()}")
        print(f"Held: {Escrow.query.filter_by(status='held').count()}")
        print(f"Released: {Escrow.query.filter_by(status='released').count()}")
        print(f"Refunded: {Escrow.query.filter_by(status='refunded').count()}")

if __name__ == '__main__':
    print("🔧 Starting Escrow Fix Script...\n")
    fix_escrow_records()
    print("\n✨ Done!")
