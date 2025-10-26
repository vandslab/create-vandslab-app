import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { ActionType } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('activity-logs')
@ApiTags('Activity Logs')
@ApiBearerAuth()
export class ActivityLogsController {
	constructor(private readonly activityLogsService: ActivityLogsService) {}

	@Get()
	@Roles(Role.ADMIN) // Only admins can view all logs
	@ApiOperation({ summary: 'Get all activity logs (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns all activity logs',
	})
	async findAll() {
		return this.activityLogsService.findAll();
	}

	@Get('user/:userId')
	@Roles(Role.ADMIN) // Only admins can view user logs
	@ApiOperation({ summary: 'Get activity logs by user ID (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns activity logs for specific user',
	})
	async findByUserId(@Param('userId') userId: string) {
		return this.activityLogsService.findByUserId(userId);
	}

	@Get('action/:action')
	@Roles(Role.ADMIN) // Only admins can filter by action
	@ApiOperation({ summary: 'Get activity logs by action (Admin only)' })
	@ApiResponse({
		status: 200,
		description: 'Returns activity logs for specific action',
	})
	async findByAction(@Param('action') action: string) {
		return this.activityLogsService.findByAction(action as ActionType);
	}
}