# M-Pesa B2C Implementation Guide - From Scratch

## 📋 Table of Contents
1. [Understanding M-Pesa B2C](#understanding-mpesa-b2c)
2. [Prerequisites](#prerequisites)
3. [Part 1: Daraja Portal Setup](#part-1-daraja-portal-setup)
4. [Part 2: Understanding B2C API](#part-2-understanding-b2c-api)
5. [Part 3: Backend Implementation](#part-3-backend-implementation)
6. [Part 4: Callback Implementation](#part-4-callback-implementation)
7. [Part 5: Testing](#part-5-testing)
8. [Part 6: Production Deployment](#part-6-production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Understanding M-Pesa B2C

### What is B2C?
**B2C (Business to Customer)** allows your business to send money from your M-Pesa business account to customer M-Pesa accounts.

### Use Cases:
- ✅ **Withdrawals** - Pay out earnings (your use case)
- ✅ **Refunds** - Return payments to customers
- ✅ **Salary Payments** - Pay employees
- ✅ **Promotions** - Send promotional money

### How it Works:
```
Your Business Account
        ↓
    B2C API Request
        ↓
  Safaricom Processes
        ↓
 Customer M-Pesa Account
        ↓
    Callback to Your Server
        ↓
 Confirm Transaction
```

### Important Concepts:

1. **Initiator**: The person/system authorized to initiate B2C transactions
2. **Security Credential**: Encrypted password for the initiator
3. **Short Code**: Your business M-Pesa number
4. **Queue Timeout**: Called if transaction takes too long
5. **Result URL**: Called when transaction completes (success/failure)

---

## Prerequisites

### Required:
- ✅ Safaricom M-Pesa account (for production)
- ✅ Internet connection
- ✅ Python 3.7+ installed
- ✅ Flask backend (you have this)
- ✅ Publicly accessible URL (ngrok for testing)

### Knowledge:
- Basic Python
- REST APIs
- Callbacks/Webhooks
- JSON

---

## Part 1: Daraja Portal Setup

### Step 1.1: Register on Daraja Portal

1. **Go to Daraja Portal**
   - URL: https://developer.safaricom.co.ke/
   - Click "Sign Up" (top right)

2. **Create Account**
   ```
   Email: your-email@example.com
   Password: [Choose strong password]
   Organization: Your Company Name
   Phone: +254XXXXXXXXX
   ```

3. **Verify Email**
   - Check your inbox
   - Click verification link
   - Login to portal

### Step 1.2: Create a B2C App

1. **Navigate to "My Apps"**
   - Click "My Apps" in top menu
   - Click "Add a New App"

2. **Fill App Details**
   ```
   App Name: Moving App B2C
   Description: Driver withdrawal system
   ```

3. **Select Products**
   - Check: ☑️ **B2C**
   - For testing, you might also need:
     - ☑️ Lipa Na M-Pesa (C2B - for payments)
     - ☑️ Account Balance (optional)

4. **Create App**
   - Click "Create App"
   - You'll be redirected to app details

### Step 1.3: Get Credentials

After creating the app, you'll see:

1. **Consumer Key**
   ```
   Example: FGh7J9k2Lm4pQr8TvXyZ3bN6cD1eF5gH
   ```
   - This is your API username
   - Used to authenticate all requests

2. **Consumer Secret**
   ```
   Example: A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0
   ```
   - This is your API password
   - Keep it secret!

### Step 1.4: Understand Sandbox vs Production

**Sandbox (Testing):**
- URL: `https://sandbox.safaricom.co.ke`
- Test credentials provided
- No real money transferred
- Test phone numbers work
- Short Code: Usually `600000` or similar

**Production (Live):**
- URL: `https://api.safaricom.co.ke`
- Real business account needed
- Real money transferred
- Your actual business short code
- Requires business verification

### Step 1.5: Get Test Credentials

In your app details page, you'll see:

```
Environment: Sandbox

Consumer Key: [Copy this]
Consumer Secret: [Copy this]

Test Credentials:
Short Code: 600996
Initiator Name: testapi
Security Credential: [Click to generate]
```

**Important:** Click "Generate Security Credential" button

### Step 1.6: Security Credential

This is the **most important** part for B2C!

1. **What is it?**
   - Your initiator password encrypted with Safaricom's public key
   - A long base64 encoded string
   - Different for sandbox and production

2. **How to Get it?**
   
   **Option A: Daraja Portal (Easiest)**
   - In your app page, find "Generate Security Credential"
   - Click it
   - Copy the long string (looks like: `Ag8bCdE2fG3hI4jK5lM6nO7pQ8rS9tU0vW...`)

   **Option B: Manual Generation (Advanced)**
   - Download Safaricom's certificate from Daraja
   - Use OpenSSL to encrypt your password
   - Base64 encode the result

3. **Test Security Credential**
   
   For sandbox, Safaricom often provides a test credential:
   ```
   Initiator Password: Safaricom999!*!
   Test Security Credential: [Generated from portal]
   ```

---

## Part 2: Understanding B2C API

### 2.1: API Flow

```
1. Get OAuth Token
   POST: https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
   Auth: Basic (Consumer Key:Consumer Secret)
   
2. Make B2C Payment Request
   POST: https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
   Headers: Authorization: Bearer {access_token}
   Body: JSON with payment details
   
3. Receive Response
   {
     "ConversationID": "AG_20240226_...",
     "OriginatorConversationID": "12345-...",
     "ResponseCode": "0",
     "ResponseDescription": "Accept the service request successfully."
   }
   
4. Wait for Callback
   Safaricom calls your ResultURL with final status
```

### 2.2: Request Payload Structure

```json
{
  "InitiatorName": "testapi",
  "SecurityCredential": "your_security_credential_here",
  "CommandID": "BusinessPayment",
  "Amount": 500,
  "PartyA": "600996",
  "PartyB": "254712345678",
  "Remarks": "Withdrawal payment",
  "QueueTimeOutURL": "https://your-domain.com/api/mpesa/b2c-timeout",
  "ResultURL": "https://your-domain.com/api/mpesa/b2c-result",
  "Occasion": "TXN-12345"
}
```

**Field Explanations:**

- **InitiatorName**: The username (from Daraja portal)
- **SecurityCredential**: Encrypted password (from Daraja portal)
- **CommandID**: Type of payment
  - `BusinessPayment` - Normal payments
  - `SalaryPayment` - Salary disbursement
  - `PromotionPayment` - Promotional payments
- **Amount**: Amount in KES (integer)
- **PartyA**: Your business short code (who's paying)
- **PartyB**: Customer phone number (who receives)
- **Remarks**: Description (up to 100 chars)
- **QueueTimeOutURL**: Called if timeout
- **ResultURL**: Called with final result
- **Occasion**: Your reference/tracking ID

### 2.3: Callback Response Structure

**Success Callback:**
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "12345",
    "ConversationID": "AG_20240226_...",
    "TransactionID": "NLJ7...",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "TransactionReceipt",
          "Value": "NLJ7RT61SV"
        },
        {
          "Key": "TransactionAmount",
          "Value": 500
        },
        {
          "Key": "B2CWorkingAccountAvailableFunds",
          "Value": 50000.00
        },
        {
          "Key": "B2CUtilityAccountAvailableFunds",
          "Value": 10000.00
        },
        {
          "Key": "TransactionCompletedDateTime",
          "Value": "26.02.2026 14:30:00"
        },
        {
          "Key": "ReceiverPartyPublicName",
          "Value": "254712345678 - John Doe"
        },
        {
          "Key": "B2CChargesPaidAccountAvailableFunds",
          "Value": 0.00
        },
        {
          "Key": "B2CRecipientIsRegisteredCustomer",
          "Value": "Y"
        }
      ]
    },
    "ReferenceData": {
      "ReferenceItem": {
        "Key": "QueueTimeoutURL",
        "Value": "https://your-domain.com/timeout"
      }
    }
  }
}
```

**Failed Callback:**
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 2001,
    "ResultDesc": "The initiator information is invalid.",
    "OriginatorConversationID": "12345",
    "ConversationID": "AG_20240226_...",
    "TransactionID": "NLJ7..."
  }
}
```

### 2.4: Result Codes

Common result codes you'll encounter:

```
0     - Success
2001  - Invalid initiator
2006  - Insufficient funds in business account
2051  - Invalid MSISDN (phone number)
1032  - Cancelled by user
1037  - Timeout
1     - General failure
```

---

## Part 3: Backend Implementation

### 3.1: Project Structure

```
moving-app/
├── movers.py                 # Your main Flask app
├── .env                      # Configuration
├── requirements.txt          # Dependencies
└── moving_app.db            # SQLite database
```

### 3.2: Install Dependencies

Make sure you have these in `requirements.txt`:

```txt
Flask==2.3.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
python-dotenv==1.0.0
requests==2.31.0
Werkzeug==2.3.0
```

Install:
```bash
pip install -r requirements.txt
```

### 3.3: Configuration (.env file)

Create/update `.env` file:

```bash
# M-Pesa STK Push (C2B) - Already configured
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/mpesa/callback

# M-Pesa B2C (Business to Customer)
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential_from_daraja
MPESA_B2C_SHORT_CODE=600996
MPESA_B2C_RESULT_URL=https://your-ngrok-url.ngrok-free.app/api/mpesa/b2c-result
MPESA_B2C_TIMEOUT_URL=https://your-ngrok-url.ngrok-free.app/api/mpesa/b2c-timeout
```

### 3.4: Load Configuration (movers.py)

At the top of your Flask app:

```python
import os
from dotenv import load_dotenv

load_dotenv()

# M-Pesa B2C Configuration
MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY')
MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET')
MPESA_ENVIRONMENT = os.getenv('MPESA_ENVIRONMENT', 'sandbox')

# B2C Specific
MPESA_INITIATOR_NAME = os.getenv('MPESA_INITIATOR_NAME', 'testapi')
MPESA_SECURITY_CREDENTIAL = os.getenv('MPESA_SECURITY_CREDENTIAL', '')
MPESA_B2C_SHORT_CODE = os.getenv('MPESA_B2C_SHORT_CODE', '600996')
MPESA_B2C_RESULT_URL = os.getenv('MPESA_B2C_RESULT_URL')
MPESA_B2C_TIMEOUT_URL = os.getenv('MPESA_B2C_TIMEOUT_URL')

# API Base URL
if MPESA_ENVIRONMENT == 'sandbox':
    MPESA_API_BASE = 'https://sandbox.safaricom.co.ke'
else:
    MPESA_API_BASE = 'https://api.safaricom.co.ke'
```

### 3.5: Get OAuth Token Function

This function authenticates with M-Pesa:

```python
import requests
from requests.auth import HTTPBasicAuth

def get_mpesa_access_token():
    """
    Get OAuth access token for M-Pesa API
    Valid for 1 hour
    """
    try:
        # Check if credentials are configured
        if not MPESA_CONSUMER_KEY or not MPESA_CONSUMER_SECRET:
            print("M-Pesa credentials not configured")
            return None
        
        # OAuth endpoint
        url = f'{MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials'
        
        # Make request with Basic Auth
        response = requests.get(
            url,
            auth=HTTPBasicAuth(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET),
            timeout=30
        )
        
        # Check response
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            print(f"✓ Got M-Pesa access token: {access_token[:20]}...")
            return access_token
        else:
            print(f"✗ Failed to get access token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Exception getting access token: {str(e)}")
        return None
```

### 3.6: B2C Payment Function

Main function to initiate B2C payment:

```python
def initiate_b2c_payment(phone_number, amount, transaction_id, remarks="Withdrawal"):
    """
    Initiate B2C payment using M-Pesa Daraja API
    
    Args:
        phone_number: Customer phone (254XXXXXXXXX format)
        amount: Amount in KES (integer)
        transaction_id: Your reference ID
        remarks: Payment description
    
    Returns:
        dict: {
            'success': True/False,
            'conversation_id': 'AG_...',
            'error': 'error message' (if failed)
        }
    """
    try:
        print(f"\n=== Initiating B2C Payment ===")
        print(f"Amount: KES {amount}")
        print(f"Phone: {phone_number}")
        print(f"Transaction ID: {transaction_id}")
        
        # Step 1: Get access token
        access_token = get_mpesa_access_token()
        if not access_token:
            return {
                'success': False,
                'error': 'Failed to authenticate with M-Pesa API'
            }
        
        # Step 2: Prepare request
        url = f'{MPESA_API_BASE}/mpesa/b2c/v1/paymentrequest'
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        payload = {
            'InitiatorName': MPESA_INITIATOR_NAME,
            'SecurityCredential': MPESA_SECURITY_CREDENTIAL,
            'CommandID': 'BusinessPayment',
            'Amount': int(amount),
            'PartyA': MPESA_B2C_SHORT_CODE,
            'PartyB': phone_number,
            'Remarks': remarks[:100],  # Max 100 chars
            'QueueTimeOutURL': MPESA_B2C_TIMEOUT_URL,
            'ResultURL': MPESA_B2C_RESULT_URL,
            'Occasion': transaction_id
        }
        
        print(f"Calling M-Pesa B2C API...")
        print(f"Payload: {payload}")
        
        # Step 3: Make API call
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        response_data = response.json()
        print(f"Response: {response_data}")
        
        # Step 4: Check response
        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            print(f"✓ B2C payment initiated successfully!")
            return {
                'success': True,
                'conversation_id': response_data.get('ConversationID'),
                'originator_conversation_id': response_data.get('OriginatorConversationID'),
                'response_description': response_data.get('ResponseDescription')
            }
        else:
            error_message = (
                response_data.get('errorMessage') or 
                response_data.get('ResponseDescription') or 
                'B2C payment failed'
            )
            print(f"✗ B2C payment failed: {error_message}")
            return {
                'success': False,
                'error': error_message
            }
            
    except requests.exceptions.Timeout:
        print(f"✗ Request timeout")
        return {
            'success': False,
            'error': 'Request timeout - please try again'
        }
    except Exception as e:
        print(f"✗ Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Exception: {str(e)}'
        }
```

### 3.7: Withdrawal Endpoint

Update your withdrawal endpoint:

```python
@app.route('/api/driver/withdraw', methods=['POST'])
def driver_withdraw():
    """
    Driver withdraws available earnings to M-Pesa
    """
    try:
        data = request.get_json()
        driver_id = data.get('driver_id')
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        
        # Validation
        if not all([driver_id, amount, phone_number]):
            return jsonify({
                'error': 'Driver ID, amount, and phone number are required'
            }), 400
        
        # Get driver
        driver = Driver.query.get(driver_id)
        if not driver:
            return jsonify({'error': 'Driver not found'}), 404
        
        # Validate amount
        amount = float(amount)
        if amount < 100:
            return jsonify({
                'error': 'Minimum withdrawal is KES 100'
            }), 400
        if amount > 50000:
            return jsonify({
                'error': 'Maximum withdrawal is KES 50,000'
            }), 400
        if amount > driver.earnings:
            return jsonify({
                'error': f'Insufficient funds. Available: KES {driver.earnings:.2f}'
            }), 400
        
        # Format phone number
        phone_number = str(phone_number).replace(' ', '').replace('+', '')
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        if len(phone_number) != 12:
            return jsonify({
                'error': 'Invalid phone number. Use format: 0712345678'
            }), 400
        
        # Generate transaction ID
        transaction_id = f'WTH-{uuid.uuid4().hex[:8].upper()}'
        
        # Create transaction record
        transaction = Transaction(
            user_id=driver.user_id,
            transaction_id=transaction_id,
            amount=amount,
            phone_number=phone_number,
            type='withdrawal',
            status='pending'
        )
        db.session.add(transaction)
        
        # Deduct from earnings (will refund if fails)
        driver.earnings -= amount
        db.session.commit()
        
        print(f"\n{'='*50}")
        print(f"WITHDRAWAL REQUEST")
        print(f"Transaction ID: {transaction_id}")
        print(f"Driver ID: {driver_id}")
        print(f"Amount: KES {amount}")
        print(f"Phone: {phone_number}")
        print(f"{'='*50}\n")
        
        # Check if B2C is configured
        if MPESA_SECURITY_CREDENTIAL and len(MPESA_SECURITY_CREDENTIAL) > 10:
            # Real M-Pesa B2C
            print("Using REAL M-Pesa B2C API")
            
            b2c_result = initiate_b2c_payment(
                phone_number=phone_number,
                amount=amount,
                transaction_id=transaction_id,
                remarks=f'Driver withdrawal - {driver.user_id}'
            )
            
            if b2c_result['success']:
                # Update transaction with conversation IDs
                transaction.checkout_request_id = b2c_result.get('conversation_id')
                transaction.merchant_request_id = b2c_result.get('originator_conversation_id')
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Withdrawal is being processed. You will receive money shortly.',
                    'transaction_id': transaction_id,
                    'status': 'pending'
                }), 200
            else:
                # Failed - refund
                transaction.status = 'failed'
                driver.earnings += amount
                db.session.commit()
                
                return jsonify({
                    'success': False,
                    'error': b2c_result['error']
                }), 400
        else:
            # Simulation mode
            print("Using SIMULATION mode (no security credential)")
            
            transaction.status = 'completed'
            transaction.mpesa_receipt_number = f'SIM-{uuid.uuid4().hex[:10].upper()}'
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'[SIMULATED] Withdrawal of KES {amount:.2f} completed',
                'transaction_id': transaction_id,
                'simulated': True
            }), 200
            
    except Exception as e:
        print(f"Withdrawal error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Refund if transaction exists
        if 'transaction' in locals():
            transaction.status = 'failed'
            driver.earnings += amount
            db.session.commit()
        
        return jsonify({
            'error': 'Internal server error'
        }), 500
```

---

## Part 4: Callback Implementation

### 4.1: Result Callback Endpoint

This receives the final transaction result:

```python
@app.route('/api/mpesa/b2c-result', methods=['POST'])
def b2c_result_callback():
    """
    Handle M-Pesa B2C payment result callback
    Called when transaction completes (success or failure)
    """
    try:
        # Get callback data
        data = request.get_json()
        
        # Log the callback
        print(f"\n{'='*60}")
        print(f"B2C RESULT CALLBACK RECEIVED")
        print(f"{'='*60}")
        print(f"Data: {json.dumps(data, indent=2)}")
        print(f"{'='*60}\n")
        
        # Extract result
        result = data.get('Result', {})
        result_code = result.get('ResultCode')
        result_desc = result.get('ResultDesc', '')
        conversation_id = result.get('ConversationID')
        originator_conversation_id = result.get('OriginatorConversationID')
        transaction_id = result.get('TransactionID')
        
        # Find transaction
        transaction = Transaction.query.filter_by(
            checkout_request_id=conversation_id
        ).first()
        
        if not transaction:
            print(f"✗ Transaction not found for ConversationID: {conversation_id}")
            return jsonify({
                'ResultCode': 1,
                'ResultDesc': 'Transaction not found'
            }), 404
        
        print(f"Found transaction: {transaction.transaction_id}")
        
        # Check result
        if result_code == 0:
            # SUCCESS
            print(f"✓ Transaction SUCCESSFUL")
            transaction.status = 'completed'
            
            # Extract result parameters
            result_parameters = result.get('ResultParameters', {}).get('ResultParameter', [])
            
            for param in result_parameters:
                key = param.get('Key')
                value = param.get('Value')
                
                if key == 'TransactionReceipt':
                    transaction.mpesa_receipt_number = value
                    print(f"M-Pesa Receipt: {value}")
                elif key == 'TransactionAmount':
                    print(f"Amount: KES {value}")
                elif key == 'ReceiverPartyPublicName':
                    print(f"Receiver: {value}")
                elif key == 'TransactionCompletedDateTime':
                    print(f"Completed: {value}")
            
            # Notify driver
            notification = Notification(
                user_id=transaction.user_id,
                message=f'Withdrawal successful! KES {transaction.amount:.2f} sent to your M-Pesa account. Receipt: {transaction.mpesa_receipt_number}'
            )
            db.session.add(notification)
            
            print(f"✓ Driver notified of successful withdrawal")
            
        else:
            # FAILED
            print(f"✗ Transaction FAILED")
            print(f"Result Code: {result_code}")
            print(f"Result Desc: {result_desc}")
            
            transaction.status = 'failed'
            
            # Refund driver
            driver = Driver.query.filter_by(user_id=transaction.user_id).first()
            if driver:
                driver.earnings += transaction.amount
                print(f"✓ Refunded KES {transaction.amount} to driver wallet")
                
                notification = Notification(
                    user_id=transaction.user_id,
                    message=f'Withdrawal failed: {result_desc}. KES {transaction.amount:.2f} refunded to your wallet.'
                )
                db.session.add(notification)
        
        # Save changes
        db.session.commit()
        
        print(f"✓ Callback processed successfully\n")
        
        # Respond to M-Pesa
        return jsonify({
            'ResultCode': 0,
            'ResultDesc': 'Accepted'
        }), 200
        
    except Exception as e:
        print(f"✗ Callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'ResultCode': 1,
            'ResultDesc': f'Error: {str(e)}'
        }), 500
```

### 4.2: Timeout Callback Endpoint

This is called if the transaction times out:

```python
@app.route('/api/mpesa/b2c-timeout', methods=['POST'])
def b2c_timeout_callback():
    """
    Handle M-Pesa B2C payment timeout
    Called if transaction takes too long
    """
    try:
        data = request.get_json()
        
        print(f"\n{'='*60}")
        print(f"B2C TIMEOUT CALLBACK RECEIVED")
        print(f"{'='*60}")
        print(f"Data: {json.dumps(data, indent=2)}")
        print(f"{'='*60}\n")
        
        result = data.get('Result', {})
        conversation_id = result.get('ConversationID')
        
        # Find transaction
        transaction = Transaction.query.filter_by(
            checkout_request_id=conversation_id
        ).first()
        
        if transaction and transaction.status == 'pending':
            print(f"Marking transaction as failed: {transaction.transaction_id}")
            
            transaction.status = 'failed'
            
            # Refund driver
            driver = Driver.query.filter_by(user_id=transaction.user_id).first()
            if driver:
                driver.earnings += transaction.amount
                print(f"Refunded KES {transaction.amount} to driver")
                
                notification = Notification(
                    user_id=transaction.user_id,
                    message=f'Withdrawal request timed out. KES {transaction.amount:.2f} refunded to your wallet.'
                )
                db.session.add(notification)
            
            db.session.commit()
        
        return jsonify({
            'ResultCode': 0,
            'ResultDesc': 'Timeout processed'
        }), 200
        
    except Exception as e:
        print(f"Timeout callback error: {str(e)}")
        return jsonify({
            'ResultCode': 1,
            'ResultDesc': str(e)
        }), 500
```

---

## Part 5: Testing

### 5.1: Setup ngrok

ngrok creates a public URL for your local server (needed for callbacks):

1. **Install ngrok**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager:
   
   # Ubuntu/Debian
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
     sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
     echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
     sudo tee /etc/apt/sources.list.d/ngrok.list && \
     sudo apt update && sudo apt install ngrok
   
   # macOS
   brew install ngrok/ngrok/ngrok
   ```

2. **Sign up for ngrok account** (free)
   - Go to https://dashboard.ngrok.com/signup
   - Get your auth token

3. **Configure ngrok**
   ```bash
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

4. **Start ngrok**
   ```bash
   ngrok http 5000
   ```
   
   You'll see:
   ```
   Session Status                online
   Account                      YourName (Plan: Free)
   Version                      3.x.x
   Region                       United States (us)
   Forwarding                   https://abc123.ngrok-free.app -> http://localhost:5000
   ```

5. **Copy the HTTPS URL**
   ```
   https://abc123.ngrok-free.app
   ```

6. **Update .env**
   ```bash
   MPESA_B2C_RESULT_URL=https://abc123.ngrok-free.app/api/mpesa/b2c-result
   MPESA_B2C_TIMEOUT_URL=https://abc123.ngrok-free.app/api/mpesa/b2c-timeout
   ```

### 5.2: Start Backend

```bash
cd /home/samdev652/moving-app
source venv/bin/activate
python movers.py
```

### 5.3: Test Withdrawal Flow

1. **Ensure driver has earnings:**
   - Complete some bookings
   - Money should be in driver wallet (not escrow)

2. **Make withdrawal request:**
   - Login as driver
   - Go to Driver Wallet
   - Enter withdrawal amount
   - Enter phone number (254712345678)
   - Click "Withdraw"

3. **Watch backend logs:**
   ```
   ===================================================
   WITHDRAWAL REQUEST
   Transaction ID: WTH-A1B2C3D4
   Driver ID: 1
   Amount: KES 500.0
   Phone: 254712345678
   ===================================================
   
   Using REAL M-Pesa B2C API
   
   === Initiating B2C Payment ===
   Amount: KES 500.0
   Phone: 254712345678
   Transaction ID: WTH-A1B2C3D4
   ✓ Got M-Pesa access token: abc123xyz...
   Calling M-Pesa B2C API...
   ✓ B2C payment initiated successfully!
   ```

4. **Wait for callback (usually 1-30 seconds):**
   ```
   ============================================================
   B2C RESULT CALLBACK RECEIVED
   ============================================================
   Found transaction: WTH-A1B2C3D4
   ✓ Transaction SUCCESSFUL
   M-Pesa Receipt: NLJ7RT61SV
   Amount: KES 500.0
   ✓ Driver notified of successful withdrawal
   ✓ Callback processed successfully
   ```

5. **Check in app:**
   - Wallet balance updated
   - Transaction shows as "completed"
   - Notification received

### 5.4: Test Scenarios

**Test 1: Successful Withdrawal**
- Amount: KES 500
- Phone: Valid Safaricom number
- Expected: Success

**Test 2: Invalid Phone Number**
- Phone: "123456"
- Expected: Error before API call

**Test 3: Insufficient Funds**
- Amount: More than available
- Expected: Error before API call

**Test 4: Below Minimum**
- Amount: KES 50
- Expected: Error "Minimum KES 100"

**Test 5: Above Maximum**
- Amount: KES 60000
- Expected: Error "Maximum KES 50,000"

---

## Part 6: Production Deployment

### 6.1: Get Production Credentials

1. **Business M-Pesa Account**
   - Register business with Safaricom
   - Get business short code
   - Activate M-Pesa business account

2. **Production App on Daraja**
   - Create new app (or promote sandbox app)
   - Use production credentials
   - Register production URLs

3. **Update .env**
   ```bash
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=production_key
   MPESA_CONSUMER_SECRET=production_secret
   MPESA_B2C_SHORT_CODE=your_business_shortcode
   MPESA_INITIATOR_NAME=your_initiator
   MPESA_SECURITY_CREDENTIAL=production_credential
   MPESA_B2C_RESULT_URL=https://yourdomain.com/api/mpesa/b2c-result
   MPESA_B2C_TIMEOUT_URL=https://yourdomain.com/api/mpesa/b2c-timeout
   ```

### 6.2: Security Checklist

- ✅ Use HTTPS only (no HTTP)
- ✅ Validate callback IPs (Safaricom IPs only)
- ✅ Store credentials in environment variables
- ✅ Never commit credentials to git
- ✅ Use strong passwords
- ✅ Enable API rate limiting
- ✅ Log all transactions
- ✅ Monitor failed transactions
- ✅ Set up alerts for failures

### 6.3: Monitoring

Add monitoring for:
- Failed withdrawals
- Callback timeouts
- API errors
- Business account balance

---

## Troubleshooting

### Problem: "The initiator information is invalid"

**Cause:** Wrong initiator name or security credential

**Solution:**
1. Verify `MPESA_INITIATOR_NAME` matches Daraja portal
2. Regenerate security credential from portal
3. Copy entire credential (it's very long)
4. Update `.env` file
5. Restart backend

### Problem: "Insufficient funds"

**Cause:** Business M-Pesa account has no money

**Solution:**
- Check business account balance
- In sandbox: Contact Daraja support for test credits
- In production: Load money into business account

### Problem: "Callback not received"

**Cause:** URL not accessible or wrong

**Solution:**
1. Check ngrok is running: `ngrok http 5000`
2. Verify URL in `.env` matches ngrok URL
3. Test URL: `curl https://your-ngrok-url/api/mpesa/b2c-result`
4. Check firewall/security groups
5. Verify SSL certificate (HTTPS required)

### Problem: "Invalid MSISDN"

**Cause:** Wrong phone number format

**Solution:**
- Use format: `254712345678` (12 digits)
- Must start with `254`
- Remove spaces, dashes, plus signs
- Only Safaricom numbers work

### Problem: "Timeout"

**Cause:** M-Pesa servers slow or down

**Solution:**
- Wait and retry
- Transaction automatically refunded
- Check M-Pesa system status

### Problem: "Consumer key invalid"

**Cause:** Wrong credentials or wrong environment

**Solution:**
1. Verify consumer key/secret are correct
2. Check environment (sandbox vs production)
3. Ensure credentials match environment
4. Regenerate credentials if needed

---

## Summary Checklist

Before going live, ensure:

- ✅ Daraja account created
- ✅ B2C app created
- ✅ Consumer key/secret obtained
- ✅ Security credential generated
- ✅ OAuth token function works
- ✅ B2C payment function implemented
- ✅ Callback endpoints created
- ✅ ngrok setup (testing) or public domain (production)
- ✅ Phone number validation
- ✅ Amount validation
- ✅ Transaction tracking
- ✅ Automatic refunds on failure
- ✅ Error handling
- ✅ Logging
- ✅ Tested with sandbox
- ✅ Business account funded (production)

---

## Quick Reference

### Key URLs

**Sandbox:**
- OAuth: `https://sandbox.safaricom.co.ke/oauth/v1/generate`
- B2C: `https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest`

**Production:**
- OAuth: `https://api.safaricom.co.ke/oauth/v1/generate`
- B2C: `https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest`

### Test Phone Numbers (Sandbox)

- `254708374149`
- `254712345678`
- `254700000000`

### Important Links

- Daraja Portal: https://developer.safaricom.co.ke/
- Documentation: https://developer.safaricom.co.ke/APIs/BusinessToCustomer
- Support: devsupport@safaricom.co.ke

---

**You're now ready to implement M-Pesa B2C from scratch!** 🚀

Start with sandbox, test thoroughly, then move to production.
