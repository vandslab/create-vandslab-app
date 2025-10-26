import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';

@Module({
	controllers: [ActivityLogsController],
	providers: [ActivityLogsService],
	exports: [ActivityLogsService], // Export service for use in other modules
})
export class ActivityLogsModule {}