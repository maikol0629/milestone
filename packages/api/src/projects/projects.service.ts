import type { CreateProjectInput, UpdateProjectInput } from '@milestone/shared'
import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, goalId?: string) {
    return this.prisma.project.findMany({
      where: { user_id: userId, ...(goalId ? { goal_id: goalId } : {}) },
      orderBy: { name: 'asc' },
      include: { goal: { select: { title: true, life_area_id: true } } },
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.project.findFirst({
      where: { id, user_id: userId },
      include: { goal: { select: { title: true, life_area_id: true } } },
    })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Proyecto no encontrado' })
    return item
  }

  async create(userId: string, data: CreateProjectInput) {
    return this.prisma.project.create({
      data: { ...data, user_id: userId },
      include: { goal: { select: { title: true, life_area_id: true } } },
    })
  }

  async update(id: string, userId: string, data: UpdateProjectInput) {
    await this.findOne(id, userId)
    return this.prisma.project.update({
      where: { id },
      data,
      include: { goal: { select: { title: true, life_area_id: true } } },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('project', id)
  }
}
