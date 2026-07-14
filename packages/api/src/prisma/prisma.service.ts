import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL ?? '')
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async softDelete(model: string, id: string) {
    const delegate = (this as unknown as Record<string, unknown>)[model] as {
      update: (args: { where: { id: string }; data: { deleted_at: Date } }) => Promise<unknown>
    }
    return delegate.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
  }
}
