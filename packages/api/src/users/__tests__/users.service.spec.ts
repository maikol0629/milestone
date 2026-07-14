import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { UsersService } from '../users.service.js'

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest
    .fn()
    .mockImplementation((pass: string, _hash: string) => Promise.resolve(pass === 'password123')),
}))

describe('UsersService', () => {
  let service: UsersService
  let prisma: PrismaService

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password_hash: '$2b$10$hashedpassword',
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get<UsersService>(UsersService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByEmail('test@example.com')

      expect(result?.id).toBe('user-1')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('should find a user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findById('user-1')

      expect(result?.id).toBe('user-1')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    })

    it('should return null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser)

      const result = await service.create('test@example.com', 'password123', 'Test User')

      expect(result.email).toBe('test@example.com')
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password_hash: '$2b$10$hashedpassword',
          name: 'Test User',
        },
      })
    })
  })

  describe('update', () => {
    it('should update user fields', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' })

      const result = await service.update('user-1', { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      })
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const result = await service.verifyPassword('password123', '$2b$10$somehash')
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const result = await service.verifyPassword('wrongpassword', '$2b$10$somehash')
      expect(result).toBe(false)
    })
  })
})
