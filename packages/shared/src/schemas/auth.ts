import { z } from 'zod'

export const registerSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
})

export const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
})

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    name: z.string().nullable(),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
