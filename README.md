# 💰 Goldmark Wallet

A secure, modern wallet transfer application built with Node.js and Express.

## Features

✅ **Create Accounts** - Sign up with email  
✅ **Transfer Funds** - Send money between users securely  
✅ **Transaction History** - Track all transfers  
✅ **Real-time Balance** - Check wallet balance instantly  
✅ **Secure Transactions** - Database transaction support  

## Installation

### Prerequisites
- Node.js (v14+)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shyam102920/goldmark.git
   cd goldmark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

### Development

For development with auto-restart:
```bash
npm run dev
```

## Usage

1. **Create an Account**
   - Enter your email address
   - You'll receive a User ID (save this!)
   - Starting balance: $1000

2. **Send a Transfer**
   - Enter your User ID
   - Enter recipient's User ID
   - Enter amount
   - Click "Send Transfer"

3. **View History**
   - Enter your User ID to see all transactions

## API Endpoints

### POST `/api/user`
Create a new user account
```json
{
  "email": "user@example.com"
}
```

### POST `/api/transfer`
Transfer funds between users
```json
{
  "senderId": 1,
  "receiverId": 2,
  "amount": 50
}
```

### GET `/api/balance/:userId`
Get user's current balance

### GET `/api/transactions/:userId`
Get transaction history for a user

## Database

The app uses SQLite with the following tables:

- **users** - User accounts with email
- **wallets** - User balances
- **transactions** - Transaction history

## Security Features

- ✅ Input validation
- ✅ Database transactions (ACID compliance)
- ✅ Error handling
- ✅ Duplicate user prevention
- ✅ Balance verification

## Project Structure

```
goldmark/
├── server.js           # Express server & API
├── public/
│   ├── index.html      # Main page
│   ├── styles.css      # Styling
│   └── script.js       # Frontend logic
├── goldmark.db         # SQLite database (auto-created)
├── package.json        # Dependencies
└── README.md          # This file
```

## License

MIT License - Feel free to use this project!

## Support

For issues or questions, open a GitHub issue in the repository.
