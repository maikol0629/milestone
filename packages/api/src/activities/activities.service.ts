import type { CreateActivityInput, UpdateActivityInput } from '@milestone/shared'
import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, projectId?: string) {
    return this.prisma.activity.findMany({
      where: { user_id: userId, ...(projectId ? { project_id: projectId } : {}) },
      orderBy: { title: 'asc' },
      include: { project: { select: { name: true, goal_id: true } } },
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.activity.findFirst({
      where: { id, user_id: userId },
      include: { project: { select: { name: true, goal_id: true } } },
    })
    if (!item)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Actividad no encontrada' })
    return item
  }

  async create(userId: string, data: CreateActivityInput) {
    return this.prisma.activity.create({
      data: { ...data, user_id: userId },
      include: { project: { select: { name: true, goal_id: true } } },
    })
  }

  async update(id: string, userId: string, data: UpdateActivityInput) {
    await this.findOne(id, userId)
    return this.prisma.activity.update({
      where: { id },
      data,
      include: { project: { select: { name: true, goal_id: true } } },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('activity', id)
  }
}
