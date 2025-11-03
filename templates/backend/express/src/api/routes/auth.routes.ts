import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '@/middlewares/auth';
import { validate } from '@/middlewares/zod-validation';
import { registerSchema, loginSchema } from '@/schemas/auth.schema';

const router: Router = Router();
const authController = new AuthController();

router.post(
	'/register',
	/*
		#swagger.tags = ['Authentication']
		#swagger.summary = 'Register new user'
		#swagger.description = 'Creates a new user account with email, password, and optional name'
		#swagger.requestBody = {
			required: true,
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/CreateUserRequest'
					}
				}
			}
		}
		#swagger.responses[201] = {
			description: "User created successfully",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/CreateUserResponse'
					}
				}
			}
		}
		#swagger.responses[400] = {
			description: "Bad request - Invalid input data",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/Error'
					}
				}
			}
		}
		#swagger.responses[409] = {
			description: "Conflict - Email already in use",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/Error'
					}
				}
			}
		}
	*/
	validate(registerSchema),
	authController.register.bind(authController)
);

router.post(
	'/login',
	/*
		#swagger.tags = ['Authentication']
		#swagger.summary = 'User login'
		#swagger.description = 'Authenticates user with email and password, returns JWT token'
		#swagger.requestBody = {
			required: true,
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/LoginRequest'
					}
				}
			}
		}
		#swagger.responses[200] = {
			description: "Login successful",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/LoginResponse'
					}
				}
			}
		}
		#swagger.responses[401] = {
			description: "Unauthorized - Invalid credentials",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/Error'
					}
				}
			}
		}
	*/
	validate(loginSchema),
	authController.login.bind(authController)
);

router.get(
	'/me',
	/*
		#swagger.tags = ['Authentication']
		#swagger.summary = 'Get current user'
		#swagger.description = 'Returns the authenticated user profile'
		#swagger.security = [{
			"BearerAuth": []
		}]
		#swagger.responses[200] = {
			description: "User profile retrieved successfully",
			content: {
				"application/json": {
					schema: {
						type: "object",
						properties: {
							success: {
								type: "boolean",
								example: true
							},
							data: {
								$ref: '#/components/schemas/User'
							}
						}
					}
				}
			}
		}
		#swagger.responses[401] = {
			description: "Unauthorized - Missing or invalid token",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/Error'
					}
				}
			}
		}
	*/
	authenticateToken,
	authController.me.bind(authController)
);

router.post(
	'/logout',
	/*
		#swagger.tags = ['Authentication']
		#swagger.summary = 'User logout'
		#swagger.description = 'Logs out the current user (client should remove the JWT token)'
		#swagger.security = [{
			"BearerAuth": []
		}]
		#swagger.responses[200] = {
			description: "Logged out successfully",
			content: {
				"application/json": {
					schema: {
						$ref: '#/components/schemas/SuccessResponse'
					}
				}
			}
		}
	*/
	authenticateToken,
	authController.logout.bind(authController)
);

// Legacy endpoint (backwards compatibility)
router.post('/create', authController.create.bind(authController));

export default router;
