import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { CurrentUser, type AuthenticatedUser } from '../common/current-user.decorator.js'
import { PrismaService } from '../prisma/prisma.service.js'

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Search across entities' })
  @ApiQuery({ name: 'q', type: 'string', required: false })
  @ApiQuery({ name: 'type', type: 'string', required: false })
  @ApiQuery({ name: 'parent_id', type: 'string', required: false })
  @ApiQuery({ name: 'start', type: 'string', required: false })
  @ApiQuery({ name: 'end', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query?: string,
    @Query('type') type?: string,
    @Query('parent_id') parentId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!query) {
      return {
        life_areas: [],
        goals: [],
        projects: [],
        activities: [],
        events: [],
        time_sessions: [],
      }
    }

    const limit = 10

    const searchableTypes = [
      'life_area',
      'goal',
      'project',
      'activity',
      'event',
      'time_session',
    ] as const

    type SearchType = (typeof searchableTypes)[number]

    const searchSingleType = async (t: SearchType) => {
      if (type && t !== type) return []

      const where: Record<string, unknown> = { user_id: user.id }

      switch (t) {
        case 'life_area': {
          where.name = { contains: query, mode: 'insensitive' }
          const items = await this.prisma.lifeArea.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
          })
          return items
        }
        case 'goal': {
          where.title = { contains: query, mode: 'insensitive' }
          if (parentId) where.life_area_id = parentId
          const items = await this.prisma.goal.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: { life_area: { select: { name: true } } },
          })
          return items
        }
        case 'project': {
          where.name = { contains: query, mode: 'insensitive' }
          if (parentId) where.goal_id = parentId
          const items = await this.prisma.project.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: { goal: { select: { title: true } } },
          })
          return items
        }
        case 'activity': {
          where.title = { contains: query, mode: 'insensitive' }
          if (parentId) where.project_id = parentId
          const items = await this.prisma.activity.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: { project: { select: { name: true } } },
          })
          return items
        }
        case 'event': {
          where.title = { contains: query, mode: 'insensitive' }
          if (parentId) where.activity_id = parentId
          if (start) {
            where.start_at = {
              ...(where.start_at ?? {}),
              gte: new Date(start),
            }
          }
          if (end) {
            where.start_at = {
              ...(where.start_at ?? {}),
              lte: new Date(end),
            }
          }
          const items = await this.prisma.event.findMany({
            where,
            take: limit,
            orderBy: { start_at: 'asc' },
            include: { activity: { select: { title: true } } },
          })
          return items
        }
        case 'time_session': {
          if (parentId) where.activity_id = parentId
          const items = await this.prisma.timeSession.findMany({
            where,
            take: limit,
            orderBy: { start_at: 'desc' },
            include: { activity: { select: { title: true } } },
          })
          return items
        }
        default:
          return []
      }
    }

    const [life_areas, goals, projects, activities, events, time_sessions] = await Promise.all(
      searchableTypes.map((t) => searchSingleType(t)),
    )

    return { life_areas, goals, projects, activities, events, time_sessions }
  }
}
