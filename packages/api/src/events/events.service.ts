import type { CreateEventInput, RecurrenceRule, UpdateEventInput } from '@milestone/shared'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

import { isValidRecurrenceConfig } from './recurrence.helper.js'

interface FindAllParams {
  userId: string
  start?: string
  end?: string
  type?: string
  activityId?: string
  page?: number
  limit?: number
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { userId, start, end, type, activityId, page = 1, limit = 50 } = params

    const where: Record<string, unknown> = { user_id: userId, deleted_at: null }

    if (start || end) {
      where.start_at = {}
      if (start) (where.start_at as Record<string, unknown>).gte = new Date(start)
      if (end) (where.start_at as Record<string, unknown>).lte = new Date(end)
    }

    if (type) where.type = type
    if (activityId) where.activity_id = activityId

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { start_at: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { activity: { select: { title: true, project_id: true } } },
      }),
      this.prisma.event.count({ where }),
    ])

    return { items, meta: { page, limit, total } }
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.event.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { activity: { select: { title: true, project_id: true } } },
    })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Evento no encontrado' })
    return item
  }

  private validateEventData(data: CreateEventInput | UpdateEventInput): void {
    // Validate dates
    const startAt = data.start_at ? new Date(data.start_at) : null
    const endAt = data.end_at ? new Date(data.end_at) : null

    if (startAt && endAt && startAt >= endAt) {
      throw new BadRequestException({
        code: 'INVALID_DATES',
        message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      })
    }

    // Validate that events/work_blocks are within 6:00 AM and 11:00 PM
    if (data.type === 'event' || data.type === 'work_block') {
      if (startAt) {
        const startHour = startAt.getHours()
        if (startHour < 6 || startHour >= 23) {
          throw new BadRequestException({
            code: 'OUT_OF_PLANNING_HOURS',
            message:
              'Los eventos y bloques de trabajo solo se pueden programar entre las 6:00 AM y las 11:00 PM',
          })
        }
      }
      if (endAt) {
        const endHour = endAt.getHours()
        const endMin = endAt.getMinutes()
        if (endHour > 23 || (endHour === 23 && endMin > 0)) {
          throw new BadRequestException({
            code: 'OUT_OF_PLANNING_HOURS',
            message:
              'Los eventos y bloques de trabajo deben terminar a más tardar a las 11:00 PM (23:00)',
          })
        }
      }
    }

    // Validate recurrence
    if (data.recurrence_rule) {
      const config = {
        recurrence_rule: data.recurrence_rule,
        recurrence_interval: data.recurrence_interval,
        recurrence_days_of_week: data.recurrence_days_of_week,
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date) : null,
      }

      if (!isValidRecurrenceConfig(config)) {
        throw new BadRequestException({
          code: 'INVALID_RECURRENCE',
          message: 'Configuración de recurrencia inválida',
        })
      }

      // Check recurrence_end_date is after start_at
      if (startAt && config.recurrence_end_date && startAt > config.recurrence_end_date) {
        throw new BadRequestException({
          code: 'INVALID_RECURRENCE_END_DATE',
          message: 'La fecha de fin de recurrencia debe ser posterior a la fecha de inicio',
        })
      }
    }

    // Validate milestone
    if (data.is_milestone && !data.milestone_date) {
      throw new BadRequestException({
        code: 'INVALID_MILESTONE',
        message: 'Los hitos deben tener una fecha asignada',
      })
    }
  }

  async create(userId: string, data: CreateEventInput) {
    this.validateEventData(data)

    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        start_at: new Date(data.start_at),
        end_at: new Date(data.end_at),
        type: (data.type ?? 'event') as never,
        activity_id: data.activity_id ?? null,
        user_id: userId,
        recurrence_rule: data.recurrence_rule ?? null,
        recurrence_interval: data.recurrence_interval ?? null,
        recurrence_days_of_week: data.recurrence_days_of_week ?? null,
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date) : null,
        is_milestone: data.is_milestone ?? false,
        milestone_date: data.milestone_date ? new Date(data.milestone_date) : null,
      },
      include: { activity: { select: { title: true, project_id: true } } },
    })
  }

  async update(id: string, userId: string, data: UpdateEventInput) {
    const existing = await this.findOne(id, userId)
    this.validateEventData({
      title: data.title ?? existing.title,
      start_at: data.start_at ?? existing.start_at.toISOString(),
      end_at: data.end_at ?? existing.end_at.toISOString(),
      type: data.type ?? existing.type,
      description: data.description !== undefined ? data.description : existing.description,
      activity_id: data.activity_id !== undefined ? data.activity_id : existing.activity_id,
      recurrence_rule:
        data.recurrence_rule !== undefined
          ? data.recurrence_rule
          : (existing.recurrence_rule as RecurrenceRule | null),
      recurrence_interval:
        data.recurrence_interval !== undefined
          ? data.recurrence_interval
          : existing.recurrence_interval,
      recurrence_days_of_week:
        data.recurrence_days_of_week !== undefined
          ? data.recurrence_days_of_week
          : existing.recurrence_days_of_week,
      recurrence_end_date:
        data.recurrence_end_date !== undefined
          ? data.recurrence_end_date
          : (existing.recurrence_end_date?.toISOString() ?? null),
      is_milestone: data.is_milestone ?? existing.is_milestone,
      milestone_date:
        data.milestone_date !== undefined
          ? data.milestone_date
          : (existing.milestone_date?.toISOString() ?? null),
    })

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.start_at !== undefined) updateData.start_at = new Date(data.start_at)
    if (data.end_at !== undefined) updateData.end_at = new Date(data.end_at)
    if (data.type !== undefined) updateData.type = data.type
    if (data.activity_id !== undefined) updateData.activity_id = data.activity_id
    if (data.recurrence_rule !== undefined) updateData.recurrence_rule = data.recurrence_rule
    if (data.recurrence_interval !== undefined)
      updateData.recurrence_interval = data.recurrence_interval
    if (data.recurrence_days_of_week !== undefined)
      updateData.recurrence_days_of_week = data.recurrence_days_of_week
    if (data.recurrence_end_date !== undefined)
      updateData.recurrence_end_date = data.recurrence_end_date
        ? new Date(data.recurrence_end_date)
        : null
    if (data.is_milestone !== undefined) updateData.is_milestone = data.is_milestone
    if (data.milestone_date !== undefined)
      updateData.milestone_date = data.milestone_date ? new Date(data.milestone_date) : null

    return this.prisma.event.update({
      where: { id },
      data: { ...updateData, sync_version: { increment: 1 } },
      include: { activity: { select: { title: true, project_id: true } } },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('event', id)
  }
}
