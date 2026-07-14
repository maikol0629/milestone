import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test.describe('CRUD Operations', () => {
  const testEmail = `crud-${randomUUID().slice(0, 8)}@example.com`
  const testPassword = 'password123'
  const areaName = `Test Area ${randomUUID().slice(0, 6)}`
  const goalTitle = `Test Goal ${randomUUID().slice(0, 6)}`
  const projectName = `Test Project ${randomUUID().slice(0, 6)}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.getByPlaceholder('Tu nombre').fill('CRUD Tester')
    await page.getByPlaceholder('tu@email.com').fill(testEmail)
    await page.getByPlaceholder('•••••••• (mín. 8 caracteres)').fill(testPassword)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await page.waitForURL('/dashboard')
  })

  test('should create, edit and delete a life area', async ({ page }) => {
    await page.goto('/dashboard/areas-vitales')
    await page.waitForURL('/dashboard/areas-vitales')

    await page.getByPlaceholder('Ej: Salud, Finanzas, Carrera...').fill(areaName)
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByText(areaName)).toBeVisible()

    const updatedName = `${areaName} (editado)`
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByPlaceholder('Ej: Salud, Finanzas, Carrera...').clear()
    await page.getByPlaceholder('Ej: Salud, Finanzas, Carrera...').fill(updatedName)
    await page.getByRole('button', { name: 'Actualizar' }).click()
    await expect(page.getByText(updatedName)).toBeVisible()

    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(page.getByText(updatedName)).not.toBeVisible()
  })

  test('should create, edit and delete a goal', async ({ page }) => {
    await page.goto('/dashboard/areas-vitales')
    await page.getByPlaceholder('Ej: Salud, Finanzas, Carrera...').fill(areaName)
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByText(areaName)).toBeVisible()

    await page.goto('/dashboard/objetivos')
    await page.waitForURL('/dashboard/objetivos')

    await page.getByPlaceholder('Ej: Mejorar mi salud física...').fill(goalTitle)
    await page.getByRole('combobox').click()
    await page.getByText(areaName).click()
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByText(goalTitle)).toBeVisible()

    const updatedTitle = `${goalTitle} (editado)`
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByPlaceholder('Ej: Mejorar mi salud física...').clear()
    await page.getByPlaceholder('Ej: Mejorar mi salud física...').fill(updatedTitle)
    await page.getByRole('button', { name: 'Actualizar' }).click()
    await expect(page.getByText(updatedTitle)).toBeVisible()

    await page.getByRole('button', { name: 'Eliminar' }).first().click()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(page.getByText(updatedTitle)).not.toBeVisible()
  })

  test('should create a project linked to a goal', async ({ page }) => {
    await page.goto('/dashboard/areas-vitales')
    await page.getByPlaceholder('Ej: Salud, Finanzas, Carrera...').fill(areaName)
    await page.getByRole('button', { name: 'Crear' }).click()

    await page.goto('/dashboard/objetivos')
    await page.getByPlaceholder('Ej: Mejorar mi salud física...').fill(goalTitle)
    await page.getByRole('combobox').click()
    await page.getByText(areaName).click()
    await page.getByRole('button', { name: 'Crear' }).click()

    await page.goto('/dashboard/proyectos')
    await page.waitForURL('/dashboard/proyectos')

    await page.getByPlaceholder('Ej: Crear app de fitness...').fill(projectName)
    await page.getByRole('combobox').click()
    await page.getByText(goalTitle).click()
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByText(projectName)).toBeVisible()
  })
})
