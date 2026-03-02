#!/usr/bin/env python3
"""
Reset all drivers to unverified status for proper admin verification testing
"""
from movers import app, db, Driver, User

def reset_driver_verification():
    """Reset all drivers to unverified status"""
    with app.app_context():
        print("🔄 Resetting driver verification status...\n")
        
        # Get all drivers
        drivers = Driver.query.all()
        
        if not drivers:
            print("No drivers found in database.")
            return
        
        reset_count = 0
        for driver in drivers:
            user = User.query.get(driver.user_id)
            if not user:
                continue
            
            print(f"Driver: {user.name} (ID: {driver.id})")
            print(f"  Current Status: is_verified={driver.is_verified}, status={driver.verification_status}")
            
            # Reset to unverified
            driver.is_verified = False
            driver.verification_status = 'pending'
            driver.is_available = False
            driver.verified_by = None
            driver.verified_at = None
            driver.rejection_reason = None
            
            print(f"  ✓ Reset to: is_verified=False, status=pending, is_available=False\n")
            reset_count += 1
        
        # Commit changes
        db.session.commit()
        
        print(f"✅ Successfully reset {reset_count} driver(s) to unverified status!")
        print(f"\n📋 Next steps:")
        print(f"   1. Restart the backend server")
        print(f"   2. Go to Admin Dashboard → Driver Verification")
        print(f"   3. Manually verify drivers to see 'VERIFIED' badge")
        print(f"   4. Unverified drivers will show 'UNVERIFIED' badge")

if __name__ == '__main__':
    print("🔧 Driver Verification Reset Script\n")
    print("This will reset ALL drivers to unverified status.")
    print("Only admin-verified drivers will show as 'VERIFIED'.\n")
    
    confirm = input("Continue? (yes/no): ")
    if confirm.lower() == 'yes':
        reset_driver_verification()
    else:
        print("❌ Operation cancelled.")
