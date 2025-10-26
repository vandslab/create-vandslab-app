import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
	sub: string; // user id
	email: string;
	role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET') || 'development-secret-key',
		});
	}

	async validate(payload: JwtPayload) {
		// This will be attached to request.user
		return {
			userId: payload.sub,
			email: payload.email,
			role: payload.role,
		};
	}
}
