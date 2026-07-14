import type { CreateGoalInput, UpdateGoalInput } from '@milestone/shared'
import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, lifeAreaId?: string) {
    return this.prisma.goal.findMany({
      where: { user_id: userId, ...(lifeAreaId ? { life_area_id: lifeAreaId } : {}) },
      orderBy: { title: 'asc' },
      include: { life_area: { select: { name: true, color: true } } },
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.goal.findFirst({
      where: { id, user_id: userId },
      include: { life_area: { select: { name: true, color: true } } },
    })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Objetivo no encontrado' })
    return item
  }

  async create(userId: string, data: CreateGoalInput) {
    return this.prisma.goal.create({
      data: { ...data, description: data.description ?? null, user_id: userId },
      include: { life_area: { select: { name: true, color: true } } },
    })
  }

  async update(id: string, userId: string, data: UpdateGoalInput) {
    await this.findOne(id, userId)
    return this.prisma.goal.update({
      where: { id },
      data,
      include: { life_area: { select: { name: true, color: true } } },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('goal', id)
  }
}
