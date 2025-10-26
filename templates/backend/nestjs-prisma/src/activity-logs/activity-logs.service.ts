import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionType, Prisma } from '@prisma/client';

export interface CreateActivityLogDto {
	userId: string;
	action: ActionType;
	entity: string;
	entityId?: string;
	details?: any;
	ipAddress?: string;
	userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
	constructor(
		private prisma: PrismaService,
	) {}

	async create(data: CreateActivityLogDto) {
		return await this.prisma.activityLog.create({
			data: {
				userId: data.userId,
				action: data.action,
				entity: data.entity,
				entityId: data.entityId,
				details: data.details,
				ipAddress: data.ipAddress,
				userAgent: data.userAgent,
			},
		});
	}

	async findAll() {
		return await this.prisma.activityLog.findMany({
			orderBy: {
				timestamp: 'desc',
			},
			take: 100, // Limit to last 100 logs
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}

	async findByUserId(userId: string) {
		return await this.prisma.activityLog.findMany({
			where: { userId },
			orderBy: {
				timestamp: 'desc',
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}

	async findByAction(action: ActionType) {
		return await this.prisma.activityLog.findMany({
			where: { action },
			orderBy: {
				timestamp: 'desc',
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}

	async findByEntity(entity: string, entityId?: string) {
		return await this.prisma.activityLog.findMany({
			where: {
				entity,
				...(entityId && { entityId }),
			},
			orderBy: {
				timestamp: 'desc',
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}
}