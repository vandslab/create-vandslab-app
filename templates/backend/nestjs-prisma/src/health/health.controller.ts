import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
@ApiTags('Health')
export class HealthController {
	@Get()
	@Public()
	@ApiOperation({ summary: 'Health check endpoint' })
	@ApiResponse({
		status: 200,
		description: 'Service is healthy',
		schema: {
			example: {
				status: 'ok',
				timestamp: '2025-01-25T14:30:00.000Z',
				service: '{{PROJECT_NAME}}-backend',
			},
		},
	})
	getHealth() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: '{{PROJECT_NAME}}-backend',
		};
	}
}
