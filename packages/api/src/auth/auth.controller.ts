import { loginSchema, refreshTokenSchema, registerSchema } from '@milestone/shared'
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { RegisterDto, LoginDto, RefreshTokenDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { AuthService } from './auth.service.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body(createZodPipe(registerSchema)) body: unknown) {
    const { email, password, name } = body as { email: string; password: string; name: string }
    return this.authService.register(email, password, name)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body(createZodPipe(loginSchema)) body: unknown) {
    const { email, password } = body as { email: string; password: string }
    return this.authService.login(email, password)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body(createZodPipe(refreshTokenSchema)) body: unknown) {
    const { refresh_token } = body as { refresh_token: string }
    return this.authService.refresh(refresh_token)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Session closed successfully' })
  async logout(@Body(createZodPipe(refreshTokenSchema)) body: unknown) {
    const { refresh_token } = body as { refresh_token: string }
    await this.authService.logout(refresh_token)
    return { message: 'Sesión cerrada correctamente' }
  }
}
