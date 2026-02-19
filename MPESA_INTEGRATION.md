# M-Pesa Daraja API Integration Guide

## Overview
This application now supports M-Pesa payments through the official Safaricom Daraja API. Users can deposit money into their wallet using M-Pesa STK Push (Lipa Na M-Pesa Online).

## Features Implemented

### 1. **Pay via M-Pesa Button**
- Changed the deposit button to "Pay via M-Pesa"
- Users enter their M-Pesa phone number and amount
- System initiates STK Push to user's phone via Daraja API

### 2. **Backend API Endpoints**

#### `/api/mpesa/stk-push` (POST)
Initiates M-Pesa STK Push payment using Daraja API.

**Request Body:**
```json
{
  "user_id": 1,
  "amount": 1000,
  "phone_number": "254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent. Please check your phone to complete payment.",
  "transaction_id": "uuid-here",
  "checkout_request_id": "ws_CO_DMZ_123456789_00000000000000000000"
}
```

#### `/api/mpesa/callback` (POST)
Handles payment confirmation callback from Daraja API.

**Request Body (from Daraja):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220191020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1000
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "NLJ7RT61SV"
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

#### `/api/mpesa/check-status/<transaction_id>` (GET)
Check the status of a transaction.

**Response:**
```json
{
  "transaction_id": "uuid-here",
  "amount": 1000,
  "status": "completed",
  "type": "deposit",
  "created_at": "2025-03-15T14:30:22Z",
  "mpesa_receipt_number": "NLJ7RT61SV"
}
```

### 3. **Frontend Integration**

The UserWallet component now:
- Collects M-Pesa phone number
- Sends STK Push request to backend
- Polls transaction status every 3 seconds
- Updates balance when payment is confirmed
- Shows real-time payment status

### 4. **Transaction Status Polling**

After initiating payment:
1. User receives STK Push on their phone
2. Frontend polls the backend every 3 seconds
3. Backend checks status with Daraja API
4. When payment is confirmed, balance is updated
5. Transaction history is updated

## Setup Instructions

### 1. Safaricom Daraja API Setup

1. **Create a Daraja Account**
   - Go to [Daraja Portal](https://developer.safaricom.co.ke/)
   - Sign up or log in
   - Create a new app

2. **Get Your Credentials**
   - Consumer Key
   - Consumer Secret
   - Business Short Code (use 174379 for sandbox)
   - Passkey (provided in sandbox docs)

3. **Configure Callback URL**
   - Go to your app settings
   - Set callback URL: `https://yourdomain.com/api/mpesa/callback`
   - For local testing, use ngrok: `https://your-ngrok-url.ngrok.io/api/mpesa/callback`

4. **Update .env File**

```env
# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### 2. Backend Setup

The backend is already configured to use Daraja API. Make sure:
- Python dependencies are installed: `pip install requests python-dotenv`
- Environment variables are loaded from `.env`
- Flask server is running: `python movers.py`

### 3. Database Migration

The Transaction model has been updated with new fields. You may need to recreate the database or run migrations:

```bash
# Simple approach: Delete and recreate database
rm instance/moving_app.db
python movers.py
```

**New Transaction Fields:**
- `mpesa_receipt_number`: M-Pesa transaction receipt
- `checkout_request_id`: STK Push request ID
- `merchant_request_id`: Merchant request ID
- `phone_number`: Phone number used for transaction

### 4. Frontend Setup

No additional setup needed. The UserWallet component automatically:
- Loads user's phone number if available
- Validates phone number format (supports 07xx, +254, 254 formats)
- Handles transaction status updates

## Testing

### Test with Daraja Sandbox

Safaricom provides sandbox credentials for testing:

**Sandbox Credentials:**
- Business Short Code: `174379`
- Passkey: Obtain from [Daraja Sandbox Docs](https://developer.safaricom.co.ke/test_credentials)

**Test Phone Numbers:**
- Use any Kenyan number format: `254712345678` or `0712345678`
- In sandbox, you'll see a simulated payment interface

**Test Amounts:**
- Minimum: KES 1
- Maximum: KES 150,000 (sandbox limit)

### Testing Flow

1. Login to the application
2. Navigate to "My Wallet"
3. Enter test phone number: `0712345678`
4. Enter amount: `100`
5. Click "Pay via M-Pesa"
6. In sandbox, the STK Push is simulated
7. Balance should update within 15-20 seconds

### Local Testing with Ngrok

Since Daraja requires a public callback URL, use ngrok for local testing:

```bash
# Install ngrok
# Download from https://ngrok.com/download

# Start your Flask server
python movers.py

# In another terminal, start ngrok
ngrok http 5000

# Update your .env with the ngrok URL
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback

# Also update this in Daraja portal
```

## Phone Number Format

The system automatically formats phone numbers:
- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `712345678` → `254712345678`

## Transaction States

- **pending**: Payment initiated, waiting for user confirmation
- **completed**: Payment successful, balance updated
- **failed**: Payment failed or cancelled by user

## Currency

All amounts are in **Kenyan Shillings (KES)**.

## API Response Codes

### STK Push Response Codes
- `0`: Success - STK Push sent
- `1`: Failure - Could not send STK Push

### Callback Result Codes
- `0`: Success - Payment completed
- `1032`: Cancelled - User cancelled transaction
- `1037`: Timeout - User didn't enter PIN in time
- `2001`: Invalid initiator
- Other codes: Various error scenarios

## Security Notes

1. **API Keys**: Never commit `.env` file to git
2. **HTTPS**: Use HTTPS in production for callback URL
3. **Validation**: Backend validates all inputs
4. **Callbacks**: Verify callback origin in production
5. **OAuth**: Access tokens expire after 3600 seconds (managed automatically)

## Troubleshooting

### Issue: "Failed to authenticate with M-Pesa API"
- Check if Consumer Key and Secret are correct
- Verify they match your app in Daraja portal
- Ensure environment variables are loaded

### Issue: "Failed to initiate payment"
- Verify Business Short Code is correct
- Check Passkey is correct for your environment
- Ensure phone number is Kenyan Safaricom number

### Issue: "Payment stuck in pending"
- Check callback URL is publicly accessible
- Verify callback URL is registered in Daraja portal
- Use ngrok for local testing
- Check backend logs for callback errors

### Issue: "Invalid phone number"
- Ensure phone number is Kenyan (starts with 07 or 254)
- Safaricom numbers only (070x, 071x, 072x, 074x, 079x, 011x)
- Remove any spaces or special characters

### Issue: "Callback not received"
- Ensure callback URL is HTTPS (required by Daraja)
- Check firewall/security groups allow incoming requests
- Verify URL in Daraja portal matches your backend
- Check server logs for callback requests

## Database Schema

### Transaction Model
```python
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    transaction_id = db.Column(db.String(100), unique=True)
    mpesa_receipt_number = db.Column(db.String(100))
    checkout_request_id = db.Column(db.String(100))
    merchant_request_id = db.Column(db.String(100))
    amount = db.Column(db.Float)
    phone_number = db.Column(db.String(20))
    type = db.Column(db.String(50))  # deposit, payment, withdrawal
    status = db.Column(db.String(50))  # pending, completed, failed
    created_at = db.Column(db.DateTime)
```

## Next Steps

To enhance the integration:

1. **Add M-Pesa Withdrawals**: Implement B2C (Business to Customer) payments
2. **Transaction Receipts**: Email/SMS receipts to customers
3. **Webhook Security**: Verify Daraja callback signatures
4. **Balance History**: Show detailed balance change logs
5. **Auto-refresh Balance**: Real-time balance updates via WebSocket
6. **C2B Integration**: Support M-Pesa PayBill payments
7. **Transaction Reconciliation**: Daily reconciliation with M-Pesa statements

## Production Checklist

Before going live:

- [ ] Get production credentials from Daraja portal
- [ ] Update environment to `production` in `.env`
- [ ] Set production Business Short Code
- [ ] Get production Passkey
- [ ] Set up HTTPS domain for callback URL
- [ ] Register production callback URL in Daraja portal
- [ ] Add callback signature verification
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Add rate limiting to prevent abuse
- [ ] Test with real M-Pesa accounts
- [ ] Add transaction reconciliation
- [ ] Configure logging for audit trail
- [ ] Set up database backups
- [ ] Add retry mechanism for failed API calls

## Daraja API Limits

**Sandbox:**
- Request limit: ~100 requests/minute
- Transaction limit: KES 150,000

**Production:**
- Request limit: Based on your agreement
- Transaction limit: Based on your paybill/till configuration

## Support

For Daraja API issues:
- Documentation: https://developer.safaricom.co.ke/docs
- Support: digitalapi@safaricom.co.ke
- Community: Daraja Developer Community

For application issues:
- Check backend logs: Flask console output
- Check browser console: Developer tools → Console
- Verify database: Check `Transaction` table
- Test API endpoints with Postman

## Additional Resources

- [Daraja API Documentation](https://developer.safaricom.co.ke/docs)
- [STK Push API Reference](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
- [Test Credentials](https://developer.safaricom.co.ke/test_credentials)
- [Daraja Sandbox](https://developer.safaricom.co.ke/sandbox)
- [API Response Codes](https://developer.safaricom.co.ke/docs#response-codes)
