import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(email: string, password: string, name: string) {
    const password_hash = await bcrypt.hash(password, 10)

    return this.prisma.user.create({
      data: { email, password_hash, name },
    })
  }

  async update(id: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
    })
  }

  async verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash)
  }
}
