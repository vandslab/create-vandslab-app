import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Get required roles from @Roles() decorator
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		// If no roles specified, allow access
		if (!requiredRoles) {
			return true;
		}

		// Get user from request (added by JWT strategy)
		const { user } = context.switchToHttp().getRequest();

		// Check if user has any of the required roles
		const hasRole = requiredRoles.some((role) => user.role === role);

		if (!hasRole) {
			throw new ForbiddenException('You do not have permission to access this resource');
		}

		return true;
	}
}
