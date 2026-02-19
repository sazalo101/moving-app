# M-Pesa Integration Guide

## Overview
This application now supports M-Pesa payments through IntaSend payment gateway. Users can deposit money into their wallet using M-Pesa STK Push (Lipa Na M-Pesa).

## Features Implemented

### 1. **Pay via M-Pesa Button**
- Changed the deposit button to "Pay via M-Pesa"
- Users enter their M-Pesa phone number and amount
- System initiates STK Push to user's phone

### 2. **Backend API Endpoints**

#### `/api/mpesa/stk-push` (POST)
Initiates M-Pesa STK Push payment.

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
  "intasend_data": {...}
}
```

#### `/api/mpesa/callback` (POST)
Handles payment confirmation callback from IntaSend.

**Request Body:**
```json
{
  "api_ref": "transaction-id",
  "status": "COMPLETE",
  "id": "intasend-id"
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
  "created_at": "2025-03-15T14:30:22Z"
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
3. Backend checks status with IntaSend API
4. When payment is confirmed, balance is updated
5. Transaction history is updated

## Setup Instructions

### 1. IntaSend Account Setup

1. Sign up at [IntaSend](https://intasend.com)
2. Get your API keys from the dashboard
3. Add them to `.env` file:

```env
INTASEND_SECRET_KEY=ISSecretKey_test_xxxxx
INTASEND_PUBLIC_KEY=ISPubKey_test_xxxxx
```

### 2. Backend Setup

The backend is already configured to use IntaSend. Make sure:
- Python dependencies are installed: `pip install requests python-dotenv`
- Environment variables are loaded from `.env`
- Flask server is running: `python movers.py`

### 3. Frontend Setup

No additional setup needed. The UserWallet component automatically:
- Loads user's phone number if available
- Validates phone number format (supports 07xx, +254, 254 formats)
- Handles transaction status updates

## Testing

### Test with IntaSend Sandbox

IntaSend provides test credentials that simulate M-Pesa without real money:

**Test Phone Numbers:**
- Any valid Kenyan number (07xx or 254xxx)
- In sandbox mode, all payments auto-complete after a few seconds

**Test Amounts:**
- Minimum: KES 10
- Maximum: KES 250,000

### Testing Flow

1. Login to the application
2. Navigate to "My Wallet"
3. Enter test phone number: `0712345678`
4. Enter amount: `100`
5. Click "Pay via M-Pesa"
6. Wait for simulated STK Push (sandbox auto-completes)
7. Balance should update within 15-20 seconds

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

## Security Notes

1. **API Keys**: Never commit `.env` file to git
2. **HTTPS**: Use HTTPS in production
3. **Validation**: Backend validates all inputs
4. **Callbacks**: Verify callback signature in production

## Troubleshooting

### Issue: "Failed to initiate M-Pesa payment"
- Check if backend is running
- Verify IntaSend API keys in `.env`
- Check backend logs for errors

### Issue: "Payment stuck in pending"
- Transaction may have timed out
- User may have cancelled on their phone
- Check transaction status manually using transaction ID

### Issue: "Invalid phone number"
- Ensure phone number is Kenyan (starts with 07 or 254)
- Remove any spaces or special characters
- Must be at least 10 digits

## Next Steps

To enhance the integration:

1. **Add M-Pesa Withdrawals**: Implement B2C (Business to Customer) payments
2. **Transaction Receipts**: Email/SMS receipts to customers
3. **Webhook Security**: Verify IntaSend callback signatures
4. **Balance History**: Show detailed balance change logs
5. **Auto-refresh Balance**: Real-time balance updates via WebSocket

## Production Checklist

Before going live:

- [ ] Switch from sandbox to production IntaSend keys
- [ ] Set up HTTPS for your domain
- [ ] Configure IntaSend callback URL
- [ ] Add webhook signature verification
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Add rate limiting to prevent abuse
- [ ] Test with real M-Pesa accounts
- [ ] Add transaction reconciliation

## Support

For IntaSend API issues:
- Documentation: https://developers.intasend.com/
- Support: support@intasend.com

For application issues:
- Check backend logs: Flask console output
- Check browser console: Developer tools → Console
- Verify database: Check `Transaction` table
