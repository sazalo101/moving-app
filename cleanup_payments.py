#!/usr/bin/env python3
"""
Cleanup script to remove unrealistic payment records from the database
"""
from movers import app, db, Transaction, Booking, Escrow, Payment, Notification

# M-Pesa receipt numbers to remove
RECEIPTS_TO_REMOVE = [
    'SIM572F674B24',  # 1700 KES - unrealistic
    'SIMBD3A308DE5',  # 1000 KES - unrealistic
]

def cleanup_unrealistic_payments():
    """Remove transactions and related records for unrealistic test payments"""
    with app.app_context():
        removed_count = 0
        
        for receipt in RECEIPTS_TO_REMOVE:
            print(f"\n🔍 Looking for receipt: {receipt}")
            
            # Find transaction by M-Pesa receipt number
            transaction = Transaction.query.filter_by(mpesa_receipt_number=receipt).first()
            
            if not transaction:
                print(f"   ❌ Transaction not found")
                continue
            
            print(f"   ✓ Found transaction: {transaction.transaction_id}")
            print(f"     Amount: KES {transaction.amount}")
            print(f"     Status: {transaction.status}")
            print(f"     Booking ID: {transaction.booking_id}")
            
            booking_id = transaction.booking_id
            
            # Delete related records if booking exists
            if booking_id:
                booking = Booking.query.get(booking_id)
                
                if booking:
                    # Delete notifications for this booking's user and driver
                    user_notifications = Notification.query.filter_by(user_id=booking.user_id).all()
                    driver_notifications = Notification.query.filter_by(driver_id=booking.driver_id).all()
                    
                    deleted_notifs = 0
                    for notif in user_notifications + driver_notifications:
                        db.session.delete(notif)
                        deleted_notifs += 1
                    
                    if deleted_notifs > 0:
                        print(f"     🗑️  Deleted {deleted_notifs} notification(s)")
                    
                    # Delete escrow record
                    escrow = Escrow.query.filter_by(booking_id=booking_id).first()
                    if escrow:
                        db.session.delete(escrow)
                        print(f"     🗑️  Deleted escrow record")
                    
                    # Delete booking
                    db.session.delete(booking)
                    print(f"     🗑️  Deleted booking")
            
            # Delete transaction
            db.session.delete(transaction)
            print(f"     🗑️  Deleted transaction")
            
            removed_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"\n✅ Successfully removed {removed_count} unrealistic payment(s)")
        print(f"\n📊 Remaining transactions:")
        
        # Show remaining transactions
        remaining = Transaction.query.filter_by(
            type='booking_payment',
            status='completed'
        ).all()
        
        if remaining:
            for trans in remaining:
                print(f"   • {trans.mpesa_receipt_number} - KES {trans.amount} - {trans.created_at}")
        else:
            print(f"   No completed transactions remaining")

if __name__ == '__main__':
    print("🧹 Starting cleanup of unrealistic payments...")
    print(f"Removing {len(RECEIPTS_TO_REMOVE)} transactions\n")
    cleanup_unrealistic_payments()
    print("\n✨ Cleanup complete!")
