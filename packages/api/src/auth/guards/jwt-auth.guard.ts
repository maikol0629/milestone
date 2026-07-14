import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import type { AuthenticatedUser } from '../../common/current-user.decorator.js'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const message =
        info instanceof Error
          ? info.message === 'No auth token'
            ? 'Token de autenticación requerido'
            : 'Token inválido o expirado'
          : 'No autorizado'
      throw err ?? new UnauthorizedException({ code: 'UNAUTHORIZED', message })
    }
    return user
  }
}
