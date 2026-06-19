import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'crownridge-super-secret-security-key-2026';

/**
 * Register user
 */
export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role, fallback to SALES_REP
    const allowedRoles = ['ADMIN', 'SALES_REP', 'PROJECT_MANAGER', 'TECH_LEAD'];
    const finalRole = allowedRoles.includes(role) ? role : 'SALES_REP';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during user registration.' });
  }
}

/**
 * Login user
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
}

/**
 * Get profile
 */
export async function getProfile(req, res) {
  return res.json({ user: req.user });
}

/**
 * Get all sales representatives (for assignment dropdowns)
 */
export async function getSalesReps(req, res) {
  try {
    const reps = await prisma.user.findMany({
      where: { role: 'SALES_REP' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    return res.json({ reps });
  } catch (error) {
    console.error('Error fetching sales reps:', error);
    return res.status(500).json({ error: 'Server error fetching sales representatives.' });
  }
}
