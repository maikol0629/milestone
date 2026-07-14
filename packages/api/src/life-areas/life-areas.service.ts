import type { CreateLifeAreaInput, UpdateLifeAreaInput } from '@milestone/shared'
import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class LifeAreasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.lifeArea.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.lifeArea.findFirst({
      where: { id, user_id: userId },
    })
    if (!item)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Área de vida no encontrada' })
    return item
  }

  async create(userId: string, data: CreateLifeAreaInput) {
    return this.prisma.lifeArea.create({
      data: { ...data, color: data.color ?? null, user_id: userId },
    })
  }

  async update(id: string, userId: string, data: UpdateLifeAreaInput) {
    await this.findOne(id, userId)
    return this.prisma.lifeArea.update({
      where: { id },
      data,
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    return this.prisma.softDelete('lifeArea', id)
  }
}
