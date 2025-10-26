import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './entities/activity-log.entity';
import { Auth } from '../common/decorators/auth.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('activity-logs')
@ApiTags('Activity Logs')
@Auth() // Requires authentication for all endpoints
export class ActivityLogsController {
	constructor(private readonly activityLogsService: ActivityLogsService) {}

	@Get()
	@Roles(Role.ADMIN) // Only admins can view all logs
	@ApiOperation({ summary: 'Get all activity logs (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns all activity logs',
		type: [ActivityLog],
	})
	async findAll(): Promise<ActivityLog[]> {
		return this.activityLogsService.findAll();
	}

	@Get('user/:userId')
	@Roles(Role.ADMIN) // Only admins can view user logs
	@ApiOperation({ summary: 'Get activity logs by user ID (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns activity logs for specific user',
		type: [ActivityLog],
	})
	async findByUserId(@Param('userId') userId: string): Promise<ActivityLog[]> {
		return this.activityLogsService.findByUserId(userId);
	}

	@Get('action/:action')
	@Roles(Role.ADMIN) // Only admins can filter by action
	@ApiOperation({ summary: 'Get activity logs by action (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns activity logs for specific action',
		type: [ActivityLog],
	})
	async findByAction(@Param('action') action: string): Promise<ActivityLog[]> {
		return this.activityLogsService.findByAction(action);
	}
}