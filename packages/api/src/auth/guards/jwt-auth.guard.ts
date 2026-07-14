import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-parameters
  override handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    _context: any,
    _status?: any,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user
  }
}
