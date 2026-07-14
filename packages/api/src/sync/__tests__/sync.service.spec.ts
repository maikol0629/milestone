import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { SyncService } from '../sync.service.js'

describe('SyncService', () => {
  let service: SyncService
  let prisma: PrismaService

  const mockPrisma = {
    lifeArea: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    goal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    activity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    timeSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<SyncService>(SyncService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('push', () => {
    it('should accept valid changes', async () => {
      mockPrisma.lifeArea.findUnique.mockResolvedValue(null)
      mockPrisma.lifeArea.upsert.mockResolvedValue({ id: 'la-1' })

      const result = await service.push('user-1', [
        {
          entity: 'life_area',
          action: 'create',
          data: { id: 'la-1', name: 'Health', color: '#ff0000' },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toContain('la-1')
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect version conflicts', async () => {
      mockPrisma.lifeArea.findUnique.mockResolvedValue({
        id: 'la-1',
        user_id: 'user-1',
        sync_version: 5,
        name: 'Health',
      })

      const result = await service.push('user-1', [
        {
          entity: 'life_area',
          action: 'update',
          data: { id: 'la-1', name: 'Wellness', sync_version: 3 },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toHaveLength(0)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0]!.entity).toBe('life_area')
      expect(result.conflicts[0]!.local_version).toBe(3)
      expect(result.conflicts[0]!.server_version).toBe(5)
    })

    it('should handle delete actions', async () => {
      jest.spyOn(prisma, 'softDelete').mockResolvedValue({ id: 'goal-1' })

      const result = await service.push('user-1', [
        {
          entity: 'goal',
          action: 'delete',
          data: { id: 'goal-1' },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toContain('goal-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('goal', 'goal-1')
    })

    it('should skip changes for unknown entity types', async () => {
      const result = await service.push('user-1', [
        {
          entity: 'unknown_entity' as never,
          action: 'create',
          data: { id: 'xyz' },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toHaveLength(0)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should skip changes without an id', async () => {
      const result = await service.push('user-1', [
        {
          entity: 'life_area',
          action: 'create',
          data: { name: 'Health' },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toHaveLength(0)
    })

    it('should skip changes for resources owned by another user', async () => {
      mockPrisma.lifeArea.findUnique.mockResolvedValue({
        id: 'la-1',
        user_id: 'other-user',
        sync_version: 1,
      })

      const result = await service.push('user-1', [
        {
          entity: 'life_area',
          action: 'update',
          data: { id: 'la-1', name: 'Health' },
          client_timestamp: '2026-07-13T10:00:00Z',
        },
      ])

      expect(result.accepted).toHaveLength(0)
    })
  })

  describe('pull', () => {
    it('should return changes since last sync', async () => {
      const sinceDate = '2026-07-01T00:00:00Z'
      const mockRecords = [
        {
          id: 'la-1',
          name: 'Health',
          updated_at: new Date('2026-07-13T10:00:00Z'),
          deleted_at: null,
        },
      ]

      mockPrisma.lifeArea.findMany.mockResolvedValue(mockRecords)
      mockPrisma.goal.findMany.mockResolvedValue([])
      mockPrisma.project.findMany.mockResolvedValue([])
      mockPrisma.activity.findMany.mockResolvedValue([])
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.timeSession.findMany.mockResolvedValue([])

      const result = await service.pull('user-1', sinceDate)

      expect(result.changes).toHaveLength(1)
      expect(result.changes[0]!.entity).toBe('life_area')
      expect(result.changes[0]!.action).toBe('update')
      expect(result.server_timestamp).toBeDefined()
    })

    it('should mark deleted records with delete action', async () => {
      const mockDeletedRecord = {
        id: 'la-1',
        name: 'Health',
        updated_at: new Date('2026-07-13T10:00:00Z'),
        deleted_at: new Date('2026-07-13T10:00:00Z'),
      }

      mockPrisma.lifeArea.findMany.mockResolvedValue([mockDeletedRecord])
      mockPrisma.goal.findMany.mockResolvedValue([])
      mockPrisma.project.findMany.mockResolvedValue([])
      mockPrisma.activity.findMany.mockResolvedValue([])
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.timeSession.findMany.mockResolvedValue([])

      const result = await service.pull('user-1', '2026-07-01T00:00:00Z')

      expect(result.changes).toHaveLength(1)
      expect(result.changes[0]!.action).toBe('delete')
    })

    it('should query all entity types', async () => {
      mockPrisma.lifeArea.findMany.mockResolvedValue([])
      mockPrisma.goal.findMany.mockResolvedValue([])
      mockPrisma.project.findMany.mockResolvedValue([])
      mockPrisma.activity.findMany.mockResolvedValue([])
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.timeSession.findMany.mockResolvedValue([])

      const result = await service.pull('user-1', '2026-07-01T00:00:00Z')

      expect(result.changes).toHaveLength(0)
      expect(mockPrisma.lifeArea.findMany).toHaveBeenCalled()
      expect(mockPrisma.goal.findMany).toHaveBeenCalled()
      expect(mockPrisma.project.findMany).toHaveBeenCalled()
      expect(mockPrisma.activity.findMany).toHaveBeenCalled()
      expect(mockPrisma.event.findMany).toHaveBeenCalled()
      expect(mockPrisma.timeSession.findMany).toHaveBeenCalled()
    })
  })
})
