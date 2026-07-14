import { test, expect } from '@playwright/test'

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('tu@email.com').fill('demo@milestone.app')
    await page.getByPlaceholder('••••••••').fill('demo1234')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.waitForURL('/dashboard')
  })

  const navLinks = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/areas-vitales', label: 'Áreas Vitales' },
    { href: '/dashboard/objetivos', label: 'Objetivos' },
    { href: '/dashboard/proyectos', label: 'Proyectos' },
    { href: '/dashboard/actividades', label: 'Actividades' },
    { href: '/dashboard/calendario', label: 'Calendario' },
    { href: '/dashboard/tiempo', label: 'Tiempo' },
  ]

  for (const { href, label } of navLinks) {
    test(`should navigate to ${label}`, async ({ page }) => {
      await page.getByRole('link', { name: label }).click()
      await page.waitForURL(href)
      expect(page.url()).toContain(href)
    })
  }

  test('should highlight active nav item', async ({ page }) => {
    await page.goto('/dashboard/areas-vitales')
    await page.waitForURL('/dashboard/areas-vitales')

    const activeLink = page.getByRole('link', { name: 'Áreas Vitales' })
    await expect(activeLink).toBeVisible()
  })

  test('should show user info in sidebar', async ({ page }) => {
    await expect(page.getByText('Usuario Demo')).toBeVisible()
    await expect(page.getByText('demo@milestone.app')).toBeVisible()
  })

  test('should logout and redirect to login', async ({ page }) => {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('/login')
    await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible()
  })
})
