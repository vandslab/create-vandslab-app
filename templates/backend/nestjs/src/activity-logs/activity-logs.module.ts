import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ActivityLog])],
	controllers: [ActivityLogsController],
	providers: [ActivityLogsService],
	exports: [ActivityLogsService], // Export service for use in other modules
})
export class ActivityLogsModule {}