# Quick Start Guide: M-Pesa Daraja API Setup

## Step 1: Create Daraja Account

1. Go to [Daraja Developer Portal](https://developer.safaricom.co.ke/)
2. Click "Sign Up" and create an account
3. Verify your email address
4. Log in to the portal

## Step 2: Create an App

1. Once logged in, go to "My Apps"
2. Click "Create New App"
3. Fill in the app details:
   - **App Name**: MovingApp (or your preferred name)
   - **Description**: Moving app wallet system
4. Click "Create"

## Step 3: Get Your Credentials

After creating the app, you'll see:
- **Consumer Key**: Copy this
- **Consumer Secret**: Copy this

For sandbox testing, you'll also need:
- **Business Short Code**: `174379` (sandbox default)
- **Passkey**: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` (sandbox default)

## Step 4: Configure Your Application

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```env
MPESA_CONSUMER_KEY=your_consumer_key_from_daraja
MPESA_CONSUMER_SECRET=your_consumer_secret_from_daraja
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox
```

## Step 5: Set Up Callback URL (for Local Testing)

Since Daraja requires a public HTTPS URL for callbacks, use ngrok for local testing:

1. **Install ngrok:**
   - Download from [ngrok.com/download](https://ngrok.com/download)
   - Or use: `npm install -g ngrok` (if you have Node.js)

2. **Start your Flask server:**
```bash
python movers.py
```

3. **In a new terminal, start ngrok:**
```bash
ngrok http 5000
```

4. **Copy the HTTPS URL** (looks like `https://abc123.ngrok.io`)

5. **Update your .env:**
```env
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
```

6. **Register the callback URL in Daraja:**
   - Go to your app in Daraja portal
   - Navigate to "Production URLs" or "Callback URLs"
   - Add your ngrok URL: `https://abc123.ngrok.io/api/mpesa/callback`

## Step 6: Recreate Database

The Transaction model has been updated with new fields. Recreate the database:

```bash
# Delete old database
rm instance/moving_app.db

# Start the server (it will create a new database)
python movers.py
```

## Step 7: Test the Integration

1. **Start your backend:**
```bash
python movers.py
```

2. **Start your frontend:**
```bash
cd moving-app-frontend
npm start
```

3. **Test a payment:**
   - Log in to the application
   - Go to "My Wallet"
   - Enter phone number: `0712345678` (or any Kenyan number)
   - Enter amount: `100`
   - Click "Pay via M-Pesa"
   - Check the response in the browser console

## Sandbox Test Credentials

For testing in sandbox mode:

**Business Short Code:** `174379`
**Passkey:** `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

**Test Phone Numbers:**
- Use any valid Kenyan phone number format
- `0712345678` or `254712345678`
- In sandbox, the STK Push is simulated

**Test Amounts:**
- Minimum: KES 1
- Maximum: KES 150,000

## Common Issues

### "Failed to authenticate with M-Pesa API"
- Double-check Consumer Key and Secret
- Ensure they're from the same app in Daraja portal
- Check for extra spaces in .env file

### "Callback not received"
- Make sure ngrok is running
- Verify callback URL is registered in Daraja portal
- Check that callback URL uses HTTPS (not HTTP)
- Ensure Flask server is running

### "Invalid phone number"
- Use Kenyan phone numbers only
- Safaricom numbers: 0700-0799, 0110-0119
- Format: 0712345678 or 254712345678

## Production Setup

When ready for production:

1. **Get Go-Live Approval:**
   - Contact Safaricom API team
   - Provide business details
   - Get production credentials

2. **Update .env for Production:**
```env
MPESA_CONSUMER_KEY=production_consumer_key
MPESA_CONSUMER_SECRET=production_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_paybill_number
MPESA_PASSKEY=production_passkey
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

3. **Set up HTTPS:**
   - Use a proper domain with SSL certificate
   - Deploy to production server
   - Update callback URL in Daraja portal

## Support

**Daraja Support:**
- Email: digitalapi@safaricom.co.ke
- Documentation: https://developer.safaricom.co.ke/docs
- Community: Daraja Developer Community

**Need Help?**
- Check logs: Flask server console
- Check browser console: Press F12
- Review documentation: See MPESA_INTEGRATION.md

## Next Steps

Once testing is successful:
1. Review security best practices
2. Add error handling
3. Implement transaction reconciliation
4. Set up monitoring and alerts
5. Plan production deployment
