import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test.describe('Authentication', () => {
  const testEmail = `test-${randomUUID().slice(0, 8)}@example.com`
  const testPassword = 'password123'

  test('should register a new user', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Milestone' })).toBeVisible()
    await expect(page.getByText('Crea tu cuenta')).toBeVisible()

    await page.getByPlaceholder('Tu nombre').fill('Test User')
    await page.getByPlaceholder('tu@email.com').fill(testEmail)
    await page.getByPlaceholder('•••••••• (mín. 8 caracteres)').fill(testPassword)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await page.waitForURL('/dashboard')
    await expect(page.getByText('Bienvenido, Test User')).toBeVisible()
  })

  test('should login with new user', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible()

    await page.getByPlaceholder('tu@email.com').fill(testEmail)
    await page.getByPlaceholder('••••••••').fill(testPassword)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await page.waitForURL('/dashboard')
    await expect(page.getByText('Bienvenido, Test User')).toBeVisible()
  })

  test('should show error with wrong credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('tu@email.com').fill('wrong@example.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page.getByText(/error|inválidas|incorrecto|Credenciales/i)).toBeVisible()
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Registrarse' }).click()
    await page.waitForURL('/register')
    await expect(page.getByText('Crea tu cuenta')).toBeVisible()

    await page.getByRole('link', { name: 'Iniciar sesión' }).click()
    await page.waitForURL('/login')
    await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible()
  })
})
