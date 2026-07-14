import type { CreateTimeSessionInput, UpdateTimeSessionInput } from '@milestone/shared'
import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class TimeSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, activityId?: string) {
    return this.prisma.timeSession.findMany({
      where: { user_id: userId, ...(activityId ? { activity_id: activityId } : {}) },
      orderBy: { start_at: 'desc' },
      include: { activity: { select: { title: true } } },
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.timeSession.findFirst({
      where: { id, user_id: userId },
      include: { activity: { select: { title: true } } },
    })
    if (!item)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Sesión de tiempo no encontrada' })
    return item
  }

  async create(userId: string, data: CreateTimeSessionInput) {
    return this.prisma.timeSession.create({
      data: {
        start_at: new Date(data.start_at),
        end_at: data.end_at ? new Date(data.end_at) : null,
        activity_id: data.activity_id,
        user_id: userId,
      },
      include: { activity: { select: { title: true } } },
    })
  }

  async update(id: string, userId: string, data: UpdateTimeSessionInput) {
    await this.findOne(id, userId)
    const updateData: Record<string, unknown> = {}
    if (data.start_at !== undefined) updateData.start_at = new Date(data.start_at)
    if (data.end_at !== undefined) updateData.end_at = data.end_at ? new Date(data.end_at) : null

    return this.prisma.timeSession.update({
      where: { id },
      data: updateData,
      include: { activity: { select: { title: true } } },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('timeSession', id)
  }
}
