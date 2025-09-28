import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { initializeDatabase } from '../database/connection';

const router = Router();

// Helper function to get database instance
const getDatabase = () => {
  return initializeDatabase();
};

// Helper function to execute queries
const query = async (text: string, params?: any[]) => {
  const db = getDatabase();
  return await db.query(text, params);
};

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await query(`
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `, [username, email, hashedPassword]);
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Find user
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const result = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
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
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;