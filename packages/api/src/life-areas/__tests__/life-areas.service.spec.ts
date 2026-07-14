import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { LifeAreasService } from '../life-areas.service.js'

describe('LifeAreasService', () => {
  let service: LifeAreasService
  let prisma: PrismaService

  const mockLifeArea = {
    id: 'la-1',
    name: 'Health',
    color: '#ff0000',
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockPrisma = {
    lifeArea: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifeAreasService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<LifeAreasService>(LifeAreasService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return all life areas for a user', async () => {
      mockPrisma.lifeArea.findMany.mockResolvedValue([mockLifeArea])

      const result = await service.findAll('user-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.lifeArea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          orderBy: { name: 'asc' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return a life area by id', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(mockLifeArea)

      const result = await service.findOne('la-1', 'user-1')
      expect(result.id).toBe('la-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new life area', async () => {
      mockPrisma.lifeArea.create.mockResolvedValue(mockLifeArea)

      const result = await service.create('user-1', { name: 'Health', color: '#ff0000' })

      expect(result.id).toBe('la-1')
      expect(mockPrisma.lifeArea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Health', user_id: 'user-1' }),
        }),
      )
    })

    it('should create with null color when not provided', async () => {
      mockPrisma.lifeArea.create.mockResolvedValue({ ...mockLifeArea, color: null })

      const result = await service.create('user-1', { name: 'Health' })

      expect(result.color).toBeNull()
    })
  })

  describe('update', () => {
    it('should update a life area', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(mockLifeArea)
      mockPrisma.lifeArea.update.mockResolvedValue({ ...mockLifeArea, name: 'Wellness' })

      const result = await service.update('la-1', 'user-1', { name: 'Wellness' })

      expect(result.name).toBe('Wellness')
      expect(mockPrisma.lifeArea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'la-1' },
          data: { name: 'Wellness' },
        }),
      )
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(null)

      await expect(service.update('nonexistent', 'user-1', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should soft delete a life area', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(mockLifeArea)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockLifeArea)

      const result = await service.remove('la-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('lifeArea', 'la-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.lifeArea.findFirst.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })
})
