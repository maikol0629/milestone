import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

const adapter = new PrismaPg(process.env.DATABASE_URL ?? '')
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('demo1234', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@milestone.app' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'demo@milestone.app',
      name: 'Usuario Demo',
      password_hash: passwordHash,
    },
  })

  const lifeArea = await prisma.lifeArea.create({
    data: {
      id: randomUUID(),
      name: 'Salud',
      color: '#22c55e',
      user_id: user.id,
    },
  })

  const goal = await prisma.goal.create({
    data: {
      id: randomUUID(),
      title: 'Correr una maratón',
      description: 'Entrenar durante 6 meses',
      life_area_id: lifeArea.id,
      user_id: user.id,
    },
  })

  const project = await prisma.project.create({
    data: {
      id: randomUUID(),
      name: 'Plan de entrenamiento',
      goal_id: goal.id,
      user_id: user.id,
    },
  })

  const activity = await prisma.activity.create({
    data: {
      id: randomUUID(),
      title: 'Entrenamiento de velocidad',
      project_id: project.id,
      user_id: user.id,
    },
  })

  await prisma.event.createMany({
    data: [
      {
        id: randomUUID(),
        title: 'Reunión de planificación semanal',
        start_at: new Date('2026-07-13T09:00:00Z'),
        end_at: new Date('2026-07-13T10:00:00Z'),
        type: 'meeting',
        user_id: user.id,
      },
      {
        id: randomUUID(),
        title: 'Entrenamiento de velocidad',
        description: 'Series de 400m',
        start_at: new Date('2026-07-14T06:00:00Z'),
        end_at: new Date('2026-07-14T07:30:00Z'),
        type: 'task',
        activity_id: activity.id,
        user_id: user.id,
      },
      {
        id: randomUUID(),
        title: 'Pagar facturas',
        start_at: new Date('2026-07-15T12:00:00Z'),
        end_at: new Date('2026-07-15T13:00:00Z'),
        type: 'reminder',
        user_id: user.id,
      },
    ],
  })

  console.log('Database seeded successfully')
  console.log('Demo user: demo@milestone.app')
  console.log('Demo password: demo1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
