import { AuthService } from '@services/auth.service';
import { NextFunction, Request, Response } from 'express';

const authService = new AuthService();

export class AuthController {
  constructor() {}

  /**
   * Register a new user
   * POST /auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const user = await authService.register(email, password, name);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /auth/me
   * Requires authentication
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // userId is added by authenticateToken middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const user = await authService.me(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   * Note: With JWT, logout is typically handled client-side by removing the token
   * This endpoint is mainly for consistency and can be used for audit logging
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // For JWT, there's no server-side session to destroy
      // Client should remove the token from storage
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Legacy create method (for backwards compatibility)
   * POST /auth/create
   * @deprecated Use register() instead
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const response = await authService.create(email, password);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
