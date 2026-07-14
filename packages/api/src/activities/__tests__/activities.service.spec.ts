import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { ActivitiesService } from '../activities.service.js'

describe('ActivitiesService', () => {
  let service: ActivitiesService
  let prisma: PrismaService

  const mockActivity = {
    id: 'act-1',
    title: 'Write Code',
    project_id: 'proj-1',
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    project: { name: 'Build App', goal_id: 'goal-1' },
  }

  const mockPrisma = {
    activity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<ActivitiesService>(ActivitiesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return all activities for a user', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity])

      const result = await service.findAll('user-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          orderBy: { title: 'asc' },
        }),
      )
    })

    it('should filter by project_id', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity])

      const result = await service.findAll('user-1', 'proj-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', project_id: 'proj-1' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return an activity by id', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(mockActivity)

      const result = await service.findOne('act-1', 'user-1')
      expect(result.id).toBe('act-1')
      expect(result.project).toBeDefined()
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new activity', async () => {
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await service.create('user-1', { title: 'Write Code', project_id: 'proj-1' })

      expect(result.id).toBe('act-1')
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Write Code', user_id: 'user-1' }),
        }),
      )
    })
  })

  describe('update', () => {
    it('should update an activity', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(mockActivity)
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, title: 'Write Tests' })

      const result = await service.update('act-1', 'user-1', { title: 'Write Tests' })

      expect(result.title).toBe('Write Tests')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(null)

      await expect(service.update('nonexistent', 'user-1', { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should soft delete an activity', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(mockActivity)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockActivity)

      const result = await service.remove('act-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('activity', 'act-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })
})
