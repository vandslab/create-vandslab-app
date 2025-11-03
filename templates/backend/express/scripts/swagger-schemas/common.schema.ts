/**
 * Common/shared Swagger schemas used across multiple endpoints
 */

export const commonSchemas = {
	Error: {
		type: 'object',
		properties: {
			success: { type: 'boolean', example: false },
			message: { type: 'string', example: 'Error message' },
		},
	},

	SuccessResponse: {
		type: 'object',
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'Operation successful' },
		},
	},

	PaginationMeta: {
		type: 'object',
		properties: {
			page: { type: 'number', example: 1 },
			perPage: { type: 'number', example: 10 },
			total: { type: 'number', example: 100 },
			totalPages: { type: 'number', example: 10 },
		},
	},

	PaginatedResponse: {
		type: 'object',
		properties: {
			success: { type: 'boolean', example: true },
			data: {
				type: 'array',
				items: {},
			},
			meta: {
				$ref: '#/components/schemas/PaginationMeta',
			},
		},
	},
};
