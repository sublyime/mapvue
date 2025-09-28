"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const router = (0, express_1.Router)();
const getDatabase = () => {
    return (0, connection_1.initializeDatabase)();
};
const query = async (text, params) => {
    const db = getDatabase();
    return await db.query(text, params);
};
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await query(`
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `, [username, email, hashedPassword]);
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            },
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = await query('SELECT id, username, email, password_hash FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const result = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map