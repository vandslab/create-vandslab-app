import { AuthError, InvalidCredentialsError } from '@/exceptions/auth-error';
import prisma from '@/utils/prisma-client';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '@/config/jwt';

export class AuthService {
  private readonly saltRounds = 10;

  constructor() {}

  /**
   * Register a new user
   * @param email User email
   * @param password Plain text password
   * @param name Optional user name
   * @returns Created user (without password)
   */
  async register(email: string, password: string, name?: string): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError('Email already in use', 'EMAIL_IN_USE', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Login user and generate JWT token
   * @param email User email
   * @param password Plain text password
   * @returns JWT token and user data
   */
  async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @returns User data (without password)
   */
  async me(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Legacy create method (for backwards compatibility)
   * @deprecated Use register() instead
   */
  async create(email: string, password: string): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError('Email already in use', 'EMAIL_IN_USE', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return newUser;
  }
}
