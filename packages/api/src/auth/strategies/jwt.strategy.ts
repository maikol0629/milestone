import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import type { AuthConfig } from '../../config/auth.config.js'
import authConfig from '../../config/auth.config.js'
import { UsersService } from '../../users/users.service.js'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    @Inject(authConfig.KEY) private readonly auth: AuthConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: auth.jwtSecret,
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' })
    }
    return { id: user.id, email: user.email, name: user.name }
  }
}
