import { createHash, randomBytes } from 'node:crypto'

import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { authConfig, type AuthConfig } from '../config/index.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { UsersService } from '../users/users.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly auth: AuthConfig,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email)
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_EXISTS', message: 'El email ya está registrado' })
    }

    const user = await this.usersService.create(email, password, name)
    const tokens = await this.generateTokens(user.id, user.email)

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: { id: user.id, email: user.email, name: user.name },
    }
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña inválidos',
      })
    }

    const valid = await this.usersService.verifyPassword(password, user.password_hash)
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña inválidos',
      })
    }

    const tokens = await this.generateTokens(user.id, user.email)

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: { id: user.id, email: user.email, name: user.name },
    }
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken)

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    })

    if (!stored || stored.expires_at < new Date()) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token inválido o expirado',
      })
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } })

    const tokens = await this.generateTokens(stored.user.id, stored.user.email)

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken)
    await this.prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } })
  }

  private async generateTokens(userId: string, email: string) {
    const access_token = this.jwtService.sign({ sub: userId, email })

    const rawToken = randomBytes(48).toString('hex')
    const tokenHash = this.hashToken(rawToken)

    const expiresAt = this.parseExpiry(this.auth.refreshExpiresIn)

    await this.prisma.refreshToken.create({
      data: {
        token_hash: tokenHash,
        user_id: userId,
        expires_at: expiresAt,
      },
    })

    return { access_token, refresh_token: rawToken }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private parseExpiry(expiry: string): Date {
    const re = /^(\d+)([smhd])$/
    const execResult = re.exec(expiry)
    if (!execResult) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const value = Number.parseInt(execResult[1] as string, 10)
    const unit = execResult[2] as string
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }
    const multiplier = multipliers[unit] ?? 24 * 60 * 60 * 1000
    return new Date(Date.now() + value * multiplier)
  }
}
