from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime 
from dotenv import load_dotenv
import os
import requests
import uuid
app = Flask(__name__)

load_dotenv()

CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///moving_app.db'
db = SQLAlchemy(app)

INTASEND_PUBLIC_KEY = os.getenv('INTASEND_PUBLIC_KEY')
INTASEND_SECRET_KEY = os.getenv('INTASEND_SECRET_KEY')
INTASEND_API_BASE = 'https://sandbox.intasend.com/api/v1'
# Models
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    intasend_id = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # deposit, payment, withdrawal
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

    # Relationships
    bookings = db.relationship('Booking', backref='driver', lazy=True)
    reviews = db.relationship('Review', backref='driver', lazy=True)
    notifications = db.relationship('Notification', backref='driver', lazy=True)

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

# Helper Functions
def validate_user(data):
    if not data.get('name') or not data.get('phone') or not data.get('email') or not data.get('password'):
        return False
    return True

# Create Admin User
def create_admin_user():
    admin_username = 'admin'
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
            license_plate=data.get('license_plate', '')
        )
        db.session.add(driver)
        db.session.commit()

    return jsonify({'message': 'Registration successful!', 'user_id': user.id})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        return jsonify({
            'message': 'Login successful!',
            'user_id': user.id,
            'role': user.role
        })
    return jsonify({'error': 'Invalid credentials'}), 401

# User Dashboard
@app.route('/api/user/search-drivers', methods=['POST'])
def search_drivers():
    data = request.get_json()
    pickup_location = data.get('pickup_location')
    dropoff_location = data.get('dropoff_location')

    if not pickup_location or not dropoff_location:
        return jsonify({'error': 'Pickup and dropoff locations are required'}), 400

    # Simulate distance calculation (in km)
    distance = 10.5  # Replace with actual distance calculation logic
    price_per_km = 5.0  # Price per km
    price = distance * price_per_km

    drivers = Driver.query.filter_by(is_available=True).all()
    drivers_data = [{
        'driver_id': driver.id,
        'name': driver.user.name,
        'vehicle_type': driver.vehicle_type,
        'ratings': driver.ratings,
        'completed_orders': driver.completed_orders,
        'price': price
    } for driver in drivers]

    return jsonify({
        'distance': distance,
        'price': price,
        'drivers': drivers_data
    })

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

    # Apply promo code discount if valid
    if promo_code:
        promo = PromoCode.query.filter_by(code=promo_code, is_active=True).first()
        if promo:
            price = price * (1 - promo.discount / 100)

    booking = Booking(
        user_id=user_id,
        driver_id=driver_id,
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        distance=distance,
        price=price,
        promo_code=promo_code
    )
    db.session.add(booking)
    db.session.commit()

    # Notify driver
    notification = Notification(
        driver_id=driver_id,
        message=f'New booking request from User {user_id}.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Driver booked successfully!', 'booking_id': booking.id})

# Driver Dashboard
@app.route('/api/driver/available-orders', methods=['GET'])
def available_orders():
    orders = Booking.query.filter_by(status='pending').all()
    orders_data = [{
        'booking_id': order.id,
        'user_id': order.user_id,
        'pickup_location': order.pickup_location,
        'dropoff_location': order.dropoff_location,
        'distance': order.distance,
        'price': order.price
    } for order in orders]
    return jsonify({'orders': orders_data})

@app.route('/api/driver/accept-order/<int:booking_id>', methods=['POST'])
def accept_order(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    booking.status = 'accepted'
    db.session.commit()

    # Notify user
    notification = Notification(
        user_id=booking.user_id,
        message=f'Driver {booking.driver_id} has accepted your booking.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Order accepted!', 'booking_id': booking.id})

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
@app.route('/api/user/update-transaction', methods=['POST'])
def update_transaction():
    data = request.get_json()
    transaction_id = data.get('transaction_id')
    intasend_id = data.get('intasend_id')
    
    if not transaction_id or not intasend_id:
        return jsonify({'error': 'Transaction ID and IntaSend ID are required'}), 400
    
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    transaction.intasend_id = intasend_id
    db.session.commit()
    
    return jsonify({
        'message': 'Transaction updated successfully'
    })

# M-Pesa Integration via IntaSend
@app.route('/api/mpesa/stk-push', methods=['POST'])
def mpesa_stk_push():
    """Initiate M-Pesa STK Push payment"""
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    
    if not user_id or not amount or not phone_number:
        return jsonify({'error': 'User ID, amount, and phone number are required'}), 400
    
    # Validate amount
    try:
        amount = float(amount)
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
        type='deposit',
        status='pending'
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    try:
        # Make request to IntaSend API for STK Push
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {INTASEND_SECRET_KEY}'
        }
        
        payload = {
            'public_key': INTASEND_PUBLIC_KEY,
            'amount': amount,
            'phone_number': phone_number,
            'api_ref': transaction_id,
            'narrative': f'Wallet deposit for user {user.name}'
        }
        
        response = requests.post(
            f'{INTASEND_API_BASE}/payment/mpesa-stk-push/',
            json=payload,
            headers=headers,
            timeout=30
        )
        
        response_data = response.json()
        
        if response.status_code == 200 or response.status_code == 201:
            # Update transaction with IntaSend ID
            if 'id' in response_data:
                transaction.intasend_id = response_data['id']
                db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'STK Push sent. Please check your phone to complete payment.',
                'transaction_id': transaction_id,
                'intasend_data': response_data
            }), 200
        else:
            # STK Push failed
            transaction.status = 'failed'
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': response_data.get('error', 'Failed to initiate payment'),
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
    """Handle M-Pesa payment callback from IntaSend"""
    try:
        data = request.get_json()
        
        # Extract transaction details from callback
        api_ref = data.get('api_ref')  # This is our transaction_id
        status = data.get('status')  # COMPLETE, FAILED, PENDING
        intasend_id = data.get('id')
        
        if not api_ref:
            return jsonify({'error': 'api_ref is required'}), 400
        
        # Find the transaction
        transaction = Transaction.query.filter_by(transaction_id=api_ref).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Update transaction status
        if status == 'COMPLETE' or status == 'COMPLETED':
            transaction.status = 'completed'
            
            # Update user balance
            user = User.query.get(transaction.user_id)
            if user:
                user.balance += transaction.amount
                
        elif status == 'FAILED':
            transaction.status = 'failed'
        else:
            transaction.status = 'pending'
        
        # Update IntaSend ID if provided
        if intasend_id:
            transaction.intasend_id = intasend_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Callback processed successfully'
        }), 200
        
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/mpesa/check-status/<transaction_id>', methods=['GET'])
def check_mpesa_status(transaction_id):
    """Check the status of an M-Pesa transaction"""
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # If we have an IntaSend ID, we can query their API for the latest status
    if transaction.intasend_id and INTASEND_SECRET_KEY:
        try:
            headers = {
                'Authorization': f'Bearer {INTASEND_SECRET_KEY}'
            }
            
            response = requests.get(
                f'{INTASEND_API_BASE}/payment/status/?id={transaction.intasend_id}',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                status_data = response.json()
                
                # Update transaction status based on IntaSend response
                intasend_status = status_data.get('status', '').upper()
                
                if intasend_status == 'COMPLETE' or intasend_status == 'COMPLETED':
                    if transaction.status != 'completed':
                        transaction.status = 'completed'
                        
                        # Update user balance
                        user = User.query.get(transaction.user_id)
                        if user:
                            user.balance += transaction.amount
                        
                        db.session.commit()
                        
                elif intasend_status == 'FAILED':
                    transaction.status = 'failed'
                    db.session.commit()
                    
        except Exception as e:
            print(f"Error checking status: {str(e)}")
    
    return jsonify({
        'transaction_id': transaction.transaction_id,
        'amount': transaction.amount,
        'status': transaction.status,
        'type': transaction.type,
        'created_at': transaction.created_at
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
    # First check if user exists
    user = User.query.get_or_404(user_id)
    
    # Get all transactions for this user
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).all()
    
    payments = [{
        'id': transaction.id,
        'transaction_id': transaction.transaction_id,
        'type': transaction.type,
        'amount': transaction.amount,
        'status': transaction.status,
        'created_at': transaction.created_at
    } for transaction in transactions]
    
    return jsonify({
        'payments': payments
    })

# Order History
@app.route('/api/user/order-history/<int:user_id>', methods=['GET'])
def user_order_history(user_id):
    orders = Booking.query.filter_by(user_id=user_id).all()
    orders_data = [{
        'booking_id': order.id,
        'driver_id': order.driver_id,
        'pickup_location': order.pickup_location,
        'dropoff_location': order.dropoff_location,
        'status': order.status,
        'created_at': order.created_at
    } for order in orders]
    return jsonify({'orders': orders_data})

@app.route('/api/driver/order-history/<int:driver_id>', methods=['GET'])
def driver_order_history(driver_id):
    orders = Booking.query.filter_by(driver_id=driver_id).all()
    orders_data = [{
        'booking_id': order.id,
        'user_id': order.user_id,
        'pickup_location': order.pickup_location,
        'dropoff_location': order.dropoff_location,
        'status': order.status,
        'created_at': order.created_at
    } for order in orders]
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

    # Update driver's average rating
    driver = Driver.query.get_or_404(driver_id)
    driver.ratings = (driver.ratings * driver.completed_orders + rating) / (driver.completed_orders + 1)
    driver.completed_orders += 1
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
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # If the transaction already has a final status, return it
    if transaction.status in ['completed', 'failed']:
        return jsonify({'status': transaction.status})
    
    # If we have an IntaSend ID, check with IntaSend
    if transaction.intasend_id:
        try:
            # Make a request to IntaSend to check the status
            headers = {
                'Authorization': f'Bearer {INTASEND_SECRET_KEY}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{INTASEND_API_BASE}/payment/status/{transaction.intasend_id}/',
                headers=headers
            )
            
            if response.status_code == 200:
                intasend_status = response.json().get('status')
                
                # Map IntaSend status to our status
                if intasend_status == 'COMPLETE':
                    transaction.status = 'completed'
                    
                    # Update user balance
                    user = User.query.get(transaction.user_id)
                    user.balance += transaction.amount
                    
                elif intasend_status == 'FAILED':
                    transaction.status = 'failed'
                
                db.session.commit()
        
        except Exception as e:
            print(f"Error checking IntaSend status: {e}")
    
    return jsonify({'status': transaction.status})

# Callback URL for IntaSend
@app.route('/api/callback/deposit/<transaction_id>', methods=['POST'])
def intasend_callback(transaction_id):
    data = request.get_json()
    
    # Verify the request is coming from IntaSend (you should implement proper verification)
    # For now, just log the callback data
    print(f"IntaSend Callback for {transaction_id}: {data}")
    
    # Find the transaction
    transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    if data.get('status') == 'COMPLETE':
        transaction.status = 'completed'
        
        # Update user balance
        user = User.query.get(transaction.user_id)
        user.balance += transaction.amount
        
    elif data.get('status') == 'FAILED':
        transaction.status = 'failed'
    
    db.session.commit()
    
    return jsonify({'message': 'Callback processed successfully'})
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
    # Fetch all completed orders with pending payments
    orders = Booking.query.filter_by(status='completed').all()
    escrow_data = [{
        'booking_id': order.id,
        'user_id': order.user_id,
        'driver_id': order.driver_id,
        'price': order.price,
        'created_at': order.created_at
    } for order in orders]
    return jsonify({'escrow': escrow_data})

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
        'live_location': driver.live_location
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
    booking = Booking.query.get_or_404(booking_id)
    if booking.status != 'pending':
        return jsonify({'error': 'Only pending orders can be cancelled'}), 400

    booking.status = 'cancelled'
    db.session.commit()

    # Notify driver
    notification = Notification(
        driver_id=booking.driver_id,
        message=f'User {booking.user_id} has cancelled booking {booking.id}.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Order cancelled successfully!'})

@app.route('/api/driver/cancel-order/<int:booking_id>', methods=['POST'])
def driver_cancel_order(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.status != 'accepted':
        return jsonify({'error': 'Only accepted orders can be cancelled by drivers'}), 400

    booking.status = 'cancelled'
    db.session.commit()

    # Notify user
    notification = Notification(
        user_id=booking.user_id,
        message=f'Driver {booking.driver_id} has cancelled booking {booking.id}.'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Order cancelled successfully!'})

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

# Run the App
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin_user() 
    app.run(port=5000, debug=True)