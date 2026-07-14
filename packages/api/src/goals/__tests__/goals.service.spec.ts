import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { GoalsService } from '../goals.service.js'

describe('GoalsService', () => {
  let service: GoalsService
  let prisma: PrismaService

  const mockGoal = {
    id: 'goal-1',
    title: 'Run a Marathon',
    description: null,
    life_area_id: 'la-1',
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    life_area: { name: 'Health', color: '#ff0000' },
  }

  const mockPrisma = {
    goal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<GoalsService>(GoalsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return all goals for a user', async () => {
      mockPrisma.goal.findMany.mockResolvedValue([mockGoal])

      const result = await service.findAll('user-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          orderBy: { title: 'asc' },
        }),
      )
    })

    it('should filter by life_area_id', async () => {
      mockPrisma.goal.findMany.mockResolvedValue([mockGoal])

      const result = await service.findAll('user-1', 'la-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', life_area_id: 'la-1' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(mockGoal)

      const result = await service.findOne('goal-1', 'user-1')
      expect(result.id).toBe('goal-1')
      expect(result.life_area).toBeDefined()
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new goal', async () => {
      mockPrisma.goal.create.mockResolvedValue(mockGoal)

      const result = await service.create('user-1', {
        title: 'Run a Marathon',
        life_area_id: 'la-1',
      })

      expect(result.id).toBe('goal-1')
      expect(mockPrisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Run a Marathon', user_id: 'user-1' }),
        }),
      )
    })
  })

  describe('update', () => {
    it('should update a goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(mockGoal)
      mockPrisma.goal.update.mockResolvedValue({ ...mockGoal, title: 'Run an Ultramarathon' })

      const result = await service.update('goal-1', 'user-1', { title: 'Run an Ultramarathon' })

      expect(result.title).toBe('Run an Ultramarathon')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null)

      await expect(service.update('nonexistent', 'user-1', { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should soft delete a goal', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(mockGoal)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockGoal)

      const result = await service.remove('goal-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('goal', 'goal-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })
})
