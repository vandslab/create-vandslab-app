/**
 * Authentication-related Swagger schemas
 */

export const authSchemas = {
	User: {
		type: 'object',
		properties: {
			id: { type: 'string', example: 'clx1234567890' },
			email: { type: 'string', format: 'email', example: 'user@example.com' },
			createdAt: { type: 'string', format: 'date-time', example: '2025-11-03T10:30:00.000Z' },
			updatedAt: { type: 'string', format: 'date-time', example: '2025-11-03T10:30:00.000Z' },
		},
	},

	CreateUserRequest: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				example: 'user@example.com',
			},
			password: {
				type: 'string',
				format: 'password',
				minLength: 8,
				example: 'SecurePass123!',
			},
		},
	},

	CreateUserResponse: {
		type: 'object',
		properties: {
			success: { type: 'boolean', example: true },
			data: {
				$ref: '#/components/schemas/User',
			},
		},
	},

	LoginRequest: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				example: 'user@example.com',
			},
			password: {
				type: 'string',
				format: 'password',
				example: 'SecurePass123!',
			},
		},
	},

	LoginResponse: {
		type: 'object',
		properties: {
			success: { type: 'boolean', example: true },
			data: {
				type: 'object',
				properties: {
					token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
					user: {
						$ref: '#/components/schemas/User',
					},
				},
			},
		},
	},
};
