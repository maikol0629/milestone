jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}))

import { ConflictException, HttpStatus, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'

import { AuthController } from '../src/auth/auth.controller.js'
import { AuthService } from '../src/auth/auth.service.js'
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js'

describe('AuthController (e2e)', () => {
  let app: any
  let mockAuthService: Record<string, jest.Mock>

  beforeAll(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = { email: 'test@example.com', password: 'password123', name: 'Test User' }

      mockAuthService.register.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: '1', email: userData.email, name: userData.name },
      })

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userData)
        .expect(HttpStatus.CREATED)

      expect(response.body.access_token).toBe('access-token')
      expect(response.body.refresh_token).toBe('refresh-token')
      expect(response.body.user.email).toBe(userData.email)
    })

    it('should return 409 when email already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException({ code: 'EMAIL_EXISTS', message: 'El email ya está registrado' }),
      )

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123', name: 'Test' })
        .expect(HttpStatus.CONFLICT)
    })

    it('should return 400 for invalid data (short password)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123', name: 'Test' })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('should return 400 for invalid data (missing email)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'password123', name: 'Test' })
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      })

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(HttpStatus.OK)

      expect(response.body.access_token).toBe('access-token')
      expect(response.body.user.email).toBe('test@example.com')
    })

    it('should return 401 with wrong password', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message: 'Email o contraseña inválidos',
        }),
      )

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 400 for invalid login data', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      mockAuthService.refresh.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      })

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' })
        .expect(HttpStatus.OK)

      expect(response.body.access_token).toBe('new-access-token')
      expect(response.body.refresh_token).toBe('new-refresh-token')
    })

    it('should return 401 with invalid refresh token', async () => {
      mockAuthService.refresh.mockRejectedValue(
        new UnauthorizedException({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token inválido o expirado',
        }),
      )

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid' })
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 400 for missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refresh_token: 'valid-refresh-token' })
        .expect(HttpStatus.OK)
    })
  })
})
