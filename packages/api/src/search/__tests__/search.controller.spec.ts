import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { SearchController } from '../search.controller.js'

describe('SearchController', () => {
  let controller: SearchController
  let prisma: PrismaService

  const mockPrisma = {
    lifeArea: { findMany: jest.fn() },
    goal: { findMany: jest.fn() },
    project: { findMany: jest.fn() },
    activity: { findMany: jest.fn() },
    event: { findMany: jest.fn() },
    timeSession: { findMany: jest.fn() },
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma.lifeArea.findMany.mockResolvedValue([])
    mockPrisma.goal.findMany.mockResolvedValue([])
    mockPrisma.project.findMany.mockResolvedValue([])
    mockPrisma.activity.findMany.mockResolvedValue([])
    mockPrisma.event.findMany.mockResolvedValue([])
    mockPrisma.timeSession.findMany.mockResolvedValue([])
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile()

    controller = module.get<SearchController>(SearchController)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should return empty results when query is empty', async () => {
    const result = await controller.search(
      { id: 'user-1', email: 'test@test.com', name: 'Test' },
      undefined,
    )
    expect(result).toEqual({
      life_areas: [],
      goals: [],
      projects: [],
      activities: [],
      events: [],
      time_sessions: [],
    })
  })

  it('should search across all entities', async () => {
    const user = { id: 'user-1', email: 'test@test.com', name: 'Test' }
    mockPrisma.lifeArea.findMany.mockResolvedValue([
      { id: 'area-1', name: 'Test Area', user_id: 'user-1' },
    ])
    mockPrisma.goal.findMany.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'Test Goal',
        user_id: 'user-1',
        life_area_id: 'area-1',
        life_area: { name: 'Test Area' },
      },
    ])

    const result = await controller.search(user, 'test')

    expect(result.life_areas).toHaveLength(1)
    expect(result.goals).toHaveLength(1)
    expect(result.projects).toHaveLength(0)
  })

  it('should filter by type', async () => {
    const user = { id: 'user-1', email: 'test@test.com', name: 'Test' }

    const result = await controller.search(user, 'test', 'goal')

    expect(result.life_areas).toHaveLength(0)
    expect(result.goals).toHaveLength(0)
    expect(result.projects).toHaveLength(0)
    expect(result.activities).toHaveLength(0)
    expect(result.events).toHaveLength(0)
    expect(result.time_sessions).toHaveLength(0)
    // Only goals should have been queried
    expect(mockPrisma.goal.findMany).toHaveBeenCalled()
  })
})
