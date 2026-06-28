const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Initialize database
const db = new sqlite3.Database('./goldmark.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Database Setup
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
        user_id INTEGER PRIMARY KEY,
        balance REAL DEFAULT 1000,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'success',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
    )`);
});

// Routes

// Get user balance
app.get('/api/balance/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    db.get('SELECT balance FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ balance: row.balance });
    });
});

// Create a new user
app.post('/api/user', (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    
    db.run('INSERT INTO users (email) VALUES (?)', [email], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: 'Failed to create user' });
        }
        
        const userId = this.lastID;
        db.run('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 1000], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create wallet' });
            }
            res.status(201).json({ userId, email, balance: 1000 });
        });
    });
});

// Transfer funds
app.post('/api/transfer', (req, res) => {
    const { senderId, receiverId, amount } = req.body;
    
    // Validation
    if (!senderId || !receiverId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (senderId === receiverId) {
        return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }
    
    // Begin transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Transaction error' });
            }
            
            // Check sender balance
            db.get('SELECT balance FROM wallets WHERE user_id = ?', [senderId], (err, row) => {
                if (err || !row) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Sender not found' });
                }
                
                if (row.balance < amount) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Insufficient funds' });
                }
                
                // Check receiver exists
                db.get('SELECT id FROM wallets WHERE user_id = ?', [receiverId], (err, row) => {
                    if (err || !row) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: 'Receiver not found' });
                    }
                    
                    // Deduct from sender
                    db.run('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [amount, senderId], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Transfer failed' });
                        }
                        
                        // Add to receiver
                        db.run('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [amount, receiverId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Transfer failed' });
                            }
                            
                            // Record transaction
                            db.run('INSERT INTO transactions (sender_id, receiver_id, amount) VALUES (?, ?, ?)', [senderId, receiverId, amount], (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: 'Transaction logging failed' });
                                }
                                
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        return res.status(500).json({ error: 'Commit failed' });
                                    }
                                    res.json({ message: 'Transfer successful', amount });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Get transaction history
app.get('/api/transactions/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    db.all(`SELECT * FROM transactions WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC LIMIT 50`, [userId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ transactions: rows });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Goldmark Wallet Server running at http://localhost:${PORT}`);
    console.log(`📊 Database: goldmark.db`);
});
