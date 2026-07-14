jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}))

import { type ExecutionContext, HttpStatus } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'

import { ActivitiesController } from '../src/activities/activities.controller.js'
import { ActivitiesService } from '../src/activities/activities.service.js'
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js'
import { EventsController } from '../src/events/events.controller.js'
import { EventsService } from '../src/events/events.service.js'
import { GoalsController } from '../src/goals/goals.controller.js'
import { GoalsService } from '../src/goals/goals.service.js'
import { LifeAreasController } from '../src/life-areas/life-areas.controller.js'
import { LifeAreasService } from '../src/life-areas/life-areas.service.js'
import { ProjectsController } from '../src/projects/projects.controller.js'
import { ProjectsService } from '../src/projects/projects.service.js'
import { SyncController } from '../src/sync/sync.controller.js'
import { SyncService } from '../src/sync/sync.service.js'
import { TimeSessionsController } from '../src/time-sessions/time-sessions.controller.js'
import { TimeSessionsService } from '../src/time-sessions/time-sessions.service.js'
import { UsersController } from '../src/users/users.controller.js'
import { UsersService } from '../src/users/users.service.js'

const LA_ID = '550e8400-e29b-41d4-a716-446655440001'
const GOAL_ID = '550e8400-e29b-41d4-a716-446655440002'
const PROJ_ID = '550e8400-e29b-41d4-a716-446655440003'
const ACT_ID = '550e8400-e29b-41d4-a716-446655440004'

function mockGuard() {
  return {
    canActivate: (context: ExecutionContext) => {
      const req = context
        .switchToHttp()
        .getRequest<{ user?: { id: string; email: string; name: string } }>()
      req.user = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' }
      return true
    },
  }
}

describe('CRUD Controllers (e2e)', () => {
  let app: any

  const mockLifeAreasService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockGoalsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockProjectsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockActivitiesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockEventsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockTimeSessionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockUsersService = {
    findById: jest.fn(),
    update: jest.fn(),
  }

  const mockSyncService = {
    push: jest.fn(),
    pull: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        LifeAreasController,
        GoalsController,
        ProjectsController,
        ActivitiesController,
        EventsController,
        TimeSessionsController,
        UsersController,
        SyncController,
      ],
      providers: [
        { provide: LifeAreasService, useValue: mockLifeAreasService },
        { provide: GoalsService, useValue: mockGoalsService },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: TimeSessionsService, useValue: mockTimeSessionsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SyncService, useValue: mockSyncService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard())
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('LifeAreas', () => {
    const basePath = '/api/life-areas'
    const mockItem = { id: LA_ID, name: 'Health', color: '#ff0000' }

    it('GET /api/life-areas', async () => {
      mockLifeAreasService.findAll.mockResolvedValue([mockItem])

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body).toEqual([mockItem])
    })

    it('GET /api/life-areas/:id', async () => {
      mockLifeAreasService.findOne.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .get(`${basePath}/${LA_ID}`)
        .expect(HttpStatus.OK)

      expect(res.body.id).toBe(LA_ID)
    })

    it('POST /api/life-areas', async () => {
      mockLifeAreasService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({ name: 'Health', color: '#ff0000' })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe(LA_ID)
    })

    it('POST /api/life-areas with validation error', async () => {
      await request(app.getHttpServer())
        .post(basePath)
        .send({ name: '' })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('PATCH /api/life-areas/:id', async () => {
      const updated = { ...mockItem, name: 'Wellness' }
      mockLifeAreasService.update.mockResolvedValue(updated)

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/${LA_ID}`)
        .send({ name: 'Wellness' })
        .expect(HttpStatus.OK)

      expect(res.body.name).toBe('Wellness')
    })

    it('DELETE /api/life-areas/:id', async () => {
      mockLifeAreasService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/${LA_ID}`).expect(HttpStatus.OK)
    })
  })

  describe('Goals', () => {
    const basePath = '/api/goals'
    const mockItem = {
      id: GOAL_ID,
      title: 'Run a Marathon',
      life_area_id: LA_ID,
      life_area: { name: 'Health', color: '#ff0000' },
    }

    it('GET /api/goals', async () => {
      mockGoalsService.findAll.mockResolvedValue([mockItem])

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body).toHaveLength(1)
    })

    it('GET /api/goals?life_area_id=...', async () => {
      mockGoalsService.findAll.mockResolvedValue([mockItem])

      await request(app.getHttpServer())
        .get(`${basePath}?life_area_id=${LA_ID}`)
        .expect(HttpStatus.OK)

      expect(mockGoalsService.findAll).toHaveBeenCalledWith('test-user-id', LA_ID)
    })

    it('GET /api/goals/:id', async () => {
      mockGoalsService.findOne.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .get(`${basePath}/${GOAL_ID}`)
        .expect(HttpStatus.OK)

      expect(res.body.id).toBe(GOAL_ID)
    })

    it('POST /api/goals', async () => {
      mockGoalsService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({ title: 'Run a Marathon', life_area_id: LA_ID })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe(GOAL_ID)
    })

    it('POST /api/goals with validation error', async () => {
      await request(app.getHttpServer())
        .post(basePath)
        .send({ title: 'Test', life_area_id: 'not-a-uuid' })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('PATCH /api/goals/:id', async () => {
      mockGoalsService.update.mockResolvedValue({ ...mockItem, title: 'Run an Ultramarathon' })

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/${GOAL_ID}`)
        .send({ title: 'Run an Ultramarathon' })
        .expect(HttpStatus.OK)

      expect(res.body.title).toBe('Run an Ultramarathon')
    })

    it('DELETE /api/goals/:id', async () => {
      mockGoalsService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/${GOAL_ID}`).expect(HttpStatus.OK)
    })
  })

  describe('Projects', () => {
    const basePath = '/api/projects'
    const mockItem = {
      id: PROJ_ID,
      name: 'Build App',
      goal_id: GOAL_ID,
      goal: { title: 'Learn Coding', life_area_id: LA_ID },
    }

    it('GET /api/projects', async () => {
      mockProjectsService.findAll.mockResolvedValue([mockItem])

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body).toHaveLength(1)
    })

    it('GET /api/projects?goal_id=...', async () => {
      mockProjectsService.findAll.mockResolvedValue([mockItem])

      await request(app.getHttpServer()).get(`${basePath}?goal_id=${GOAL_ID}`).expect(HttpStatus.OK)
    })

    it('GET /api/projects/:id', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .get(`${basePath}/${PROJ_ID}`)
        .expect(HttpStatus.OK)

      expect(res.body.id).toBe(PROJ_ID)
    })

    it('POST /api/projects', async () => {
      mockProjectsService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({ name: 'Build App', goal_id: GOAL_ID })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe(PROJ_ID)
    })

    it('PATCH /api/projects/:id', async () => {
      mockProjectsService.update.mockResolvedValue({ ...mockItem, name: 'Build Better App' })

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/${PROJ_ID}`)
        .send({ name: 'Build Better App' })
        .expect(HttpStatus.OK)

      expect(res.body.name).toBe('Build Better App')
    })

    it('DELETE /api/projects/:id', async () => {
      mockProjectsService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/${PROJ_ID}`).expect(HttpStatus.OK)
    })
  })

  describe('Activities', () => {
    const basePath = '/api/activities'
    const mockItem = {
      id: ACT_ID,
      title: 'Write Code',
      project_id: PROJ_ID,
      project: { name: 'Build App', goal_id: GOAL_ID },
    }

    it('GET /api/activities', async () => {
      mockActivitiesService.findAll.mockResolvedValue([mockItem])

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body).toHaveLength(1)
    })

    it('GET /api/activities?project_id=...', async () => {
      mockActivitiesService.findAll.mockResolvedValue([mockItem])

      await request(app.getHttpServer())
        .get(`${basePath}?project_id=${PROJ_ID}`)
        .expect(HttpStatus.OK)
    })

    it('GET /api/activities/:id', async () => {
      mockActivitiesService.findOne.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).get(`${basePath}/${ACT_ID}`).expect(HttpStatus.OK)
    })

    it('POST /api/activities', async () => {
      mockActivitiesService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({ title: 'Write Code', project_id: PROJ_ID })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe(ACT_ID)
    })

    it('PATCH /api/activities/:id', async () => {
      mockActivitiesService.update.mockResolvedValue({ ...mockItem, title: 'Write Tests' })

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/${ACT_ID}`)
        .send({ title: 'Write Tests' })
        .expect(HttpStatus.OK)

      expect(res.body.title).toBe('Write Tests')
    })

    it('DELETE /api/activities/:id', async () => {
      mockActivitiesService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/${ACT_ID}`).expect(HttpStatus.OK)
    })
  })

  describe('Events', () => {
    const basePath = '/api/events'
    const mockItem = {
      id: 'evt-1',
      title: 'Team Meeting',
      start_at: '2026-07-13T10:00:00.000Z',
      end_at: '2026-07-13T11:00:00.000Z',
      type: 'meeting',
      activity: null,
    }

    it('GET /api/events', async () => {
      mockEventsService.findAll.mockResolvedValue({
        items: [mockItem],
        meta: { page: 1, limit: 50, total: 1 },
      })

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body.items).toHaveLength(1)
      expect(res.body.meta.total).toBe(1)
    })

    it('GET /api/events with date range', async () => {
      mockEventsService.findAll.mockResolvedValue({
        items: [],
        meta: { page: 1, limit: 50, total: 0 },
      })

      await request(app.getHttpServer())
        .get(`${basePath}?start=2026-07-01T00:00:00Z&end=2026-07-31T00:00:00Z`)
        .expect(HttpStatus.OK)
    })

    it('GET /api/events/:id', async () => {
      mockEventsService.findOne.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer()).get(`${basePath}/evt-1`).expect(HttpStatus.OK)

      expect(res.body.id).toBe('evt-1')
    })

    it('POST /api/events', async () => {
      mockEventsService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({
          title: 'Team Meeting',
          start_at: '2026-07-13T10:00:00Z',
          end_at: '2026-07-13T11:00:00Z',
          type: 'meeting',
        })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe('evt-1')
    })

    it('POST /api/events with validation error (invalid type)', async () => {
      await request(app.getHttpServer())
        .post(basePath)
        .send({
          title: 'Bad Event',
          start_at: '2026-07-13T10:00:00Z',
          end_at: '2026-07-13T11:00:00Z',
          type: 'invalid-type',
        })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('PATCH /api/events/:id', async () => {
      mockEventsService.update.mockResolvedValue({ ...mockItem, title: 'Updated Meeting' })

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/evt-1`)
        .send({ title: 'Updated Meeting' })
        .expect(HttpStatus.OK)

      expect(res.body.title).toBe('Updated Meeting')
    })

    it('DELETE /api/events/:id', async () => {
      mockEventsService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/evt-1`).expect(HttpStatus.OK)
    })
  })

  describe('TimeSessions', () => {
    const basePath = '/api/time-sessions'
    const mockItem = {
      id: 'ts-1',
      start_at: '2026-07-13T10:00:00.000Z',
      end_at: '2026-07-13T11:00:00.000Z',
      activity_id: ACT_ID,
      activity: { title: 'Write Code' },
    }

    it('GET /api/time-sessions', async () => {
      mockTimeSessionsService.findAll.mockResolvedValue([mockItem])

      const res = await request(app.getHttpServer()).get(basePath).expect(HttpStatus.OK)

      expect(res.body).toHaveLength(1)
    })

    it('GET /api/time-sessions?activity_id=...', async () => {
      mockTimeSessionsService.findAll.mockResolvedValue([mockItem])

      await request(app.getHttpServer())
        .get(`${basePath}?activity_id=${ACT_ID}`)
        .expect(HttpStatus.OK)
    })

    it('GET /api/time-sessions/:id', async () => {
      mockTimeSessionsService.findOne.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).get(`${basePath}/ts-1`).expect(HttpStatus.OK)
    })

    it('POST /api/time-sessions', async () => {
      mockTimeSessionsService.create.mockResolvedValue(mockItem)

      const res = await request(app.getHttpServer())
        .post(basePath)
        .send({ start_at: '2026-07-13T10:00:00Z', activity_id: ACT_ID })
        .expect(HttpStatus.CREATED)

      expect(res.body.id).toBe('ts-1')
    })

    it('POST /api/time-sessions with validation error', async () => {
      await request(app.getHttpServer())
        .post(basePath)
        .send({ start_at: 'invalid-date', activity_id: ACT_ID })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('PATCH /api/time-sessions/:id', async () => {
      const updated = { ...mockItem, end_at: '2026-07-13T12:00:00.000Z' }
      mockTimeSessionsService.update.mockResolvedValue(updated)

      const res = await request(app.getHttpServer())
        .patch(`${basePath}/ts-1`)
        .send({ end_at: '2026-07-13T12:00:00Z' })
        .expect(HttpStatus.OK)

      expect(res.body.end_at).toBe('2026-07-13T12:00:00.000Z')
    })

    it('DELETE /api/time-sessions/:id', async () => {
      mockTimeSessionsService.remove.mockResolvedValue(mockItem)

      await request(app.getHttpServer()).delete(`${basePath}/ts-1`).expect(HttpStatus.OK)
    })
  })

  describe('Users', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' }

    it('GET /api/me', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser)

      const res = await request(app.getHttpServer()).get('/api/me').expect(HttpStatus.OK)

      expect(res.body.email).toBe('test@example.com')
    })

    it('GET /api/me when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null)

      const res = await request(app.getHttpServer()).get('/api/me').expect(HttpStatus.OK)

      expect(res.body).toEqual({})
    })

    it('PATCH /api/me', async () => {
      mockUsersService.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' })

      const res = await request(app.getHttpServer())
        .patch('/api/me')
        .send({ name: 'Updated Name' })
        .expect(HttpStatus.OK)

      expect(res.body.name).toBe('Updated Name')
    })
  })

  describe('Sync', () => {
    it('POST /api/sync/push', async () => {
      mockSyncService.push.mockResolvedValue({ accepted: ['id-1'], conflicts: [] })

      const res = await request(app.getHttpServer())
        .post('/api/sync/push')
        .send({
          changes: [
            {
              entity: 'life_area',
              action: 'create',
              data: { id: 'id-1', name: 'Health' },
              client_timestamp: '2026-07-13T10:00:00Z',
            },
          ],
        })
        .expect(HttpStatus.CREATED)

      expect(res.body.accepted).toContain('id-1')
    })

    it('POST /api/sync/push with validation error', async () => {
      await request(app.getHttpServer())
        .post('/api/sync/push')
        .send({ changes: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('POST /api/sync/pull', async () => {
      mockSyncService.pull.mockResolvedValue({
        changes: [],
        server_timestamp: '2026-07-13T10:00:00Z',
      })

      const res = await request(app.getHttpServer())
        .post('/api/sync/pull')
        .send({ last_sync_timestamp: '2026-07-01T00:00:00Z' })
        .expect(HttpStatus.CREATED)

      expect(res.body.server_timestamp).toBeDefined()
    })

    it('POST /api/sync/pull with validation error', async () => {
      await request(app.getHttpServer())
        .post('/api/sync/pull')
        .send({ last_sync_timestamp: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST)
    })
  })
})
