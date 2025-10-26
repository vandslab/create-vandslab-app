/**
 * Activity Log Interface
 * Defines the structure for activity logging data
 */
export interface ActivityLogData {
	userId?: string;
	action: string;
	resource?: string;
	resourceId?: string;
	metadata?: any;
}
