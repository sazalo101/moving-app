# Moving App

A comprehensive moving and logistics application with integrated M-Pesa payments.

## Features

- 🚗 **Driver Booking System**: Book drivers for moving services
- 💰 **M-Pesa Integration**: Pay securely via M-Pesa Daraja API
- 👤 **User Dashboard**: Track orders, manage wallet, view history
- 🚚 **Driver Dashboard**: Accept orders, manage earnings, track deliveries
- 👨‍💼 **Admin Panel**: Manage users, drivers, and support tickets
- 📱 **Real-time Tracking**: Monitor driver location and order status
- 💳 **Wallet System**: Deposit, withdraw, and manage funds

## How to Run the Application

### Prerequisites

- **Python 3.8+** installed
- **Node.js and npm** installed
- **M-Pesa Daraja API credentials** (see setup guide below)

### 1. Backend Setup (Python/Flask)

1. **Install dependencies:**
   ```sh
   pip install flask flask-sqlalchemy flask-cors requests python-dotenv
   ```

2. **Configure M-Pesa credentials:**
   - Copy `.env.example` to `.env`
   - Add your Daraja API credentials (see DARAJA_SETUP_GUIDE.md)

3. **Start the backend:**
   ```sh
   python3 movers.py
   ```
   Or:
   ```sh
   python movers.py
   ```

### 2. Frontend Setup (React)

1. **Navigate to frontend directory:**
   ```sh
   cd moving-app-frontend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the frontend:**
   ```sh
   npm start
   ```

The application will open at `http://localhost:3000`

## M-Pesa Integration Setup

This application uses the official Safaricom Daraja API for M-Pesa payments.

### Quick Setup

1. **Create Daraja Account**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
2. **Get API Credentials**: Consumer Key and Consumer Secret
3. **Configure `.env`**: Add your credentials
4. **Set up Callback URL**: Use ngrok for local testing

📖 **Detailed Instructions**: See [DARAJA_SETUP_GUIDE.md](DARAJA_SETUP_GUIDE.md)

📚 **Full Documentation**: See [MPESA_INTEGRATION.md](MPESA_INTEGRATION.md)

## Project Structure

```
moving-app/
├── movers.py                 # Backend Flask application
├── instance/                 # SQLite database
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
├── DARAJA_SETUP_GUIDE.md     # Quick start guide for M-Pesa
├── MPESA_INTEGRATION.md      # Complete M-Pesa documentation
└── moving-app-frontend/      # React frontend
    ├── src/
    │   ├── components/       # React components
    │   │   ├── user/        # User components (wallet, booking, etc.)
    │   │   ├── driver/      # Driver components
    │   │   ├── admin/       # Admin components
    │   │   └── auth/        # Authentication components
    │   └── context/         # React context (auth, etc.)
    └── public/              # Static files
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### M-Pesa Payments
- `POST /api/mpesa/stk-push` - Initiate M-Pesa payment
- `POST /api/mpesa/callback` - Handle M-Pesa callback
- `GET /api/mpesa/check-status/<transaction_id>` - Check payment status

### User Endpoints
- `GET /api/user/<user_id>` - Get user details
- `GET /api/user/payment-history/<user_id>` - Get transaction history
- `GET /api/user/order-history/<user_id>` - Get order history

### Driver Endpoints
- `GET /api/driver/order-history/<driver_id>` - Get driver orders
- `POST /api/driver/toggle-availability` - Toggle driver availability

### Booking
- `POST /api/book-driver` - Create new booking
- `POST /api/driver/accept-order` - Accept booking

## Testing M-Pesa Integration

### Sandbox Testing

1. Use sandbox credentials from Daraja portal
2. Test phone number: Any Kenyan number (e.g., `0712345678`)
3. Test amount: Any amount between KES 1 - 150,000
4. The sandbox simulates STK Push without real money

### Local Testing with Ngrok

```bash
# Start backend
python movers.py

# In another terminal, start ngrok
ngrok http 5000

# Copy the https URL and update MPESA_CALLBACK_URL in .env
```

## Default Test Accounts

The application creates a default admin account on first run:
- **Email**: admin@moving.com
- **Password**: admin123

## Technologies Used

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Database
- **M-Pesa Daraja API**: Payment processing
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **React**: UI framework
- **React Router**: Navigation
- **Axios**: HTTP client
- **Leaflet**: Map integration
- **React-Toastify**: Notifications

## Troubleshooting

### Backend Issues

**Port already in use:**
```sh
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Database errors:**
```sh
# Recreate database
rm instance/moving_app.db
python movers.py
```

### M-Pesa Issues

**"Failed to authenticate with M-Pesa API":**
- Check Consumer Key and Secret in `.env`
- Ensure credentials are from the same app

**"Callback not received":**
- Verify ngrok is running
- Check callback URL is HTTPS
- Ensure URL is registered in Daraja portal

See [MPESA_INTEGRATION.md](MPESA_INTEGRATION.md) for more troubleshooting tips.

## Production Deployment

Before deploying to production:

1. ✅ Get production Daraja credentials
2. ✅ Set up HTTPS domain
3. ✅ Configure production callback URL
4. ✅ Update environment variables
5. ✅ Set up database backups
6. ✅ Configure error monitoring
7. ✅ Add rate limiting
8. ✅ Test with real transactions

See production checklist in [MPESA_INTEGRATION.md](MPESA_INTEGRATION.md)

## Support & Documentation

- 📖 [M-Pesa Integration Guide](MPESA_INTEGRATION.md)
- 🚀 [Daraja Setup Guide](DARAJA_SETUP_GUIDE.md)
- 🌐 [Daraja API Docs](https://developer.safaricom.co.ke/docs)
- 💬 Contact: digitalapi@safaricom.co.ke

## License

This project is for educational purposes.

## Contributing

Contributions are welcome! Please create a pull request with your changes.

---

Enjoy using the Moving App! 🚀

