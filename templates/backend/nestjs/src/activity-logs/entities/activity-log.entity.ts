import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: true })
	userId: string;

	@Column()
	action: string;

	@Column({ nullable: true })
	resource: string;

	@Column({ nullable: true })
	resourceId: string;

	@Column({ nullable: true })
	ipAddress: string;

	@Column({ nullable: true })
	userAgent: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata: any;

	@CreateDateColumn()
	createdAt: Date;
}