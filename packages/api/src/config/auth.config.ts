import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  jwtSecret: string
  accessExpiresIn: string
  refreshExpiresIn: string
}

export default registerAs('auth', (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}))
