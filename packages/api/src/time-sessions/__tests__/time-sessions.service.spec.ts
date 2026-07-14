import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { TimeSessionsService } from '../time-sessions.service.js'

describe('TimeSessionsService', () => {
  let service: TimeSessionsService
  let prisma: PrismaService

  const mockSession = {
    id: 'ts-1',
    start_at: new Date('2026-07-13T10:00:00Z'),
    end_at: new Date('2026-07-13T11:00:00Z'),
    activity_id: 'act-1',
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    activity: { title: 'Write Code' },
  }

  const mockPrisma = {
    timeSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeSessionsService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<TimeSessionsService>(TimeSessionsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return all time sessions for a user', async () => {
      mockPrisma.timeSession.findMany.mockResolvedValue([mockSession])

      const result = await service.findAll('user-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.timeSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          orderBy: { start_at: 'desc' },
        }),
      )
    })

    it('should filter by activity_id', async () => {
      mockPrisma.timeSession.findMany.mockResolvedValue([mockSession])

      const result = await service.findAll('user-1', 'act-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.timeSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', activity_id: 'act-1' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return a time session by id', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(mockSession)

      const result = await service.findOne('ts-1', 'user-1')
      expect(result.id).toBe('ts-1')
      expect(result.activity).toBeDefined()
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new time session', async () => {
      mockPrisma.timeSession.create.mockResolvedValue(mockSession)

      const result = await service.create('user-1', {
        start_at: '2026-07-13T10:00:00Z',
        end_at: '2026-07-13T11:00:00Z',
        activity_id: 'act-1',
      })

      expect(result.id).toBe('ts-1')
      expect(mockPrisma.timeSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            start_at: expect.any(Date),
            end_at: expect.any(Date),
            activity_id: 'act-1',
            user_id: 'user-1',
          }),
        }),
      )
    })

    it('should create with null end_at when not provided', async () => {
      const openSession = { ...mockSession, end_at: null }
      mockPrisma.timeSession.create.mockResolvedValue(openSession)

      const result = await service.create('user-1', {
        start_at: '2026-07-13T10:00:00Z',
        activity_id: 'act-1',
      })

      expect(result.end_at).toBeNull()
    })
  })

  describe('update', () => {
    it('should update a time session', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(mockSession)
      mockPrisma.timeSession.update.mockResolvedValue({
        ...mockSession,
        end_at: new Date('2026-07-13T12:00:00Z'),
      })

      const result = await service.update('ts-1', 'user-1', { end_at: '2026-07-13T12:00:00Z' })

      expect(result.end_at).toEqual(new Date('2026-07-13T12:00:00Z'))
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(null)

      await expect(
        service.update('nonexistent', 'user-1', { start_at: '2026-07-13T10:00:00Z' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should soft delete a time session', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(mockSession)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockSession)

      const result = await service.remove('ts-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('timeSession', 'ts-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.timeSession.findFirst.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })
})
