import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test.describe('Calendar', () => {
  const testEmail = `cal-${randomUUID().slice(0, 8)}@example.com`
  const testPassword = 'password123'
  const eventTitle = `Test Event ${randomUUID().slice(0, 6)}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.getByPlaceholder('Tu nombre').fill('Calendar Tester')
    await page.getByPlaceholder('tu@email.com').fill(testEmail)
    await page.getByPlaceholder('•••••••• (mín. 8 caracteres)').fill(testPassword)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await page.waitForURL('/dashboard')
  })

  test('should navigate to calendar page', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendario' }).click()
    await page.waitForURL('/dashboard/calendario')
    expect(page.url()).toContain('/dashboard/calendario')
  })

  test('should switch between day, week, month and list views', async ({ page }) => {
    await page.goto('/dashboard/calendario')
    await page.waitForURL('/dashboard/calendario')

    await page.getByRole('button', { name: 'Semana' }).click()
    await expect(
      page.getByText(
        /semana|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i,
      ),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Mes' }).click()
    await expect(page.getByText(/lun|mar|mié|jue|vie|sáb|dom/i)).toBeVisible()

    await page.getByRole('button', { name: 'Día' }).click()
    await expect(page.getByText(/hoy|mañana|día/i)).toBeVisible()

    await page.getByRole('button', { name: 'Lista' }).click()
    await expect(page.getByText(/no hay eventos/i)).toBeVisible()
  })

  test('should navigate days in day view', async ({ page }) => {
    await page.goto('/dashboard/calendario')
    await page.waitForURL('/dashboard/calendario')

    await page.getByRole('button', { name: 'Día' }).click()
    await page.getByLabel('Día siguiente').click()
    await page.getByLabel('Día anterior').click()
  })

  test('should navigate weeks in week view', async ({ page }) => {
    await page.goto('/dashboard/calendario')
    await page.waitForURL('/dashboard/calendario')

    await page.getByRole('button', { name: 'Semana' }).click()
    await page.getByLabel('Semana siguiente').click()
    await page.getByLabel('Semana anterior').click()
  })
})
