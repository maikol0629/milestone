import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'

import { authConfig } from '../../config/index.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { UsersService } from '../../users/users.service.js'
import { AuthService } from '../auth.service.js'

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest
    .fn()
    .mockImplementation((pass: string, _hash: string) => Promise.resolve(pass === 'password123')),
}))

describe('AuthService', () => {
  let authService: AuthService
  let usersService: UsersService
  let prisma: PrismaService
  let jwtService: JwtService

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password_hash: '',
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-access-token'),
          },
        },
        {
          provide: authConfig.KEY,
          useValue: { refreshExpiresIn: '7d' },
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    usersService = module.get<UsersService>(UsersService)
    prisma = module.get<PrismaService>(PrismaService)
    jwtService = module.get<JwtService>(JwtService)
  })

  describe('register', () => {
    it('should register a new user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null)
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser)
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({
        id: 'rt-id',
        token_hash: 'hash',
        user_id: mockUser.id,
        expires_at: new Date(),
        created_at: new Date(),
      })

      const result = await authService.register('test@example.com', 'password123', 'Test User')

      expect(result).toHaveProperty('access_token', 'test-access-token')
      expect(result).toHaveProperty('refresh_token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw ConflictException if email exists', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser)

      await expect(
        authService.register('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await require('bcrypt').hash('password123', 10)
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ ...mockUser, password_hash: hashedPassword })
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({
        id: 'rt-id',
        token_hash: 'hash',
        user_id: mockUser.id,
        expires_at: new Date(),
        created_at: new Date(),
      })

      const result = await authService.login('test@example.com', 'password123')

      expect(result).toHaveProperty('access_token')
      expect(result).toHaveProperty('refresh_token')
    })

    it('should throw UnauthorizedException with wrong password', async () => {
      const hashedPassword = await require('bcrypt').hash('correct-password', 10)
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ ...mockUser, password_hash: hashedPassword })

      await expect(authService.login('test@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null)

      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
