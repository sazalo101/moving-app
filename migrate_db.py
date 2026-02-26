#!/usr/bin/env python3
"""Database migration script to add booking_id column to transaction table"""

import sqlite3
import os

db_path = 'instance/moving_app.db'

if not os.path.exists(db_path):
    print(f"Database file not found: {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if booking_id column exists
    cursor.execute("PRAGMA table_info(`transaction`);")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    if 'booking_id' in column_names:
        print("✓ Column 'booking_id' already exists in transaction table")
    else:
        # Add the booking_id column
        cursor.execute("ALTER TABLE `transaction` ADD COLUMN booking_id INTEGER;")
        conn.commit()
        print("✓ Successfully added 'booking_id' column to transaction table")
    
    # Verify the column was added
    cursor.execute("PRAGMA table_info(`transaction`);")
    columns = cursor.fetchall()
    print("\nTransaction table columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    conn.close()
    print("\n✓ Migration completed successfully!")
    
except Exception as e:
    print(f"✗ Error during migration: {str(e)}")
    exit(1)
