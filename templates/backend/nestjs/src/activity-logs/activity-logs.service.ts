import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

export interface CreateActivityLogDto {
	userId?: string;
	action: string;
	resource?: string;
	resourceId?: string;
	ipAddress?: string;
	userAgent?: string;
	metadata?: any;
}

@Injectable()
export class ActivityLogsService {
	constructor(
		@InjectRepository(ActivityLog)
		private activityLogsRepository: Repository<ActivityLog>,
	) {}

	async create(data: CreateActivityLogDto): Promise<ActivityLog> {
		const activityLog = this.activityLogsRepository.create(data);
		return await this.activityLogsRepository.save(activityLog);
	}

	async findAll(): Promise<ActivityLog[]> {
		return await this.activityLogsRepository.find({
			order: {
				createdAt: 'DESC',
			},
			take: 100, // Limit to last 100 logs
		});
	}

	async findByUserId(userId: string): Promise<ActivityLog[]> {
		return await this.activityLogsRepository.find({
			where: { userId },
			order: {
				createdAt: 'DESC',
			},
		});
	}

	async findByAction(action: string): Promise<ActivityLog[]> {
		return await this.activityLogsRepository.find({
			where: { action },
			order: {
				createdAt: 'DESC',
			},
		});
	}
}