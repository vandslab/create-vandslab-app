/**
 * Health check-related Swagger schemas
 */

export const healthSchemas = {
	HealthStatus: {
		type: 'object',
		properties: {
			status: {
				type: 'string',
				enum: ['healthy', 'degraded', 'down'],
				example: 'healthy',
			},
			timestamp: {
				type: 'string',
				format: 'date-time',
				example: '2025-11-03T10:30:00.000Z',
			},
		},
	},

	DetailedHealthResponse: {
		type: 'object',
		properties: {
			status: {
				type: 'string',
				example: 'healthy',
			},
			database: {
				type: 'object',
				properties: {
					connected: { type: 'boolean', example: true },
					latency: { type: 'number', example: 12 },
				},
			},
			uptime: {
				type: 'number',
				example: 3600,
			},
		},
	},

	ServiceHealthResponse: {
		type: 'object',
		properties: {
			service: {
				type: 'string',
				example: 'database',
			},
			status: {
				type: 'string',
				enum: ['healthy', 'degraded', 'down'],
				example: 'healthy',
			},
			lastChecked: {
				type: 'string',
				format: 'date-time',
				example: '2025-11-03T10:30:00.000Z',
			},
		},
	},
};
