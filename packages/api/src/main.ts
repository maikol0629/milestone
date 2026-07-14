import type { ConfigType } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as Sentry from '@sentry/node'
import helmet from 'helmet'

import { AppModule } from './app.module.js'
import { appConfig as appConfigRegistration } from './config/index.js'

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? '',
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 1.0,
    enabled: !!process.env.SENTRY_DSN,
  })

  const app = await NestFactory.create(AppModule)

  const appCfg = app.get<ConfigType<typeof appConfigRegistration>>(appConfigRegistration.KEY)

  app.setGlobalPrefix('api')

  app.use(helmet())

  app.enableCors({
    origin: appCfg.corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  if (appCfg.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Milestone API')
      .setDescription('API para la gestión de objetivos, proyectos y tiempo')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.listen(appCfg.port)
  console.warn(`API running on http://localhost:${String(appCfg.port)} [${appCfg.nodeEnv}]`)
}

void bootstrap()
