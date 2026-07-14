import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { PrismaService } from '../../prisma/prisma.service.js'
import { ProjectsService } from '../projects.service.js'

describe('ProjectsService', () => {
  let service: ProjectsService
  let prisma: PrismaService

  const mockProject = {
    id: 'proj-1',
    name: 'Build App',
    goal_id: 'goal-1',
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    goal: { title: 'Learn Coding', life_area_id: 'la-1' },
  }

  const mockPrisma = {
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrisma,
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<ProjectsService>(ProjectsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return all projects for a user', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject])

      const result = await service.findAll('user-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          orderBy: { name: 'asc' },
        }),
      )
    })

    it('should filter by goal_id', async () => {
      mockPrisma.project.findMany.mockResolvedValue([mockProject])

      const result = await service.findAll('user-1', 'goal-1')

      expect(result).toHaveLength(1)
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', goal_id: 'goal-1' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject)

      const result = await service.findOne('proj-1', 'user-1')
      expect(result.id).toBe('proj-1')
      expect(result.goal).toBeDefined()
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create a new project', async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject)

      const result = await service.create('user-1', { name: 'Build App', goal_id: 'goal-1' })

      expect(result.id).toBe('proj-1')
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Build App', user_id: 'user-1' }),
        }),
      )
    })
  })

  describe('update', () => {
    it('should update a project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject)
      mockPrisma.project.update.mockResolvedValue({ ...mockProject, name: 'Build Better App' })

      const result = await service.update('proj-1', 'user-1', { name: 'Build Better App' })

      expect(result.name).toBe('Build Better App')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null)

      await expect(service.update('nonexistent', 'user-1', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should soft delete a project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject)
      jest.spyOn(prisma, 'softDelete').mockResolvedValue(mockProject)

      const result = await service.remove('proj-1', 'user-1')
      expect(prisma.softDelete).toHaveBeenCalledWith('project', 'proj-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })
})
