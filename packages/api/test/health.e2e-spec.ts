import { HttpStatus } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'

import { HealthController } from '../src/health.controller.js'

describe('HealthController (e2e)', () => {
  let app: any

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/health should return ok status', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(HttpStatus.OK)

    expect(response.body.status).toBe('ok')
    expect(response.body.timestamp).toBeDefined()
    expect(typeof response.body.timestamp).toBe('string')
  })
})
