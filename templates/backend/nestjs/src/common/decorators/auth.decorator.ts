import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

/**
 * Auth decorator that combines JWT authentication and role-based authorization
 * Use with @Roles() to specify required roles
 * Use @Public() to bypass authentication
 */
export const Auth = () =>
	applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), ApiBearerAuth());
