from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime 
from dotenv import load_dotenv
import os
import requests
import uuid
import base64
import random
from requests.auth import HTTPBasicAuth
app = Flask(__name__)

load_dotenv()

CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///moving_app.db'
db = SQLAlchemy(app)

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY', '').strip()
MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET', '').strip()
MPESA_BUSINESS_SHORT_CODE = os.getenv('MPESA_BUSINESS_SHORT_CODE', '174379')
MPESA_PASSKEY = os.getenv('MPESA_PASSKEY', '').strip()
MPESA_ENVIRONMENT = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', 'https://yourdomain.com/api/mpesa/callback')

# M-Pesa B2C Configuration
MPESA_INITIATOR_NAME = os.getenv('MPESA_INITIATOR_NAME', 'testapi').strip()
MPESA_SECURITY_CREDENTIAL = os.getenv('MPESA_SECURITY_CREDENTIAL', '').strip()
MPESA_B2C_SHORT_CODE = os.getenv('MPESA_B2C_SHORT_CODE', '600996').strip()
MPESA_B2C_RESULT_URL = os.getenv('MPESA_B2C_RESULT_URL', 'https://yourdomain.com/api/mpesa/b2c-result')
MPESA_B2C_TIMEOUT_URL = os.getenv('MPESA_B2C_TIMEOUT_URL', 'https://yourdomain.com/api/mpesa/b2c-timeout')

# M-Pesa B2C Configuration
MPESA_INITIATOR_NAME = os.getenv('MPESA_INITIATOR_NAME', 'testapi')
MPESA_SECURITY_CREDENTIAL = os.getenv('MPESA_SECURITY_CREDENTIAL', '')
MPESA_B2C_SHORT_CODE = os.getenv('MPESA_B2C_SHORT_CODE', '600996')
MPESA_B2C_RESULT_URL = os.getenv('MPESA_B2C_RESULT_URL', 'https://yourdomain.com/api/mpesa/b2c-result')
MPESA_B2C_TIMEOUT_URL = os.getenv('MPESA_B2C_TIMEOUT_URL', 'https://yourdomain.com/api/mpesa/b2c-timeout')

# M-Pesa API URLs
if MPESA_ENVIRONMENT == 'sandbox':
    MPESA_API_BASE = 'https://sandbox.safaricom.co.ke'
else:
    MPESA_API_BASE = 'https://api.safaricom.co.ke'

# Models
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=True)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    mpesa_receipt_number = db.Column(db.String(100), nullable=True)
    checkout_request_id = db.Column(db.String(100), nullable=True)
    merchant_request_id = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    type = db.Column(db.String(50), nullable=False)  # deposit, payment, withdrawal, escrow_release, refund, booking_payment
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='user')  # user, driver, admin
    is_banned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    balance = db.Column(db.Float, default=0.0)  # Wallet balance

    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    support_tickets = db.relationship('SupportTicket', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vehicle_type = db.Column(db.String(100), nullable=False)
    license_plate = db.Column(db.String(50), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    earnings = db.Column(db.Float, default=0.0)
    ratings = db.Column(db.Float, default=0.0)
    completed_orders = db.Column(db.Integer, default=0)
    live_location = db.Column(db.String(100), nullable=True)  # Latitude, Longitude

    # Verification System
    is_verified = db.Column(db.Boolean, default=False)
    verification_status = db.Column(db.String(50), default='pending')  # pending, under_review, approved, rejected
    
    # Driver Documents
    license_number = db.Column(db.String(100), nullable=True)
    license_expiry = db.Column(db.DateTime, nullable=True)
    drivers_license_url = db.Column(db.String(500), nullable=True)
    
    # Vehicle Documents
    vehicle_registration_url = db.Column(db.String(500), nullable=True)
    insurance_certificate_url = db.Column(db.String(500), nullable=True)
    insurance_expiry = db.Column(db.DateTime, nullable=True)
    vehicle_photo_url = db.Column(db.String(500), nullable=True)
    
    # Profile
    profile_photo_url = db.Column(db.String(500), nullable=True)
    
    # Admin Review
    rejection_reason = db.Column(db.Text, nullable=True)
    verified_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='driver_profile', lazy=True)
    bookings = db.relationship('Booking', backref='driver', lazy=True)
    reviews = db.relationship('Review', backref='driver', lazy=True)
    notifications = db.relationship('Notification', backref='driver', lazy=True)
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_drivers', lazy=True)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    pickup_location = db.Column(db.String(200), nullable=False)
    dropoff_location = db.Column(db.String(200), nullable=False)
    distance = db.Column(db.Float, nullable=False)  # Distance in km
    price = db.Column(db.Float, nullable=False)  # Price based on distance
    status = db.Column(db.String(50), default='pending')  # pending, accepted, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    promo_code = db.Column(db.String(50), nullable=True)  # Applied promo code

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_id = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # Rating out of 5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SupportTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='open')  # open, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin_reply = db.Column(db.Text, nullable=True)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=True)
    message = db.Column(db.String(200), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PromoCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount = db.Column(db.Float, nullable=False)  # Discount percentage
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Escrow(db.Model):
    """Escrow model to track held funds between users and drivers"""
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)  # Total amount held in escrow
    platform_fee = db.Column(db.Float, nullable=False)  # Platform fee (10%)
    driver_amount = db.Column(db.Float, nullable=False)  # Amount driver will receive
    status = db.Column(db.String(50), default='held')  # held, released, refunded, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    released_at = db.Column(db.DateTime, nullable=True)
    refunded_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    booking = db.relationship('Booking', backref='escrow_record', lazy=True, uselist=False)
    user = db.relationship('User', foreign_keys=[user_id], backref='escrow_payments', lazy=True)
    driver = db.relationship('Driver', foreign_keys=[driver_id], backref='escrow_earnings', lazy=True)

# Helper Functions
def validate_user(data):
    if not data.get('name') or not data.get('phone') or not data.get('email') or not data.get('password'):
        return False
    return True

# Create Admin User
def create_admin_user():
    admin_password = generate_password_hash('admin#cuba', method='pbkdf2:sha256')
    admin_email = 'admin@movingapp.com'

    admin = User.query.filter_by(email=admin_email).first()
    if not admin:
        admin = User(
            name='Admin',
            phone='1234567890',
            email=admin_email,
            password=admin_password,
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully.")
# Routes
@app.route('/')
def landing_page():
    return jsonify({'message': 'Welcome to the Moving App API!'})

# Authentication
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not validate_user(data):
        return jsonify({'error': 'Name, phone, email, and password are required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(
        name=data['name'],
        phone=data['phone'],
        email=data['email'],
        password=generate_password_hash(data['password'], method='pbkdf2:sha256'),
        role=data.get('role', 'user')
    )
    db.session.add(user)
    db.session.commit()

    if data.get('role') == 'driver':
        driver = Driver(
            user_id=user.id,
            vehicle_type=data.get('vehicle_type', ''),
            license_plate=data.get('license_plate', ''),
            is_verified=False,  # Require admin verification
            verification_status='pending',  # Pending until admin approves
            is_available=False  # Not available until verified
        )
        db.session.add(driver)
        db.session.commit()
        
        return jsonify({
            'message': 'Driver registration successful! Please submit verification documents. You can accept bookings after admin approval.',
            'user_id': user.id,
            'driver_id': driver.id
        })

    return jsonify({'message': 'Registration successful!', 'user_id': user.id})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        response_data = {
            'message': 'Login successful!',
            'user_id': user.id,
            'role': user.role,
            'name': user.name,
            'email': user.email,
            'phone': user.phone
        }
        
        # If user is a driver, include driver_id
        if user.role == 'driver':
            driver = Driver.query.filter_by(user_id=user.id).first()
            if driver:
                response_data['driver_id'] = driver.id
        
        return jsonify(response_data)
    return jsonify({'error': 'Invalid credentials'}), 401

# Get User Balance
@app.route('/api/user/balance/<int:user_id>', methods=['GET'])
def get_user_balance(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'balance': user.balance,
        'name': user.name,
        'email': user.email
    })

# User Dashboard
@app.route('/api/user/search-drivers', methods=['POST'])
def search_drivers():
    """Search for available verified drivers"""
    try:
        data = request.get_json()
        pickup_location = data.get('pickup_location')
        dropoff_location = data.get('dropoff_location')
        distance = data.get('distance', None)  # Get distance from frontend calculation

        if not pickup_location or not dropoff_location:
            return jsonify({'error': 'Pickup and dropoff locations are required'}), 400

        # Use actual distance from frontend or default to reasonable estimate
        if not distance:
            distance = 15.0  # Default reasonable distance for moving services
        
        # TEST PRICING MODE: Fixed range 10-20 KES for affordable M-Pesa testing
        # This makes it practical to test real payments without spending much money
        base_test_price = random.randint(10, 20)  # Random price between 10-20 KES
        
        print(f"[SEARCH DRIVERS] Request from: {pickup_location} to: {dropoff_location}")
        print(f"[TEST MODE] Base shipping fee: KES {base_test_price}")

        # Only show verified drivers that are available
        drivers = Driver.query.filter_by(is_available=True, is_verified=True).all()
        
        print(f"[SEARCH DRIVERS] Found {len(drivers)} verified & available drivers")
        for driver in drivers:
            print(f"  - {driver.user.name} (ID: {driver.id}, Vehicle: {driver.vehicle_type})")
        
        # Apply small price variation per driver (±1-2 KES) to show different prices
        drivers_data = []
        for driver in drivers:
            # Small random variation per driver (between -2 and +2 KES)
            price_variation = random.randint(-2, 2)
            driver_price = max(10, base_test_price + price_variation)  # Ensure minimum 10 KES
            driver_price = min(20, driver_price)  # Ensure maximum 20 KES
            
            drivers_data.append({
                'driver_id': driver.id,
                'name': driver.user.name,
                'vehicle_type': driver.vehicle_type,
                'ratings': driver.ratings,
                'completed_orders': driver.completed_orders,
                'price': driver_price,
                'is_verified': driver.is_verified,
                'license_plate': driver.license_plate
            })

        print(f"[SEARCH DRIVERS] Returning {len(drivers_data)} drivers to client")
        
        return jsonify({
            'distance': round(distance, 2),
            'base_price': base_test_price,
            'drivers': drivers_data
        })
    except Exception as e:
        print(f"[ERROR] Search drivers failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to search drivers: {str(e)}'}), 500

@app.route('/api/user/book-driver', methods=['POST'])
def book_driver():
    data = request.get_json()
    user_id = data.get('user_id')
    driver_id = data.get('driver_id')
    pickup_location = data.get('pickup_location')
    dropoff_location = data.get('dropoff_location')
    distance = data.get('distance')
    price = data.get('price')
    promo_code = data.get('promo_code', None)

    if not user_id or not driver_id or not pickup_location or not dropoff_location or not distance or not price:
        return jsonify({'error': 'Missing required fields'}), 400

    # Check user wallet balance
    user = User.query.get_or_404(user_id)
    
    # Apply promo code discount if valid
    final_price = price
    if promo_code:
        promo = PromoCode.query.filter_by(code=promo_code, is_active=True).first()
        if promo:
            final_price = price * (1 - promo.discount / 100)
    
    # Check if user has sufficient balance
    if user.balance < final_price:
        return jsonify({
            'error': 'Insufficient wallet balance',
            'required': final_price,
            'available': user.balance
        }), 400

    # Deduct money from user wallet (held in escrow)
    user.balance -= final_price

    booking = Booking(
        user_id=user_id,
        driver_id=driver_id,
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        distance=distance,
        price=final_price,
        promo_code=promo_code
    )
    db.session.add(booking)
    db.session.flush()  # Get booking.id before commit
    
    # Create escrow record to hold the payment
    platform_fee_percentage = 10  # 10% platform fee
    platform_fee = final_price * (platform_fee_percentage / 100)
    driver_amount = final_price - platform_fee
    
    escrow = Escrow(
        booking_id=booking.id,
        user_id=user_id,
        driver_id=driver_id,
        amount=final_price,
        platform_fee=platform_fee,
        driver_amount=driver_amount,
        status='held'
    )
    db.session.add(escrow)
    
    # Create payment record for tracking
    payment = Payment(
        user_id=user_id,
        amount=final_price,
        transaction_id=f'BOOK-{uuid.uuid4().hex[:8].upper()}',
        status='completed'
    )
    db.session.add(payment)
    db.session.commit()

    # Notify driver
    notification = Notification(
        driver_id=driver_id,
        message=f'New booking request from {user.name}. Amount: KES {final_price:.2f} (KES {driver_amount:.2f} for you after fees)'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({
        'message': 'Driver booked successfully! Payment held in escrow until service completion.',
        'booking_id': booking.id,
        'amount_paid': final_price,
        'escrow_amount': driver_amount,
        'platform_fee': platform_fee,
        'remaining_balance': user.balance
    })

# Book driver with M-Pesa payment
@app.route('/api/user/book-driver-mpesa', methods=['POST'])
def book_driver_with_mpesa():
    """Create booking and initiate M-Pesa payment"""
    data = request.get_json()
    user_id = data.get('user_id')
    driver_id = data.get('driver_id')
    pickup_location = data.get('pickup_location')
    dropoff_location = data.get('dropoff_location')
    distance = data.get('distance')
    price = data.get('price')
    phone_number = data.get('phone_number')
    promo_code = data.get('promo_code', None)

    if not all([user_id, driver_id, pickup_location, dropoff_location, distance, price, phone_number]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Get user
    user = User.query.get_or_404(user_id)
    
    # Apply promo code discount if valid
    final_price = price
    if promo_code:
        promo = PromoCode.query.filter_by(code=promo_code, is_active=True).first()
        if promo:
            final_price = price * (1 - promo.discount / 100)
    
    # Validate amount
    try:
        final_price = float(final_price)
        if final_price <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400
    
    # Format phone number
    phone_number = phone_number.replace('+', '').replace(' ', '').replace('-', '')
    if phone_number.startswith('0'):
        phone_number = '254' + phone_number[1:]
    elif not phone_number.startswith('254'):
        phone_number = '254' + phone_number
    
    # Create booking with pending_payment status
    booking = Booking(
        user_id=user_id,
        driver_id=driver_id,
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        distance=distance,
        price=final_price,
        promo_code=promo_code,
        status='pending_payment'
    )
    db.session.add(booking)
    db.session.flush()  # Get booking.id
    
    # Generate unique transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        transaction_id=transaction_id,
        amount=final_price,
        phone_number=phone_number,
        type='booking_payment',
        status='pending',
        booking_id=booking.id  # Link transaction to booking
    )
    db.session.add(transaction)
    db.session.commit()
    
    # Call M-Pesa API to send STK push
    print(f"\n{'='*60}")
    print(f"[PAYMENT] Starting M-Pesa STK Push for booking {booking.id}")
    print(f"[PAYMENT] Environment: {MPESA_ENVIRONMENT}")
    print(f"[PAYMENT] Amount: KES {final_price}")
    print(f"[PAYMENT] Phone: {phone_number}")
    print(f"{'='*60}\n")
    
    try:
        # Get OAuth access token
        print(f"[PAYMENT] Step 1: Requesting M-Pesa access token...")
        access_token = get_mpesa_access_token()
        
        if not access_token:
            # Log the error for debugging
            print(f"[ERROR] Failed to get M-Pesa access token for booking {booking.id}")
            print(f"[ERROR] M-Pesa Config - Environment: {MPESA_ENVIRONMENT}")
            print(f"[ERROR] M-Pesa Config - Business Short Code: {MPESA_BUSINESS_SHORT_CODE}")
            print(f"[ERROR] M-Pesa Config - Has Consumer Key: {bool(MPESA_CONSUMER_KEY)}")
            print(f"[ERROR] M-Pesa Config - Has Consumer Secret: {bool(MPESA_CONSUMER_SECRET)}")
            
            # Cannot proceed without access token
            transaction.status = 'failed'
            booking.status = 'cancelled'
            db.session.commit()
            return jsonify({
                'success': False,
                'error': 'Failed to authenticate with M-Pesa API. Please check your configuration.',
                'transaction_id': transaction_id
            }), 500
        
        # Generate password and timestamp
        print(f"[PAYMENT] Step 2: Generating password and timestamp...")
        password, timestamp = generate_password_and_timestamp()
        
        # Prepare STK Push request
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        payload = {
            'BusinessShortCode': MPESA_BUSINESS_SHORT_CODE,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(final_price),
            'PartyA': phone_number,
            'PartyB': MPESA_BUSINESS_SHORT_CODE,
            'PhoneNumber': phone_number,
            'CallBackURL': MPESA_CALLBACK_URL,
            'AccountReference': f'Booking-{booking.id}',
            'TransactionDesc': f'Moving service booking payment'
        }
        
        print(f"[PAYMENT] Step 3: Sending STK Push request to M-Pesa...")
        print(f"[PAYMENT] Endpoint: {MPESA_API_BASE}/mpesa/stkpush/v1/processrequest")
        print(f"[PAYMENT] Short Code: {MPESA_BUSINESS_SHORT_CODE}")
        print(f"[PAYMENT] Phone: {phone_number}")
        print(f"[PAYMENT] Amount: {int(final_price)}")
        print(f"[PAYMENT] Callback: {MPESA_CALLBACK_URL}")
        
        try:
            response = requests.post(
                f'{MPESA_API_BASE}/mpesa/stkpush/v1/processrequest',
                json=payload,
                headers=headers,
                timeout=30  # Increased timeout for better reliability
            )
            
            print(f"[PAYMENT] M-Pesa Response Status: {response.status_code}")
            print(f"[PAYMENT] M-Pesa Response: {response.text}")
            
            response_data = response.json()
        except requests.exceptions.Timeout as e:
            print(f"[ERROR] M-Pesa API timeout after 30 seconds: {str(e)}")
            print(f"[ERROR] This may indicate M-Pesa service is slow or unavailable")
            transaction.status = 'failed'
            booking.status = 'cancelled'
            db.session.commit()
            return jsonify({
                'success': False,
                'error': 'M-Pesa service timeout. Please try again in a few minutes.',
                'transaction_id': transaction_id
            }), 500
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] M-Pesa API request failed: {str(e)}")
            transaction.status = 'failed'
            booking.status = 'cancelled'
            db.session.commit()
            return jsonify({
                'success': False,
                'error': 'Failed to connect to M-Pesa. Please check your internet connection.',
                'transaction_id': transaction_id
            }), 500
        
        print(f"[PAYMENT] Step 4: Processing M-Pesa response...")
        
        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            # STK Push initiated successfully
            print(f"[SUCCESS] STK Push sent successfully!")
            print(f"[SUCCESS] CheckoutRequestID: {response_data.get('CheckoutRequestID')}")
            print(f"[SUCCESS] MerchantRequestID: {response_data.get('MerchantRequestID')}")
            print(f"[SUCCESS] Customer should receive prompt on phone: {phone_number}")
            
            transaction.checkout_request_id = response_data.get('CheckoutRequestID')
            transaction.merchant_request_id = response_data.get('MerchantRequestID')
            
            # In sandbox mode, auto-complete payment immediately for fast testing
            if MPESA_ENVIRONMENT == 'sandbox':
                print(f"[SANDBOX] Auto-completing payment immediately for fast UX")
                transaction.status = 'completed'
                transaction.mpesa_receipt_number = f'SIM{uuid.uuid4().hex[:10].upper()}'
                booking.status = 'pending'
                
                # Create escrow record
                platform_fee_percentage = 10
                platform_fee = final_price * (platform_fee_percentage / 100)
                driver_amount = final_price - platform_fee
                
                escrow = Escrow(
                    booking_id=booking.id,
                    user_id=user_id,
                    driver_id=driver_id,
                    amount=final_price,
                    platform_fee=platform_fee,
                    driver_amount=driver_amount,
                    status='held'
                )
                db.session.add(escrow)
                
                # Create payment record
                payment = Payment(
                    user_id=user_id,
                    amount=final_price,
                    transaction_id=transaction.mpesa_receipt_number,
                    status='completed'
                )
                db.session.add(payment)
                
                # Notify driver
                notification = Notification(
                    driver_id=driver_id,
                    message=f'New booking request from {user.name}. Amount: KES {final_price:.2f} (KES {driver_amount:.2f} for you after fees)'
                )
                db.session.add(notification)
                print(f"[SANDBOX] Payment completed instantly - Transaction: {transaction.mpesa_receipt_number}")
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Payment processed successfully!' if MPESA_ENVIRONMENT == 'sandbox' else 'Check your phone to complete payment.',
                'transaction_id': transaction_id,
                'booking_id': booking.id,
                'checkout_request_id': response_data.get('CheckoutRequestID'),
                'amount': final_price,
                'simulated': MPESA_ENVIRONMENT == 'sandbox'
            }), 200
        else:
            # STK Push failed
            print(f"[ERROR] STK Push failed!")
            print(f"[ERROR] ResponseCode: {response_data.get('ResponseCode')}")
            print(f"[ERROR] ResponseDescription: {response_data.get('ResponseDescription')}")
            print(f"[ERROR] ErrorCode: {response_data.get('errorCode')}")
            print(f"[ERROR] ErrorMessage: {response_data.get('errorMessage')}")
            
            error_message = response_data.get('errorMessage') or response_data.get('ResponseDescription') or 'Failed to initiate M-Pesa payment'
            transaction.status = 'failed'
            booking.status = 'cancelled'
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': error_message,
                'transaction_id': transaction_id
            }), 400
            
    except Exception as e:
        transaction.status = 'failed'
        booking.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'success': False,
            'error': f'Error initiating payment: {str(e)}',
            'transaction_id': transaction_id
        }), 500

# Driver Dashboard
@app.route('/api/driver/available-orders', methods=['GET'])
@app.route('/api/driver/available-orders/<int:driver_id>', methods=['GET'])
def available_orders(driver_id=None):
    """Get all pending and accepted orders for drivers
    If driver_id is provided, show orders assigned to that driver (pending to accept, accepted to complete).
    Otherwise, show all pending orders (for admin or general view)
    """
    if driver_id:
        # Get orders assigned to this specific driver that are pending or accepted
        orders = Booking.query.filter_by(driver_id=driver_id).filter(Booking.status.in_(['pending', 'accepted'])).all()
        print(f"[DEBUG] Driver {driver_id} fetching available orders: Found {len(orders)} pending/accepted orders")
    else:
        # Get all pending orders (no driver assigned yet or general view)
        orders = Booking.query.filter_by(status='pending').all()
        print(f"[DEBUG] Fetching all pending orders: Found {len(orders)} orders")
    
    orders_data = [{
        'booking_id': order.id,
        'user_id': order.user_id,
        'customer_name': order.user.name,  # Include user name
        'customer_phone': order.user.phone,  # Include customer phone
        'pickup_location': order.pickup_location,
        'dropoff_location': order.dropoff_location,
        'distance': order.distance,
        'price': order.price,
        'created_at': order.created_at.isoformat() if order.created_at else None,  # ISO format timestamp
        'status': order.status
    } for order in orders]
    return jsonify({'orders': orders_data})

@app.route('/api/driver/accept-order/<int:booking_id>', methods=['POST'])
def accept_order(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    driver = Driver.query.get_or_404(booking.driver_id)
    booking.status = 'accepted'
    db.session.commit()

    # Notify user
    notification = Notification(
        user_id=booking.user_id,
        message=f'Driver {driver.user.name} has accepted your booking.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Order accepted!', 'booking_id': booking.id})

@app.route('/api/driver/complete-order/<int:booking_id>', methods=['POST'])
def complete_order(booking_id):
    """Driver marks order as completed, money is released from escrow to driver earnings"""
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.status != 'accepted':
        return jsonify({'error': 'Only accepted orders can be completed'}), 400
    
    driver = Driver.query.get_or_404(booking.driver_id)
    
    # Get escrow record
    escrow = Escrow.query.filter_by(booking_id=booking.id).first()
    if not escrow:
        return jsonify({'error': 'Escrow record not found'}), 404
    
    if escrow.status != 'held':
        return jsonify({'error': f'Escrow already {escrow.status}'}), 400
    
    # Release escrow funds to driver
    driver.earnings += escrow.driver_amount
    driver.completed_orders += 1
    booking.status = 'completed'
    escrow.status = 'released'
    escrow.released_at = datetime.utcnow()
    
    # Create transaction record for the escrow release
    escrow_release_transaction = Transaction(
        user_id=driver.user_id,
        transaction_id=f'ESCROW-{uuid.uuid4().hex[:8].upper()}',
        amount=escrow.driver_amount,
        type='escrow_release',
        status='completed'
    )
    db.session.add(escrow_release_transaction)
    
    db.session.commit()
    
    # Notify user
    user_notification = Notification(
        user_id=booking.user_id,
        message=f'Your order has been completed. Thank you for using our service!'
    )
    db.session.add(user_notification)
    
    # Notify driver
    driver_notification = Notification(
        user_id=driver.user_id,
        message=f'Order completed! KES {escrow.driver_amount:.2f} released from escrow to your earnings. You can now withdraw.'
    )
    db.session.add(driver_notification)
    db.session.commit()
    
    return jsonify({
        'message': 'Order completed successfully! Funds released from escrow.',
        'booking_id': booking.id,
        'driver_earnings': escrow.driver_amount,
        'platform_fee': escrow.platform_fee,
        'total_earnings': driver.earnings,
        'escrow_status': 'released'
    })

# Admin Dashboard
@app.route('/api/admin/manage-users', methods=['GET'])
def manage_users():
    users = User.query.all()
    users_data = [{
        'user_id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'is_banned': user.is_banned
    } for user in users]
    return jsonify({'users': users_data})

@app.route('/api/admin/ban-user/<int:user_id>', methods=['POST'])
def ban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = True
    db.session.commit()
    return jsonify({'message': f'User {user.name} has been banned.'})

# Wallet Management
@app.route('/api/user/deposit', methods=['POST'])
def create_deposit():
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    if not user_id or not amount:
        return jsonify({'error': 'User ID and amount are required'}), 400
    
    # Check if user exists
    user = User.query.get_or_404(user_id)
    
    # Generate a unique transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Create a new transaction
    transaction = Transaction(
        user_id=user_id,
        transaction_id=transaction_id,
        amount=amount,
        type='deposit',
        status='pending'
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Deposit initiated',
        'transaction_id': transaction_id
    })

# M-Pesa Daraja API Helper Functions
def get_mpesa_access_token():
    """Generate OAuth access token for M-Pesa Daraja API"""
    try:
        # Check if credentials are configured
        if not MPESA_CONSUMER_KEY or not MPESA_CONSUMER_SECRET:
            print("ERROR: M-Pesa credentials not configured in environment variables")
            return None
        
        url = f'{MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials'
        print(f"Requesting M-Pesa access token from: {url}")
        print(f"Using Consumer Key: {MPESA_CONSUMER_KEY[:10]}...{MPESA_CONSUMER_KEY[-4:]}")
        
        response = requests.get(
            url, 
            auth=HTTPBasicAuth(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET),
            timeout=30
        )
        
        print(f"Token Response Status: {response.status_code}")
        print(f"Token Response: {response.text}")
        
        if response.status_code == 200:
            json_response = response.json()
            access_token = json_response.get('access_token')
            if access_token:
                print(f"Successfully obtained M-Pesa access token (length: {len(access_token)})")
                print(f"Token preview: {access_token[:20]}...")
                return access_token
            else:
                print("No access token in response:", json_response)
                return None
        else:
            print(f"Failed to get access token. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except requests.exceptions.Timeout:
        print("Timeout error connecting to M-Pesa API")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Network error getting access token: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error getting access token: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def generate_password_and_timestamp():
    """Generate password and timestamp for STK Push"""
    from datetime import datetime
    import base64
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_str = f"{MPESA_BUSINESS_SHORT_CODE}{MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode('utf-8')
    
    return password, timestamp

def initiate_b2c_payment(phone_number, amount, transaction_id, remarks="Withdrawal"):
    """
    Initiate B2C payment using M-Pesa Daraja API
    Sends money from business account to customer phone
    """
    try:
        print(f"\n{'='*60}")
        print(f"Initiating B2C Payment")
        print(f"{'='*60}")
        print(f"Amount: KES {amount}")
        print(f"Phone: {phone_number}")
        print(f"Transaction ID: {transaction_id}")
        print(f"Environment: {MPESA_ENVIRONMENT}")
        
        # Validate configuration
        if not MPESA_SECURITY_CREDENTIAL or len(MPESA_SECURITY_CREDENTIAL) < 10:
            print("ERROR: Security credential not configured properly")
            return {
                'success': False,
                'error': 'B2C not configured. Please contact support.'
            }
        
        # Get access token
        access_token = get_mpesa_access_token()
        if not access_token:
            return {'success': False, 'error': 'Failed to authenticate with M-Pesa'}
        
        # B2C API endpoint
        url = f'{MPESA_API_BASE}/mpesa/b2c/v1/paymentrequest'
        
        # Request headers
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        # Request payload
        payload = {
            'InitiatorName': MPESA_INITIATOR_NAME,
            'SecurityCredential': MPESA_SECURITY_CREDENTIAL,
            'CommandID': 'BusinessPayment',
            'Amount': int(amount),
            'PartyA': MPESA_B2C_SHORT_CODE,
            'PartyB': phone_number,
            'Remarks': remarks,
            'QueueTimeOutURL': MPESA_B2C_TIMEOUT_URL,
            'ResultURL': MPESA_B2C_RESULT_URL,
            'Occasion': transaction_id
        }
        
        # Make API request with 30-second timeout (sandbox can be slow)
        print(f"Sending B2C request to: {url}")
        print(f"Authorization: Bearer {access_token[:15]}...{access_token[-10:] if len(access_token) > 25 else '***'}")
        print(f"InitiatorName: {MPESA_INITIATOR_NAME}")
        print(f"PartyA (Short Code): {MPESA_B2C_SHORT_CODE}")
        print(f"PartyB (Phone): {phone_number}")
        print(f"Amount: {int(amount)}")
        print(f"SecurityCredential length: {len(MPESA_SECURITY_CREDENTIAL)}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        # Log response for debugging
        print(f"B2C Response Status: {response.status_code}")
        print(f"B2C Response Headers: {dict(response.headers)}")
        print(f"B2C Response Body: {response.text}")
        print(f"{'='*60}\n")
        
        # Try to parse JSON response
        try:
            response_data = response.json()
        except ValueError as json_err:
            print(f"Failed to parse JSON response: {json_err}")
            print(f"Full response text: {response.text}")
            return {
                'success': False,
                'error': f'M-Pesa returned an invalid response. Status: {response.status_code}'
            }
        
        # Handle 401 Unauthorized - means credentials don't have B2C permissions
        if response.status_code == 401:
            print(f"✗ 401 Unauthorized: B2C credentials not authorized")
            print(f"   The consumer key/secret don't have B2C permissions")
            print(f"   Using STK Push credentials for B2C won't work")
            
            # In sandbox mode, we can simulate for testing
            if MPESA_ENVIRONMENT == 'sandbox':
                print(f"   Falling back to simulation mode for sandbox testing")
                return {
                    'success': False,
                    'error': 'B2C_AUTH_FAILED',
                    'simulate': True,
                    'message': 'B2C authentication failed - using simulation mode'
                }
            else:
                return {
                    'success': False,
                    'error': 'B2C not authorized. Please enable B2C permissions in your Daraja account or use B2C-specific credentials.'
                }
        
        # Check if request was successful
        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            print(f"✓ B2C payment initiated successfully!")
            return {
                'success': True,
                'conversation_id': response_data.get('ConversationID'),
                'originator_conversation_id': response_data.get('OriginatorConversationID'),
                'response_description': response_data.get('ResponseDescription')
            }
        else:
            # Extract detailed error information
            error_code = response_data.get('errorCode', '')
            error_message = response_data.get('errorMessage', '')
            response_code = response_data.get('ResponseCode', '')
            response_desc = response_data.get('ResponseDescription', '')
            request_id = response_data.get('requestId', '')
            
            # Construct detailed error message
            if error_message:
                full_error = f"{error_message}"
                if error_code:
                    full_error += f" (Code: {error_code})"
                    
                # Special handling for common errors
                if 'Invalid Access Token' in error_message or 'invalid access token' in error_message.lower():
                    print(f"✗ Access token was rejected by M-Pesa B2C API")
                    print(f"   This usually means the credentials are for STK Push, not B2C")
                    print(f"   Or the app doesn't have B2C permissions enabled")
                    full_error = "M-Pesa authentication failed. Please ensure B2C is enabled for your app."
                    
            elif response_desc:
                full_error = f"{response_desc}"
                if response_code:
                    full_error += f" (Code: {response_code})"
            else:
                full_error = "B2C payment failed - unknown error"
            
            print(f"✗ B2C payment failed: {full_error}")
            print(f"Request ID: {request_id}")
            print(f"Full response: {response_data}")
            
            return {
                'success': False,
                'error': full_error
            }
            
    except requests.exceptions.Timeout:
        print(f"B2C Payment Timeout: M-Pesa API took too long to respond")
        return {
            'success': False,
            'error': 'M-Pesa is temporarily slow. Please try again in a moment. Your money is safe.'
        }
    except requests.exceptions.RequestException as e:
        print(f"B2C Payment Request Error: {str(e)}")
        return {
            'success': False,
            'error': 'Unable to connect to M-Pesa. Please check your internet connection and try again.'
        }
    except Exception as e:
        print(f"B2C Payment Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'An unexpected error occurred. Please try again later.'
        }

# M-Pesa Daraja API Endpoints
@app.route('/api/mpesa/stk-push', methods=['POST'])
def mpesa_stk_push():
    """Initiate M-Pesa STK Push payment using Daraja API"""
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    
    if not user_id or not amount or not phone_number:
        return jsonify({'error': 'User ID, amount, and phone number are required'}), 400
    
    # Validate amount
    try:
        amount = int(float(amount))
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400
    
    # Check if user exists
    user = User.query.get_or_404(user_id)
    
    # Format phone number (remove + and spaces, ensure it starts with 254)
    phone_number = phone_number.replace('+', '').replace(' ', '').replace('-', '')
    if phone_number.startswith('0'):
        phone_number = '254' + phone_number[1:]
    elif not phone_number.startswith('254'):
        phone_number = '254' + phone_number
    
    # Generate a unique transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Create a new transaction
    transaction = Transaction(
        user_id=user_id,
        transaction_id=transaction_id,
        amount=amount,
        phone_number=phone_number,
        type='deposit',
        status='pending'
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    try:
        # Get OAuth access token
        access_token = get_mpesa_access_token()
        
        if not access_token:
            transaction.status = 'failed'
            db.session.commit()
            return jsonify({
                'success': False,
                'error': 'Failed to authenticate with M-Pesa API',
                'transaction_id': transaction_id
            }), 500
        
        # Generate password and timestamp
        password, timestamp = generate_password_and_timestamp()
        
        # Prepare STK Push request
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        payload = {
            'BusinessShortCode': MPESA_BUSINESS_SHORT_CODE,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': amount,
            'PartyA': phone_number,
            'PartyB': MPESA_BUSINESS_SHORT_CODE,
            'PhoneNumber': phone_number,
            'CallBackURL': MPESA_CALLBACK_URL,
            'AccountReference': f'Wallet-{user_id}',
            'TransactionDesc': f'Wallet deposit for {user.name}'
        }
        
        print(f"[PAYMENT] Initiating M-Pesa STK Push for booking {booking.id}, Amount: KES {final_price}")
        
        try:
            response = requests.post(
                f'{MPESA_API_BASE}/mpesa/stkpush/v1/processrequest',
                json=payload,
                headers=headers,
                timeout=15
            )
            
            response_data = response.json()
        except (requests.exceptions.Timeout, requests.exceptions.RequestException) as e:
            print(f"[PAYMENT ERROR] M-Pesa API call failed: {str(e)}")
            # In sandbox mode, simulate successful payment
            if MPESA_ENVIRONMENT == 'sandbox':
                print("[PAYMENT] Using sandbox simulation due to API error")
                booking.status = 'pending'
                transaction.status = 'completed'
                transaction.checkout_request_id = f'sim-{transaction_id[:20]}'
                transaction.mpesa_receipt_number = f'SIM{str(uuid.uuid4().hex[:10]).upper()}'
                
                platform_fee_percentage = 10
                platform_fee = final_price * (platform_fee_percentage / 100)
                driver_amount = final_price - platform_fee
                
                escrow = Escrow(
                    booking_id=booking.id,
                    user_id=user_id,
                    driver_id=driver_id,
                    amount=final_price,
                    platform_fee=platform_fee,
                    driver_amount=driver_amount,
                    status='held'
                )
                db.session.add(escrow)
                
                notification = Notification(
                    driver_id=driver_id,
                    message=f'New booking request from {user.name}. Amount: KES {final_price:.2f} (KES {driver_amount:.2f} for you after fees)'
                )
                db.session.add(notification)
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Payment processed successfully (Sandbox Mode)',
                    'transaction_id': transaction_id,
                    'booking_id': booking.id,
                    'checkout_request_id': transaction.checkout_request_id,
                    'amount': final_price,
                    'simulated': True
                }), 200
            else:
                transaction.status = 'failed'
                booking.status = 'cancelled'
                db.session.commit()
                return jsonify({
                    'success': False,
                    'error': 'Payment gateway unavailable. Please try again later.',
                    'transaction_id': transaction_id
                }), 500
        
        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            # STK Push initiated successfully
            transaction.checkout_request_id = response_data.get('CheckoutRequestID')
            transaction.merchant_request_id = response_data.get('MerchantRequestID')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'STK Push sent. Please check your phone to complete payment.',
                'transaction_id': transaction_id,
                'checkout_request_id': response_data.get('CheckoutRequestID')
            }), 200
        else:
            # STK Push failed
            transaction.status = 'failed'
            db.session.commit()
            
            error_message = response_data.get('errorMessage') or response_data.get('ResponseDescription') or 'Failed to initiate payment'
            
            return jsonify({
                'success': False,
                'error': error_message,
                'transaction_id': transaction_id
            }), 400
            
    except requests.exceptions.Timeout:
        transaction.status = 'failed'
        db.session.commit()
        return jsonify({
            'success': False,
            'error': 'Payment request timed out. Please try again.',
            'transaction_id': transaction_id
        }), 500
        
    except Exception as e:
        transaction.status = 'failed'
        db.session.commit()
        return jsonify({
            'success': False,
            'error': f'An error occurred: {str(e)}',
            'transaction_id': transaction_id
        }), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa payment callback from Daraja API"""
    try:
        data = request.get_json()
        
        # Daraja callback structure
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        print(f"[CALLBACK] Received callback for CheckoutRequestID: {checkout_request_id}, ResultCode: {result_code}")
        
        if not checkout_request_id:
            return jsonify({'error': 'CheckoutRequestID is required'}), 400
        
        # Find the transaction
        transaction = Transaction.query.filter_by(checkout_request_id=checkout_request_id).first()
        
        if not transaction:
            print(f"[CALLBACK ERROR] Transaction not found for CheckoutRequestID: {checkout_request_id}")
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Update transaction status based on result code
        if result_code == 0:
            # Transaction successful
            print(f"[CALLBACK SUCCESS] Processing successful payment for transaction {transaction.transaction_id}")
            transaction.status = 'completed'
            
            # Extract callback metadata
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            # Extract M-Pesa receipt number and phone number
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    transaction.mpesa_receipt_number = item.get('Value')
                    print(f"[CALLBACK] M-Pesa Receipt: {transaction.mpesa_receipt_number}")
                elif item.get('Name') == 'PhoneNumber':
                    transaction.phone_number = str(item.get('Value'))
            
            # Handle different transaction types
            if transaction.type == 'booking_payment' and transaction.booking_id:
                # Complete the booking
                booking = Booking.query.get(transaction.booking_id)
                if booking:
                    # Update booking status to pending (waiting for driver acceptance)
                    booking.status = 'pending'
                    print(f"[CALLBACK] Booking {booking.id} status updated to pending")
                    
                    # Create escrow record
                    platform_fee_percentage = 10
                    platform_fee = transaction.amount * (platform_fee_percentage / 100)
                    driver_amount = transaction.amount - platform_fee
                    
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
                    
                    # Create payment record
                    payment = Payment(
                        user_id=booking.user_id,
                        amount=transaction.amount,
                        transaction_id=transaction.mpesa_receipt_number or transaction.transaction_id,
                        status='completed'
                    )
                    db.session.add(payment)
                    
                    # Get user info for notification
                    user = User.query.get(booking.user_id)
                    
                    # Notify driver
                    notification = Notification(
                        driver_id=booking.driver_id,
                        message=f'New booking request from {user.name}. Amount: KES {transaction.amount:.2f} (KES {driver_amount:.2f} for you after fees)'
                    )
                    db.session.add(notification)
                    print(f"[CALLBACK] Escrow and notifications created for booking {booking.id}")
                    
            elif transaction.type == 'deposit':
                # Update user wallet balance for deposit
                user = User.query.get(transaction.user_id)
                if user:
                    user.balance += transaction.amount
                    print(f"[CALLBACK] User {user.id} balance updated: +{transaction.amount}")
                
        else:
            # Transaction failed or cancelled
            print(f"[CALLBACK FAILED] Payment failed for transaction {transaction.transaction_id}, Code: {result_code}, Desc: {result_desc}")
            transaction.status = 'failed'
            
            # If this was a booking payment, cancel the booking
            if transaction.type == 'booking_payment' and transaction.booking_id:
                booking = Booking.query.get(transaction.booking_id)
                if booking:
                    booking.status = 'cancelled'
                    print(f"[CALLBACK] Booking {booking.id} cancelled due to payment failure")
        
        # Commit all changes in one transaction for efficiency
        db.session.commit()
        print(f"[CALLBACK] Successfully processed callback for transaction {transaction.transaction_id}")
        
        return jsonify({
            'ResultCode': 0,
            'ResultDesc': 'Callback processed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()  # Rollback on error
        print(f"[CALLBACK ERROR] Callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'ResultCode': 1,
            'ResultDesc': f'Error: {str(e)}'
        }), 500

@app.route('/api/mpesa/b2c-result', methods=['POST'])
def b2c_result_callback():
    """Handle M-Pesa B2C payment result"""
    try:
        data = request.get_json()
        print(f"B2C Result Callback: {data}")
        
        result = data.get('Result', {})
        result_code = result.get('ResultCode')
        conversation_id = result.get('ConversationID')
        result_desc = result.get('ResultDesc', '')
        
        # Find transaction by conversation ID
        transaction = Transaction.query.filter_by(
            checkout_request_id=conversation_id
        ).first()
        
        if not transaction:
            print(f"Transaction not found for conversation ID: {conversation_id}")
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Transaction not found'}), 404
        
        if result_code == 0:
            # Success
            print(f"B2C withdrawal successful: {transaction_id}")
            transaction.status = 'completed'
            
            # Extract receipt number from result parameters
            result_parameters = result.get('ResultParameters', {}).get('ResultParameter', [])
            for param in result_parameters:
                if param.get('Key') == 'TransactionReceipt':
                    transaction.mpesa_receipt_number = param.get('Value')
                    print(f"M-Pesa Receipt: {transaction.mpesa_receipt_number}")
            
            # Notify driver
            notification = Notification(
                user_id=transaction.user_id,
                message=f'Withdrawal successful! KES {transaction.amount:.2f} sent to your M-Pesa account.'
            )
            db.session.add(notification)
            
            print(f"Withdrawal completed: KES {transaction.amount} to user {transaction.user_id}")
        else:
            # Failed
            print(f"B2C withdrawal failed: Code {result_code}, Desc: {result_desc}")
            transaction.status = 'failed'
            
            # Refund the driver
            driver = Driver.query.filter_by(user_id=transaction.user_id).first()
            if driver:
                driver.earnings += transaction.amount
                print(f"Refunded KES {transaction.amount} to driver earnings")
                
                notification = Notification(
                    user_id=transaction.user_id,
                    message=f'Withdrawal failed: {result_desc}. KES {transaction.amount:.2f} refunded to your wallet.'
                )
                db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200
        
    except Exception as e:
        print(f"B2C callback error: {str(e)}")
        return jsonify({'ResultCode': 1, 'ResultDesc': str(e)}), 500

@app.route('/api/mpesa/b2c-timeout', methods=['POST'])
def b2c_timeout_callback():
    """Handle M-Pesa B2C payment timeout"""
    try:
        data = request.get_json()
        print(f"B2C Timeout Callback: {data}")
        
        result = data.get('Result', {})
        conversation_id = result.get('ConversationID')
        
        # Find transaction
        transaction = Transaction.query.filter_by(
            checkout_request_id=conversation_id
        ).first()
        
        if transaction and transaction.status == 'pending':
            print(f"B2C withdrawal timed out for transaction: {transaction.transaction_id}")
            transaction.status = 'failed'
            
            # Refund the driver
            driver = Driver.query.filter_by(user_id=transaction.user_id).first()
            if driver:
                driver.earnings += transaction.amount
                
                notification = Notification(
                    user_id=transaction.user_id,
                    message=f'Withdrawal request timed out. KES {transaction.amount:.2f} refunded to your wallet.'
                )
                db.session.add(notification)
            
            db.session.commit()
        
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Timeout processed'}), 200
        
    except Exception as e:
        print(f"B2C timeout error: {str(e)}")
        return jsonify({'ResultCode': 1, 'ResultDesc': str(e)}), 500

@app.route('/api/mpesa/check-status/<transaction_id>', methods=['GET'])
def check_mpesa_status(transaction_id):
    """Check the status of an M-Pesa transaction using Daraja API"""
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # If status is already final (completed or failed), return immediately without querying M-Pesa
    if transaction.status in ['completed', 'failed']:
        return jsonify({
            'transaction_id': transaction.transaction_id,
            'amount': transaction.amount,
            'status': transaction.status,
            'type': transaction.type,
            'created_at': transaction.created_at,
            'mpesa_receipt_number': transaction.mpesa_receipt_number
        }), 200
    
    # If we have a checkout request ID and status is still pending, query M-Pesa for the latest status
    if transaction.checkout_request_id and transaction.status == 'pending':
        try:
            access_token = get_mpesa_access_token()
            
            if not access_token:
                # Return current status if can't get access token
                return jsonify({
                    'transaction_id': transaction.transaction_id,
                    'amount': transaction.amount,
                    'status': transaction.status,
                    'type': transaction.type,
                    'created_at': transaction.created_at
                }), 200
            
            # Generate password and timestamp
            password, timestamp = generate_password_and_timestamp()
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            payload = {
                'BusinessShortCode': MPESA_BUSINESS_SHORT_CODE,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': transaction.checkout_request_id
            }
            
            # Use shorter timeout for faster response
            response = requests.post(
                f'{MPESA_API_BASE}/mpesa/stkpushquery/v1/query',
                json=payload,
                headers=headers,
                timeout=5  # Reduced from 10 to 5 seconds
            )
            
            if response.status_code == 200:
                status_data = response.json()
                result_code = status_data.get('ResultCode')
                
                # Update transaction status based on M-Pesa response
                if result_code == '0':
                    if transaction.status != 'completed':
                        transaction.status = 'completed'
                        print(f"[CHECK-STATUS] Transaction {transaction_id} marked as completed")
                        
                        # Update user balance for deposits
                        if transaction.type == 'deposit':
                            user = User.query.get(transaction.user_id)
                            if user:
                                user.balance += transaction.amount
                                print(f"[CHECK-STATUS] User {user.id} balance updated: +{transaction.amount}")
                        
                        # Handle booking payments
                        elif transaction.type == 'booking_payment' and transaction.booking_id:
                            booking = Booking.query.get(transaction.booking_id)
                            if booking and booking.status == 'pending_payment':
                                booking.status = 'pending'
                                print(f"[CHECK-STATUS] Booking {booking.id} status updated to pending")
                        
                        db.session.commit()
                        
                elif result_code in ['1032', '1037', '1']:
                    # Transaction cancelled, timeout, or failed
                    transaction.status = 'failed'
                    print(f"[CHECK-STATUS] Transaction {transaction_id} marked as failed, Code: {result_code}")
                    
                    # Cancel booking if applicable
                    if transaction.type == 'booking_payment' and transaction.booking_id:
                        booking = Booking.query.get(transaction.booking_id)
                        if booking:
                            booking.status = 'cancelled'
                            print(f"[CHECK-STATUS] Booking {booking.id} cancelled")
                    
                    db.session.commit()
                    
        except requests.Timeout:
            print(f"[CHECK-STATUS] Timeout querying M-Pesa for transaction {transaction_id}")
            # Return current status on timeout
        except Exception as e:
            print(f"[CHECK-STATUS] Error checking status for {transaction_id}: {str(e)}")
    
    return jsonify({
        'transaction_id': transaction.transaction_id,
        'amount': transaction.amount,
        'status': transaction.status,
        'type': transaction.type,
        'created_at': transaction.created_at,
        'mpesa_receipt_number': transaction.mpesa_receipt_number
    }), 200

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone': user.phone,
        'balance': user.balance,
        'role': user.role
    })
@app.route('/api/user/payment-history/<int:user_id>', methods=['GET'])
def payment_history(user_id):
    """Get all payment transactions for a specific user"""
    # First check if user exists
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get all transactions for this user
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).all()
    
    payments = [{
        'id': transaction.id,
        'transaction_id': transaction.transaction_id,
        'type': transaction.type,
        'amount': transaction.amount,
        'status': transaction.status,
        'created_at': transaction.created_at.isoformat() if transaction.created_at else None,
        'phone_number': transaction.phone_number,
        'mpesa_receipt_number': transaction.mpesa_receipt_number,
        'booking_id': transaction.booking_id
    } for transaction in transactions]
    
    print(f"[PAYMENT HISTORY] User {user_id} has {len(payments)} transactions")
    return jsonify({'payments': payments})

# Order History
@app.route('/api/user/order-history/<int:user_id>', methods=['GET'])
def user_order_history(user_id):
    """Get all orders for a specific user"""
    # Verify user exists
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    orders = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()
    orders_data = []
    for order in orders:
        driver = db.session.get(Driver, order.driver_id) if order.driver_id else None
        driver_user = db.session.get(User, driver.user_id) if driver else None
        orders_data.append({
            'booking_id': order.id,
            'driver_id': order.driver_id,
            'driver_name': driver_user.name if driver_user else 'N/A',
            'driver_phone': driver_user.phone if driver_user else 'N/A',
            'vehicle_type': driver.vehicle_type if driver else 'N/A',
            'license_plate': driver.license_plate if driver else 'N/A',
            'is_verified': driver.is_verified if driver else False,
            'pickup_location': order.pickup_location,
            'dropoff_location': order.dropoff_location,
            'price': order.price,
            'distance': order.distance,
            'status': order.status,
            'created_at': order.created_at.isoformat() if order.created_at else None
        })
    
    print(f"[ORDER HISTORY] User {user_id} has {len(orders_data)} orders")
    return jsonify({'orders': orders_data})

@app.route('/api/driver/order-history/<int:driver_id>', methods=['GET'])
def driver_order_history(driver_id):
    """Get all orders for a specific driver (accepted, completed, cancelled)"""
    # Verify driver exists
    driver = db.session.get(Driver, driver_id)
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    
    orders = Booking.query.filter_by(driver_id=driver_id).order_by(Booking.created_at.desc()).all()
    orders_data = [{
        'booking_id': order.id,
        'user_id': order.user_id,
        'user_name': order.user.name,  # Include user name
        'user_phone': order.user.phone,  # Include customer phone
        'pickup_location': order.pickup_location,
        'dropoff_location': order.dropoff_location,
        'distance': order.distance,  # Include distance
        'price': order.price,  # Include price
        'status': order.status,
        'created_at': order.created_at.isoformat() if order.created_at else None,  # ISO format timestamp
        'payment_method': 'M-Pesa'  # Currently all payments are via M-Pesa
    } for order in orders]
    
    print(f"[ORDER HISTORY] Driver {driver_id} has {len(orders_data)} orders")
    return jsonify({'orders': orders_data})

# Ratings and Reviews
@app.route('/api/user/submit-review', methods=['POST'])
def submit_review():
    data = request.get_json()
    user_id = data.get('user_id')
    driver_id = data.get('driver_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not user_id or not driver_id or not rating:
        return jsonify({'error': 'User ID, driver ID, and rating are required'}), 400

    review = Review(
        user_id=user_id,
        driver_id=driver_id,
        rating=rating,
        comment=comment
    )
    db.session.add(review)
    db.session.commit()

    # Update driver's average rating (recalculate based on all reviews)
    driver = Driver.query.get_or_404(driver_id)
    all_reviews = Review.query.filter_by(driver_id=driver_id).all()
    if all_reviews:
        total_rating = sum(r.rating for r in all_reviews)
        driver.ratings = total_rating / len(all_reviews)
        db.session.commit()

    return jsonify({'message': 'Review submitted successfully!'})

# Support Tickets
@app.route('/api/user/submit-support-ticket', methods=['POST'])
def submit_support_ticket():
    data = request.get_json()
    user_id = data.get('user_id')
    subject = data.get('subject')
    message = data.get('message')

    if not user_id or not subject or not message:
        return jsonify({'error': 'User ID, subject, and message are required'}), 400

    ticket = SupportTicket(
        user_id=user_id,
        subject=subject,
        message=message
    )
    db.session.add(ticket)
    db.session.commit()

    # Notify admin
    admin = User.query.filter_by(role='admin').first()
    if admin:
        notification = Notification(
            user_id=admin.id,
            message=f'New support ticket from User {user_id}.'
        )
        db.session.add(notification)
        db.session.commit()

    return jsonify({'message': 'Support ticket submitted successfully!'})

@app.route('/api/admin/reply-support-ticket/<int:ticket_id>', methods=['POST'])
def reply_support_ticket(ticket_id):
    data = request.get_json()
    admin_reply = data.get('admin_reply')

    if not admin_reply:
        return jsonify({'error': 'Admin reply is required'}), 400

    ticket = SupportTicket.query.get_or_404(ticket_id)
    ticket.admin_reply = admin_reply
    ticket.status = 'resolved'
    db.session.commit()

    # Notify user
    notification = Notification(
        user_id=ticket.user_id,
        message=f'Admin has replied to your support ticket: {admin_reply}.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Support ticket resolved successfully!'})

@app.route('/api/user/transaction-status/<transaction_id>', methods=['GET'])
def check_transaction_status(transaction_id):
    """Check transaction status - simplified version for backward compatibility"""
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    return jsonify({
        'status': transaction.status,
        'amount': transaction.amount,
        'type': transaction.type,
        'mpesa_receipt_number': transaction.mpesa_receipt_number
    })

# GET all support tickets for a specific user
@app.route('/api/user/support-tickets', methods=['GET'])
def get_user_support_tickets():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    tickets = SupportTicket.query.filter_by(user_id=user_id).order_by(SupportTicket.created_at.desc()).all()
    tickets_data = [{
        'id': ticket.id,
        'user_id': ticket.user_id,
        'subject': ticket.subject,
        'message': ticket.message,
        'status': ticket.status,
        'created_at': ticket.created_at,
        'admin_reply': ticket.admin_reply
    } for ticket in tickets]
    
    return jsonify({'tickets': tickets_data})

# GET all support tickets (admin only)
@app.route('/api/admin/support-tickets', methods=['GET'])
def get_all_support_tickets():
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    
    tickets_data = []
    for ticket in tickets:
        user = User.query.get(ticket.user_id)
        ticket_data = {
            'id': ticket.id,
            'user_id': ticket.user_id,
            'user_name': user.name if user else f"User {ticket.user_id}",
            'user_email': user.email if user else "Unknown",
            'subject': ticket.subject,
            'message': ticket.message,
            'status': ticket.status,
            'created_at': ticket.created_at,
            'admin_reply': ticket.admin_reply
        }
        tickets_data.append(ticket_data)
    
    return jsonify({'tickets': tickets_data})

# Alternative endpoint to get all tickets directly from the database (fallback)
@app.route('/api/admin/all-support-tickets', methods=['GET'])
def get_all_tickets_direct():
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    tickets_data = [{
        'id': ticket.id,
        'user_id': ticket.user_id,
        'subject': ticket.subject,
        'message': ticket.message,
        'status': ticket.status,
        'created_at': ticket.created_at,
        'admin_reply': ticket.admin_reply
    } for ticket in tickets]
    
    return jsonify({'tickets': tickets_data})
# Escrow Management
@app.route('/api/admin/escrow', methods=['GET'])
def escrow_management():
    """Admin views all escrow records with detailed status"""
    escrows = Escrow.query.order_by(Escrow.created_at.desc()).all()
    
    escrow_data = []
    for escrow in escrows:
        booking = Booking.query.get(escrow.booking_id)
        user = User.query.get(escrow.user_id)
        driver = Driver.query.get(escrow.driver_id)
        driver_user = User.query.get(driver.user_id) if driver else None
        
        escrow_data.append({
            'escrow_id': escrow.id,
            'booking_id': escrow.booking_id,
            'user_name': user.name if user else 'Unknown',
            'user_email': user.email if user else 'Unknown',
            'driver_name': driver_user.name if driver_user else 'Unknown',
            'driver_email': driver_user.email if driver_user else 'Unknown',
            'total_amount': escrow.amount,
            'platform_fee': escrow.platform_fee,
            'driver_amount': escrow.driver_amount,
            'status': escrow.status,
            'booking_status': booking.status if booking else 'Unknown',
            'created_at': escrow.created_at,
            'released_at': escrow.released_at,
            'refunded_at': escrow.refunded_at
        })
    
    # Calculate summary statistics
    total_held = sum(e.amount for e in escrows if e.status == 'held')
    total_released = sum(e.driver_amount for e in escrows if e.status == 'released')
    total_refunded = sum(e.amount for e in escrows if e.status == 'refunded')
    total_platform_fees = sum(e.platform_fee for e in escrows if e.status == 'released')
    
    return jsonify({
        'escrows': escrow_data,
        'summary': {
            'total_held': total_held,
            'total_released': total_released,
            'total_refunded': total_refunded,
            'total_platform_fees': total_platform_fees,
            'held_count': len([e for e in escrows if e.status == 'held']),
            'released_count': len([e for e in escrows if e.status == 'released']),
            'refunded_count': len([e for e in escrows if e.status == 'refunded'])
        }
    })

@app.route('/api/admin/escrow/<int:escrow_id>', methods=['GET'])
def get_escrow_details(escrow_id):
    """Admin views detailed information about a specific escrow"""
    escrow = Escrow.query.get_or_404(escrow_id)
    booking = Booking.query.get(escrow.booking_id)
    user = User.query.get(escrow.user_id)
    driver = Driver.query.get(escrow.driver_id)
    driver_user = User.query.get(driver.user_id) if driver else None
    
    return jsonify({
        'escrow_id': escrow.id,
        'booking_id': escrow.booking_id,
        'booking_details': {
            'pickup_location': booking.pickup_location if booking else None,
            'dropoff_location': booking.dropoff_location if booking else None,
            'distance': booking.distance if booking else None,
            'status': booking.status if booking else None
        },
        'user': {
            'id': user.id if user else None,
            'name': user.name if user else 'Unknown',
            'email': user.email if user else 'Unknown',
            'phone': user.phone if user else 'Unknown'
        },
        'driver': {
            'id': driver.id if driver else None,
            'name': driver_user.name if driver_user else 'Unknown',
            'email': driver_user.email if driver_user else 'Unknown',
            'phone': driver_user.phone if driver_user else 'Unknown',
            'vehicle_type': driver.vehicle_type if driver else None
        },
        'amounts': {
            'total': escrow.amount,
            'platform_fee': escrow.platform_fee,
            'driver_amount': escrow.driver_amount
        },
        'status': escrow.status,
        'timestamps': {
            'created_at': escrow.created_at,
            'released_at': escrow.released_at,
            'refunded_at': escrow.refunded_at
        }
    })

@app.route('/api/user/escrow-status/<int:booking_id>', methods=['GET'])
def user_check_escrow_status(booking_id):
    """User checks escrow status for their booking"""
    booking = Booking.query.get_or_404(booking_id)
    escrow = Escrow.query.filter_by(booking_id=booking_id).first()
    
    if not escrow:
        return jsonify({'error': 'Escrow record not found'}), 404
    
    return jsonify({
        'booking_id': booking.id,
        'booking_status': booking.status,
        'escrow_status': escrow.status,
        'amount_held': escrow.amount,
        'created_at': escrow.created_at,
        'message': {
            'held': 'Your payment is safely held in escrow until service completion.',
            'released': 'Payment has been released to the driver after service completion.',
            'refunded': 'Your payment has been refunded to your wallet.',
            'cancelled': 'This booking was cancelled.'
        }.get(escrow.status, 'Status unknown')
    })

@app.route('/api/driver/escrow-earnings/<int:driver_id>', methods=['GET'])
def driver_check_escrow_earnings(driver_id):
    """Driver checks their pending escrow earnings (not yet released)"""
    driver = Driver.query.get_or_404(driver_id)
    
    # Get all held escrow for this driver
    held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
    
    pending_earnings = sum(e.driver_amount for e in held_escrows)
    
    escrow_details = [{
        'booking_id': e.booking_id,
        'amount': e.driver_amount,
        'created_at': e.created_at,
        'status': Booking.query.get(e.booking_id).status if Booking.query.get(e.booking_id) else 'unknown'
    } for e in held_escrows]
    
    return jsonify({
        'driver_id': driver_id,
        'current_earnings': driver.earnings,
        'pending_in_escrow': pending_earnings,
        'total_potential': driver.earnings + pending_earnings,
        'held_bookings': escrow_details,
        'message': 'Complete your accepted orders to release these funds to your earnings.'
    })

# Live Tracking
@app.route('/api/driver/update-location', methods=['POST'])
def update_driver_location():
    data = request.get_json()
    driver_id = data.get('driver_id')
    live_location = data.get('live_location')  # Latitude, Longitude

    if not driver_id or not live_location:
        return jsonify({'error': 'Driver ID and live location are required'}), 400

    driver = Driver.query.get_or_404(driver_id)
    driver.live_location = live_location
    db.session.commit()

    return jsonify({'message': 'Driver location updated successfully!'})

@app.route('/api/user/track-driver/<int:booking_id>', methods=['GET'])
def track_driver(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    driver = Driver.query.get_or_404(booking.driver_id)

    if not driver.live_location:
        return jsonify({'error': 'Driver location not available'}), 404

    return jsonify({
        'booking_id': booking.id,
        'driver_id': driver.id,
        'driver_name': driver.user.name,
        'driver_phone': driver.user.phone_number,
        'vehicle_type': driver.vehicle_type,
        'vehicle_color': driver.vehicle_color or 'N/A',
        'license_plate': driver.license_plate,
        'is_verified': driver.is_verified,
        'live_location': driver.live_location,
        'pickup_location': booking.pickup_location,
        'dropoff_location': booking.dropoff_location,
        'status': booking.status
    })

# Notifications
@app.route('/api/user/notifications/<int:user_id>', methods=['GET'])
def user_notifications(user_id):
    notifications = Notification.query.filter_by(user_id=user_id).all()
    notifications_data = [{
        'id': notification.id,
        'message': notification.message,
        'is_read': notification.is_read,
        'created_at': notification.created_at
    } for notification in notifications]
    return jsonify({'notifications': notifications_data})

@app.route('/api/driver/notifications/<int:driver_id>', methods=['GET'])
def driver_notifications(driver_id):
    notifications = Notification.query.filter_by(driver_id=driver_id).all()
    notifications_data = [{
        'id': notification.id,
        'message': notification.message,
        'is_read': notification.is_read,
        'created_at': notification.created_at
    } for notification in notifications]
    return jsonify({'notifications': notifications_data})

@app.route('/api/notifications/mark-read/<int:notification_id>', methods=['POST'])
def mark_notification_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read!'})

# Admin Payment Statistics - Real M-Pesa Data
@app.route('/api/admin/payments-summary', methods=['GET'])
def admin_payments_summary():
    """Get real payment statistics from completed M-Pesa transactions"""
    try:
        # Get all completed booking payments (real M-Pesa transactions)
        completed_payments = Transaction.query.filter_by(
            type='booking_payment',
            status='completed'
        ).order_by(Transaction.created_at.desc()).all()
        
        # Calculate total amount paid via M-Pesa
        total_paid = sum(payment.amount for payment in completed_payments)
        
        # Calculate platform fees (10% of each payment)
        platform_fee_percentage = 10
        total_platform_fees = sum(payment.amount * (platform_fee_percentage / 100) for payment in completed_payments)
        
        # Get recent payments with user and booking details
        recent_payments = []
        for payment in completed_payments[:10]:  # Last 10 payments
            user = User.query.get(payment.user_id)
            booking = Booking.query.get(payment.booking_id) if payment.booking_id else None
            driver = Driver.query.get(booking.driver_id) if booking else None
            driver_user = User.query.get(driver.user_id) if driver else None
            
            recent_payments.append({
                'transaction_id': payment.transaction_id,
                'mpesa_receipt': payment.mpesa_receipt_number,
                'amount': payment.amount,
                'user_name': user.name if user else 'Unknown',
                'driver_name': driver_user.name if driver_user else 'Unknown',
                'driver_verified': driver.is_verified if driver else False,
                'booking_id': payment.booking_id,
                'phone_number': payment.phone_number,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
                'status': payment.status
            })
        
        # Get booking statistics
        all_bookings = Booking.query.all()
        completed_bookings = [b for b in all_bookings if b.status == 'completed']
        pending_bookings = [b for b in all_bookings if b.status in ['pending', 'accepted']]
        
        return jsonify({
            'total_payments': len(completed_payments),
            'total_amount_paid': total_paid,
            'total_platform_revenue': total_platform_fees,
            'total_bookings': len(all_bookings),
            'completed_bookings': len(completed_bookings),
            'pending_bookings': len(pending_bookings),
            'recent_payments': recent_payments,
            'message': f'{len(completed_payments)} real M-Pesa payments totaling KES {total_paid:.2f}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Debug endpoint - Remove in production  
@app.route('/api/debug/system-status', methods=['GET'])
def debug_system_status():
    """Debug endpoint to check system state"""
    try:
        all_users = User.query.all()
        all_drivers = Driver.query.all()
        all_bookings = Booking.query.all()
        
        return jsonify({
            'total_users': len(all_users),
            'total_drivers': len(all_drivers),
            'verified_drivers': len([d for d in all_drivers if d.is_verified]),
            'available_drivers': len([d for d in all_drivers if d.is_available]),
            'total_bookings': len(all_bookings),
            'pending_bookings': len([b for b in all_bookings if b.status == 'pending']),
            'drivers': [{
                'id': d.id,
                'name': d.user.name,
                'verified': d.is_verified,
                'available': d.is_available,
                'vehicle': d.vehicle_type
            } for d in all_drivers],
            'bookings': [{
                'id': b.id,
                'user': b.user.name,
                'driver_id': b.driver_id,
                'status': b.status,
                'price': b.price,
                'created': b.created_at.isoformat() if b.created_at else None
            } for b in all_bookings[-10:]]  # Last 10 bookings
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Promo Codes and Discounts
@app.route('/api/admin/create-promo-code', methods=['POST'])
def create_promo_code():
    data = request.get_json()
    code = data.get('code')
    discount = data.get('discount')

    if not code or not discount:
        return jsonify({'error': 'Code and discount are required'}), 400

    promo = PromoCode(
        code=code,
        discount=discount
    )
    db.session.add(promo)
    db.session.commit()

    return jsonify({'message': 'Promo code created successfully!'})

@app.route('/api/admin/disable-promo-code/<int:promo_id>', methods=['POST'])
def disable_promo_code(promo_id):
    promo = PromoCode.query.get_or_404(promo_id)
    promo.is_active = False
    db.session.commit()
    return jsonify({'message': 'Promo code disabled successfully!'})

@app.route('/api/user/apply-promo-code', methods=['POST'])
def apply_promo_code():
    data = request.get_json()
    promo_code = data.get('promo_code')
    booking_id = data.get('booking_id')

    if not promo_code or not booking_id:
        return jsonify({'error': 'Promo code and booking ID are required'}), 400

    promo = PromoCode.query.filter_by(code=promo_code, is_active=True).first()
    if not promo:
        return jsonify({'error': 'Invalid or inactive promo code'}), 400

    booking = Booking.query.get_or_404(booking_id)
    booking.price = booking.price * (1 - promo.discount / 100)
    booking.promo_code = promo_code
    db.session.commit()

    return jsonify({'message': 'Promo code applied successfully!', 'new_price': booking.price})

# Order Cancellation
@app.route('/api/user/cancel-order/<int:booking_id>', methods=['POST'])
def user_cancel_order(booking_id):
    """User cancels order and gets refund from escrow"""
    booking = Booking.query.get_or_404(booking_id)
    if booking.status != 'pending':
        return jsonify({'error': 'Only pending orders can be cancelled'}), 400

    # Get escrow record
    escrow = Escrow.query.filter_by(booking_id=booking.id).first()
    if escrow and escrow.status == 'held':
        # Refund user from escrow
        user = User.query.get(booking.user_id)
        user.balance += escrow.amount
        escrow.status = 'refunded'
        escrow.refunded_at = datetime.utcnow()
        
        # Create refund transaction record
        refund_transaction = Transaction(
            user_id=user.id,
            transaction_id=f'REFUND-{uuid.uuid4().hex[:8].upper()}',
            amount=escrow.amount,
            type='refund',
            status='completed'
        )
        db.session.add(refund_transaction)

    booking.status = 'cancelled'
    db.session.commit()

    # Notify driver
    notification = Notification(
        driver_id=booking.driver_id,
        message=f'User has cancelled booking #{booking.id}. Escrow funds refunded to user.'
    )
    db.session.add(notification)
    
    # Notify user
    user_notification = Notification(
        user_id=booking.user_id,
        message=f'Booking cancelled successfully. KES {escrow.amount:.2f} refunded to your wallet.'
    )
    db.session.add(user_notification)
    db.session.commit()

    return jsonify({
        'message': 'Order cancelled successfully! Funds refunded from escrow.',
        'refund_amount': escrow.amount if escrow else 0,
        'new_balance': user.balance
    })

@app.route('/api/driver/cancel-order/<int:booking_id>', methods=['POST'])
def driver_cancel_order(booking_id):
    """Driver cancels accepted order, funds refunded to user from escrow"""
    booking = Booking.query.get_or_404(booking_id)
    if booking.status != 'accepted':
        return jsonify({'error': 'Only accepted orders can be cancelled by drivers'}), 400

    # Get escrow record and refund user
    escrow = Escrow.query.filter_by(booking_id=booking.id).first()
    if escrow and escrow.status == 'held':
        user = User.query.get(booking.user_id)
        user.balance += escrow.amount
        escrow.status = 'refunded'
        escrow.refunded_at = datetime.utcnow()
        
        # Create refund transaction record
        refund_transaction = Transaction(
            user_id=user.id,
            transaction_id=f'REFUND-{uuid.uuid4().hex[:8].upper()}',
            amount=escrow.amount,
            type='refund',
            status='completed'
        )
        db.session.add(refund_transaction)

    booking.status = 'cancelled'
    db.session.commit()

    # Notify user
    notification = Notification(
        user_id=booking.user_id,
        message=f'Driver has cancelled your booking #{booking.id}. KES {escrow.amount:.2f} has been refunded to your wallet.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({
        'message': 'Order cancelled successfully! User refunded from escrow.',
        'refund_amount': escrow.amount if escrow else 0
    })

# Driver Availability Toggle
@app.route('/api/driver/toggle-availability', methods=['POST'])
def toggle_availability():
    data = request.get_json()
    driver_id = data.get('driver_id')
    is_available = data.get('is_available')

    if not driver_id or is_available is None:
        return jsonify({'error': 'Driver ID and availability status are required'}), 400

    driver = Driver.query.get_or_404(driver_id)
    driver.is_available = is_available
    db.session.commit()

    return jsonify({'message': 'Availability updated successfully!', 'is_available': driver.is_available})

# Driver Wallet & Withdrawals
@app.route('/api/driver/by-user/<int:user_id>', methods=['GET'])
def get_driver_by_user_id(user_id):
    """Get driver_id from user_id - fallback endpoint"""
    try:
        user = User.query.get_or_404(user_id)
        if user.role != 'driver':
            return jsonify({'error': 'User is not a driver'}), 400
        
        driver = Driver.query.filter_by(user_id=user_id).first()
        if not driver:
            return jsonify({'error': 'Driver profile not found'}), 404
        
        return jsonify({
            'driver_id': driver.id,
            'user_id': user_id,
            'name': user.name,
            'vehicle_type': driver.vehicle_type,
            'is_verified': driver.is_verified
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/driver/<int:driver_id>/earnings', methods=['GET'])
def get_driver_earnings(driver_id):
    """Get driver's current earnings, pending escrow, and withdrawal history"""
    try:
        driver = Driver.query.get(driver_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        # Get withdrawal history
        withdrawals = Transaction.query.filter_by(
            user_id=driver.user_id,
            type='withdrawal'
        ).order_by(Transaction.created_at.desc()).all()
        
        withdrawal_data = [{
            'transaction_id': w.transaction_id,
            'amount': w.amount,
            'status': w.status,
            'mpesa_receipt_number': w.mpesa_receipt_number,
            'created_at': w.created_at
        } for w in withdrawals]
        
        # Get pending escrow amounts (funds not yet released)
        held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
        pending_escrow = sum(e.driver_amount for e in held_escrows)
        
        # Get released escrow history
        released_escrows = Escrow.query.filter_by(driver_id=driver_id, status='released').order_by(Escrow.released_at.desc()).limit(10).all()
        escrow_history = [{
            'booking_id': e.booking_id,
            'amount': e.driver_amount,
            'platform_fee': e.platform_fee,
            'released_at': e.released_at
        } for e in released_escrows]
        
        return jsonify({
            'driver_id': driver.id,
            'available_earnings': driver.earnings,
            'pending_in_escrow': pending_escrow,
            'total_potential_earnings': driver.earnings + pending_escrow,
            'completed_orders': driver.completed_orders,
            'pending_orders': len(held_escrows),
            'ratings': driver.ratings,
            'withdrawals': withdrawal_data,
            'recent_escrow_releases': escrow_history,
            'message': f'{len(held_escrows)} booking(s) pending completion. Complete services to release KES {pending_escrow:.2f}'
        })
    except Exception as e:
        print(f"Error fetching driver earnings: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/driver/withdraw', methods=['POST'])
def driver_withdraw():
    """Driver withdraws available earnings to M-Pesa (only released escrow funds)"""
    try:
        data = request.get_json()
        driver_id = data.get('driver_id')
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        
        if not driver_id or not amount or not phone_number:
            return jsonify({'error': 'Driver ID, amount, and phone number are required'}), 400
        
        driver = db.session.get(Driver, driver_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'error': 'Amount must be greater than 0'}), 400
            if amount < 20:
                return jsonify({'error': 'Minimum withdrawal amount is KES 20'}), 400
            if amount > 50000:
                return jsonify({'error': 'Maximum withdrawal amount is KES 50,000 per transaction'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Check if driver has sufficient available earnings (not pending in escrow)
        if driver.earnings < amount:
            # Get pending escrow to show helpful message
            held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
            pending_escrow = sum(e.driver_amount for e in held_escrows)
            
            return jsonify({
                'error': 'Insufficient available earnings',
                'available_now': driver.earnings,
                'pending_in_escrow': pending_escrow,
                'requested': amount,
                'message': f'You have KES {pending_escrow:.2f} pending in escrow. Complete your active orders to release these funds.'
            }), 400
        
        # Validate and format phone number
        phone_number = str(phone_number).replace('+', '').replace(' ', '').replace('-', '')
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        # Validate phone number format
        if not phone_number.isdigit() or len(phone_number) != 12:
            return jsonify({'error': 'Invalid phone number format. Use format: 0712345678'}), 400
        
        # Generate transaction ID
        transaction_id = f'WTH-{uuid.uuid4().hex[:8].upper()}'
        
        # Create withdrawal transaction
        transaction = Transaction(
            user_id=driver.user_id,
            transaction_id=transaction_id,
            amount=amount,
            phone_number=phone_number,
            type='withdrawal',
            status='pending'
        )
        db.session.add(transaction)
        
        # Deduct from driver earnings immediately (will be refunded if withdrawal fails)
        driver.earnings -= amount
        db.session.commit()
        
        # In sandbox mode, always simulate withdrawals (B2C requires special permissions)
        if MPESA_ENVIRONMENT == 'sandbox':
            print(f"[SANDBOX] Simulating withdrawal of KES {amount} for faster testing")
            transaction.status = 'completed'
            transaction.mpesa_receipt_number = f'SIM-WTH-{uuid.uuid4().hex[:10].upper()}'
            db.session.commit()
            
            # Notify driver
            notification = Notification(
                user_id=driver.user_id,
                message=f'Withdrawal successful! KES {amount:.2f} sent to {phone_number[-10:]}'
            )
            db.session.add(notification)
            db.session.commit()
            
            # Get updated pending escrow
            held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
            pending_escrow = sum(e.driver_amount for e in held_escrows)
            
            return jsonify({
                'success': True,
                'message': f'✅ Withdrawal of KES {amount:.2f} processed successfully!',
                'transaction_id': transaction_id,
                'remaining_earnings': driver.earnings,
                'pending_in_escrow': pending_escrow,
                'phone_number': phone_number,
                'simulated': True
            }), 200
        
        # Production mode - attempt real B2C
        use_real_api = MPESA_SECURITY_CREDENTIAL and len(MPESA_SECURITY_CREDENTIAL) > 10
        
        try:
            if use_real_api:
                # Real M-Pesa B2C API call
                print(f"[PRODUCTION] Initiating real M-Pesa B2C withdrawal for KES {amount}")
                b2c_result = initiate_b2c_payment(
                    phone_number=phone_number,
                    amount=amount,
                    transaction_id=transaction_id,
                    remarks=f'Withdrawal for driver {driver.user_id}'
                )
                
                if b2c_result['success']:
                    # B2C initiated successfully - status remains pending until callback
                    transaction.checkout_request_id = b2c_result.get('conversation_id')
                    transaction.merchant_request_id = b2c_result.get('originator_conversation_id')
                    db.session.commit()
                    
                    # Notify driver
                    notification = Notification(
                        user_id=driver.user_id,
                        message=f'Withdrawal request of KES {amount:.2f} is being processed. You will receive the money shortly.'
                    )
                    db.session.add(notification)
                    db.session.commit()
                    
                    # Get updated pending escrow
                    held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
                    pending_escrow = sum(e.driver_amount for e in held_escrows)
                    
                    return jsonify({
                        'success': True,
                        'message': f'✅ Withdrawal initiated! KES {amount:.2f} will be sent to {phone_number} shortly',
                        'transaction_id': transaction_id,
                        'status': 'pending',
                        'remaining_earnings': driver.earnings,
                        'pending_in_escrow': pending_escrow
                    }), 200
                else:
                    # B2C failed - refund earnings
                    transaction.status = 'failed'
                    driver.earnings += amount
                    db.session.commit()
                    
                    return jsonify({
                        'success': False,
                        'error': b2c_result['error'],
                        'transaction_id': transaction_id
                    }), 400
            else:
                # Simulate successful withdrawal for development
                print(f"Simulating withdrawal of KES {amount} (No B2C credentials configured)")
                transaction.status = 'completed'
                transaction.mpesa_receipt_number = f'SIM-WTH-{uuid.uuid4().hex[:10].upper()}'
                db.session.commit()
                
                # Notify driver
                notification = Notification(
                    user_id=driver.user_id,
                    message=f'[SIMULATED] Withdrawal successful! KES {amount:.2f} sent to {phone_number[-10:]}'
                )
                db.session.add(notification)
                db.session.commit()
                
                # Get updated pending escrow
                held_escrows = Escrow.query.filter_by(driver_id=driver_id, status='held').all()
                pending_escrow = sum(e.driver_amount for e in held_escrows)
                
                return jsonify({
                    'success': True,
                    'message': f'Withdrawal of KES {amount:.2f} processed successfully',
                    'transaction_id': transaction_id,
                    'remaining_earnings': driver.earnings,
                    'pending_in_escrow': pending_escrow,
                    'phone_number': phone_number,
                    'simulated': True
                }), 200
            
        except Exception as e:
            # Refund earnings if withdrawal fails
            transaction.status = 'failed'
            driver.earnings += amount
            db.session.commit()
            
            print(f"Withdrawal error: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Withdrawal failed: {str(e)}',
                'transaction_id': transaction_id
            }), 500
            
    except Exception as e:
        print(f"Driver withdrawal error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Driver Verification System
@app.route('/api/driver/submit-verification/<int:driver_id>', methods=['POST'])
def submit_driver_verification():
    """Driver submits documents for verification"""
    data = request.get_json()
    driver_id = data.get('driver_id')
    
    driver = Driver.query.get_or_404(driver_id)
    
    # Update driver verification details
    driver.license_number = data.get('license_number')
    driver.license_expiry = datetime.strptime(data.get('license_expiry'), '%Y-%m-%d') if data.get('license_expiry') else None
    driver.insurance_expiry = datetime.strptime(data.get('insurance_expiry'), '%Y-%m-%d') if data.get('insurance_expiry') else None
    
    driver.drivers_license_url = data.get('drivers_license_url')
    driver.vehicle_registration_url = data.get('vehicle_registration_url')
    driver.insurance_certificate_url = data.get('insurance_certificate_url')
    driver.vehicle_photo_url = data.get('vehicle_photo_url')
    driver.profile_photo_url = data.get('profile_photo_url')
    
    driver.verification_status = 'under_review'
    driver.submitted_at = datetime.utcnow()
    driver.rejection_reason = None
    
    db.session.commit()
    
    # Notify admin
    admin = User.query.filter_by(role='admin').first()
    if admin:
        notification = Notification(
            user_id=admin.id,
            message=f'Driver {driver.user.name} has submitted verification documents.'
        )
        db.session.add(notification)
        db.session.commit()
    
    return jsonify({'message': 'Verification documents submitted successfully!', 'status': 'under_review'})

@app.route('/api/driver/verification-status/<int:driver_id>', methods=['GET'])
def get_driver_verification_status(driver_id):
    """Get driver verification status"""
    driver = Driver.query.get_or_404(driver_id)
    
    return jsonify({
        'driver_id': driver.id,
        'is_verified': driver.is_verified,
        'verification_status': driver.verification_status,
        'rejection_reason': driver.rejection_reason,
        'submitted_at': driver.submitted_at,
        'verified_at': driver.verified_at,
        'license_number': driver.license_number,
        'license_expiry': driver.license_expiry,
        'insurance_expiry': driver.insurance_expiry,
        'documents': {
            'drivers_license':driver.drivers_license_url,
            'vehicle_registration': driver.vehicle_registration_url,
            'insurance_certificate': driver.insurance_certificate_url,
            'vehicle_photo': driver.vehicle_photo_url,
            'profile_photo': driver.profile_photo_url
        }
    })

@app.route('/api/admin/pending-verifications', methods=['GET'])
def get_pending_verifications():
    """Admin gets all pending driver verifications - OPTIMIZED with JOIN"""
    # Use JOIN to get all data in one query (eliminates N+1 problem)
    results = db.session.query(Driver, User).join(
        User, Driver.user_id == User.id
    ).filter(
        Driver.verification_status.in_(['pending', 'under_review'])
    ).all()
    
    drivers_data = []
    for driver, user in results:
        drivers_data.append({
            'driver_id': driver.id,
            'user_id': driver.user_id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'vehicle_type': driver.vehicle_type,
            'license_plate': driver.license_plate,
            'license_number': driver.license_number,
            'license_expiry': driver.license_expiry,
            'insurance_expiry': driver.insurance_expiry,
            'submitted_at': driver.submitted_at,
            'documents': {
                'drivers_license': driver.drivers_license_url,
                'vehicle_registration': driver.vehicle_registration_url,
                'insurance_certificate': driver.insurance_certificate_url,
                'vehicle_photo': driver.vehicle_photo_url,
                'profile_photo': driver.profile_photo_url
            }
        })
    
    return jsonify({'pending_verifications': drivers_data})

@app.route('/api/admin/verify-driver/<int:driver_id>', methods=['POST'])
def verify_driver(driver_id):
    """Admin approves driver verification"""
    data = request.get_json()
    admin_id = data.get('admin_id')
    action = data.get('action')  # 'approve' or 'reject'
    rejection_reason = data.get('rejection_reason', '')
    
    driver = Driver.query.get_or_404(driver_id)
    admin = User.query.get_or_404(admin_id)
    
    if admin.role != 'admin':
        return jsonify({'error': 'Only admins can verify drivers'}), 403
    
    if action == 'approve':
        driver.is_verified = True
        driver.verification_status = 'approved'
        driver.is_available = True  # Make driver available for bookings
        driver.verified_by = admin_id
        driver.verified_at = datetime.utcnow()
        driver.rejection_reason = None
        message = f'Congratulations! Your driver account has been verified and approved. You can now accept bookings.'
    elif action == 'reject':
        driver.is_verified = False
        driver.verification_status = 'rejected'
        driver.is_available = False  # Keep driver unavailable
        driver.verified_by = admin_id
        driver.verified_at = datetime.utcnow()
        driver.rejection_reason = rejection_reason
        message = f'Your driver verification was rejected. Reason: {rejection_reason}. Please resubmit with correct documents.'
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    db.session.commit()
    
    # Notify driver
    notification = Notification(
        user_id=driver.user_id,
        message=message
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({
        'message': f'Driver verification {action}d successfully!',
        'driver_id': driver.id,
        'verification_status': driver.verification_status
    })

@app.route('/api/admin/all-drivers-verification', methods=['GET'])
def get_all_drivers_verification():
    """Get all drivers with their verification status - OPTIMIZED with JOIN"""
    # Use JOIN to get all data in one query (eliminates N+1 problem)
    drivers = db.session.query(Driver, User).join(User, Driver.user_id == User.id).all()
    
    drivers_data = []
    for driver, user in drivers:
        verifier = User.query.get(driver.verified_by) if driver.verified_by else None
        
        drivers_data.append({
            'driver_id': driver.id,
            'user_id': driver.user_id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'vehicle_type': driver.vehicle_type,
            'license_plate': driver.license_plate,
            'is_verified': driver.is_verified,
            'verification_status': driver.verification_status,
            'submitted_at': driver.submitted_at,
            'verified_at': driver.verified_at,
            'verified_by': verifier.name if verifier else None,
            'rejection_reason': driver.rejection_reason,
            'ratings': driver.ratings,
            'completed_orders': driver.completed_orders
        })
    
    return jsonify({'drivers': drivers_data})

# Run the App
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin_user()
        print("\n[SERVER] Driver verification requires admin approval")
        print("[SERVER] Only admin-verified drivers will be marked as verified\n")
        
    app.run(port=5000, debug=True)