/**
 * Central export point for all Swagger schemas
 * This file aggregates all schema definitions from different modules
 */

import { authSchemas } from './auth.schema';
import { healthSchemas } from './health.schema';
import { commonSchemas } from './common.schema';

/**
 * All Swagger schemas combined
 * Use this in swagger-autogen.ts configuration
 */
export const allSchemas = {
	...authSchemas,
	...healthSchemas,
	...commonSchemas,
};

/**
 * Export individual schema groups for direct import if needed
 */
export { authSchemas, healthSchemas, commonSchemas };
