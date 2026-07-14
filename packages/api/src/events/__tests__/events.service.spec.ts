import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { EventsService } from '../events.service.js'

describe('EventsService', () => {
  let service: EventsService
  let prisma: PrismaService

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    description: null,
    start_at: new Date('2026-07-13T14:00:00Z'),
    end_at: new Date('2026-07-13T15:00:00Z'),
    type: 'event',
    activity_id: null,
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockPrisma = {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<EventsService>(EventsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return paginated events', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent])
      mockPrisma.event.count.mockResolvedValue(1)

      const result = await service.findAll({ userId: 'user-1', page: 1, limit: 50 })

      expect(result.items).toHaveLength(1)
      expect(result.meta.total).toBe(1)
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 'user-1' }),
        }),
      )
    })

    it('should filter by date range', async () => {
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(0)

      await service.findAll({
        userId: 'user-1',
        start: '2026-07-01T00:00:00Z',
        end: '2026-07-31T00:00:00Z',
      })

      const callArgs = mockPrisma.event.findMany.mock.calls[1][0]
      expect(callArgs.where.start_at).toBeDefined()
    })
  })

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent)

      const result = await service.findOne('event-1', 'user-1')
      expect(result.id).toBe('event-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new event', async () => {
      mockPrisma.event.create.mockResolvedValue(mockEvent)

      const result = await service.create('user-1', {
        title: 'Test Event',
        start_at: '2026-07-13T14:00:00Z',
        end_at: '2026-07-13T15:00:00Z',
        type: 'event',
        is_milestone: false,
      })

      expect(result.id).toBe('event-1')
    })
  })

  describe('remove', () => {
    it('should soft delete an event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockEvent)

      const result = await service.remove('event-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('event', 'event-1')
    })
  })
})
