# B2C Withdrawal Setup Guide - Quick Start

## ✅ Current Status
Your B2C withdrawal system is **already fully implemented**! You just need to configure it.

## 🎯 What Works Now (Simulation Mode)
- ✅ Drivers can withdraw money
- ✅ Withdrawals complete instantly  
- ✅ Transaction history is recorded
- ✅ No real money transfer (safe for testing)

## 🚀 Enable Real M-Pesa Withdrawals (3 Steps)

### Step 1: Get Security Credential

1. **Login to Daraja Portal**
   - Go to: https://developer.safaricom.co.ke/
   - Login with your credentials

2. **Open Your App**
   - Click "My Apps" → Select your B2C app
   - Or create a new app if needed

3. **Generate Credential**
   - Find "Security Credential" section
   - Click "Generate Security Credential" button
   - Copy the long string (example: `Ag8bCdE2fG3h...`)

4. **Save It**
   - You'll use this in Step 2

### Step 2: Start ngrok (Expose Your Server)

```bash
# In a new terminal window:
ngrok http 5000

# You'll see output like:
# Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
# Copy the https URL (e.g., https://abc123.ngrok-free.app)
```

**Keep this terminal open!** ngrok must run while testing.

### Step 3: Update .env File

Open `.env` file and update these lines:

```bash
# 1. Add your security credential from Step 1
MPESA_SECURITY_CREDENTIAL=Ag8bCdE2fG3h...  # Paste your actual credential here

# 2. Update callback URLs with your ngrok URL from Step 2
MPESA_CALLBACK_URL=https://abc123.ngrok-free.app/api/mpesa/callback
MPESA_B2C_RESULT_URL=https://abc123.ngrok-free.app/api/mpesa/b2c-result
MPESA_B2C_TIMEOUT_URL=https://abc123.ngrok-free.app/api/mpesa/b2c-timeout

# Replace 'abc123.ngrok-free.app' with your actual ngrok domain
```

### Step 4: Restart Backend

```bash
# Stop your Flask server (Ctrl+C)
# Start it again:
python movers.py

# You should see in the logs:
# "Using real M-Pesa B2C API"
```

## 🧪 Testing Real Withdrawals

### Test with Sandbox

1. **Complete some orders** to earn money (or add test earnings)
2. **Go to Driver Wallet** in your app
3. **Enter withdrawal details:**
   - Amount: 50 KES (start small for testing)
   - Phone: Your actual Safaricom number (0712345678)
4. **Click Withdraw**
5. **Check your phone** - you should receive M-Pesa instantly!

### What Happens:

```
1. Driver clicks "Withdraw KES 50"
2. Backend calls M-Pesa B2C API
3. M-Pesa processes payment (5-30 seconds)
4. Money sent to driver's phone
5. M-Pesa calls your /api/mpesa/b2c-result
6. System updates transaction as "completed"
7. Driver sees success notification
```

## 🔍 Monitoring Withdrawals

### Check Backend Logs

Your Flask console will show:
```
=== Initiating B2C Payment ===
Amount: KES 50
Phone: 254712345678
Transaction ID: WTH-ABC12345
✓ B2C payment initiated successfully!

=== B2C RESULT CALLBACK RECEIVED ===
✓ Transaction SUCCESSFUL
M-Pesa Receipt: NLJ7RT61SV
✓ Withdrawal completed
```

### Check Database

```bash
# In Python terminal:
python3
>>> from movers import app, db, Transaction
>>> with app.app_context():
...     withdrawals = Transaction.query.filter_by(type='withdrawal').all()
...     for w in withdrawals:
...         print(f"{w.transaction_id}: {w.status} - KES {w.amount}")
```

## 📱 Testing Scenarios

### Scenario 1: Successful Withdrawal
- Amount: 50 KES
- Phone: Valid Safaricom number
- Expected: Money received, status = 'completed'

### Scenario 2: Insufficient Balance
- Amount: 10000 KES (more than available)
- Expected: Error message, no deduction

### Scenario 3: Invalid Phone
- Phone: 0799999999 (non-existent)
- Expected: Transaction fails, money refunded

## 🐛 Troubleshooting

### "Failed to authenticate with M-Pesa"
- ✅ Check `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` in .env
- ✅ Verify credentials from Daraja portal

### "Transaction timeout"
- ✅ Check ngrok is running
- ✅ Verify callback URLs have correct ngrok domain
- ✅ Check Flask server is running

### "Security Credential invalid"
- ✅ Generate new credential from Daraja portal
- ✅ Copy entire string (no spaces/line breaks)
- ✅ Update in .env and restart server

### No money received
- ✅ Check phone number format (254XXXXXXXXX)
- ✅ Verify you're using a real Safaricom number
- ✅ Check backend logs for errors
- ✅ Verify B2C app has sufficient balance (production only)

## 💰 Sandbox vs Production

### Sandbox (Current Setup)
- ✅ Free testing
- ✅ No real money
- ✅ Use test credentials
- ✅ Perfect for development
- Short Code: 600996
- Phone: Any Safaricom number works

### Production (When Going Live)
- ❌ Requires real business account
- ❌ Real money transferred
- ❌ Safaricom charges apply
- Need: Business registration, KRA PIN, business short code

## 📊 Withdrawal Limits

Currently configured in your system:
```
Minimum: KES 20
Maximum: KES 50,000 per transaction
Available: Driver's released earnings only (not pending escrow)
```

## 🎯 Quick Test Command

Run this to simulate a complete flow:

```bash
# Start all services
# Terminal 1: Start Flask
python movers.py

# Terminal 2: Start ngrok
ngrok http 5000

# Terminal 3: Start React frontend
cd moving-app-frontend
npm start

# Then test withdrawal through the UI
```

## 📚 Additional Resources

- **Full Guide**: Read `MPESA_B2C_COMPLETE_GUIDE.md` for detailed explanations
- **Daraja Docs**: https://developer.safaricom.co.ke/Documentation
- **API Reference**: Check B2C section in Daraja portal
- **Support**: Safaricom developer support via portal

## ✨ Key Features Already Implemented

1. **Automatic Refunds**: If withdrawal fails, money returns to driver wallet
2. **Transaction Tracking**: All withdrawals logged in database
3. **Notifications**: Drivers get real-time updates
4. **Phone Validation**: Automatic formatting (0712 → 254712)
5. **Balance Checks**: Can't withdraw more than available
6. **Escrow Protection**: Only released earnings can be withdrawn
7. **Receipt Storage**: M-Pesa receipt numbers saved
8. **Error Handling**: Graceful failure with clear messages

## 🎉 You're All Set!

Your B2C withdrawal system is production-ready. Just configure the credentials and you're good to go!

**Need help?** Check the troubleshooting section or refer to the detailed guide.
