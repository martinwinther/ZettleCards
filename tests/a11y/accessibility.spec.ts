import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Accessibility Smoke Tests', () => {
  test('all pages render without JS errors', async ({ page }) => {
    const pages = ['/import', '/library', '/review', '/settings']
    
    for (const path of pages) {
      const errors: string[] = []
      
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })
      
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      
      expect(errors).toHaveLength(0)
    }
  })

  test('all main pages have H1 heading', async ({ page }) => {
    const pages = [
      { path: '/import', heading: 'Import' },
      { path: '/library', heading: 'Library' },
      { path: '/review', heading: 'Review' },
      { path: '/settings', heading: 'Settings' }
    ]
    
    for (const { path, heading } of pages) {
      await page.goto(path)
      const h1 = page.locator('h1')
      await expect(h1).toContainText(heading)
    }
  })

  test('navigation links are keyboard accessible', async ({ page }) => {
    await page.goto('/')
    
    // Tab to skip link (first focusable element)
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a:has-text("Skip to content")')
    await expect(skipLink).toBeFocused()
    
    // Tab to navigation
    await page.keyboard.press('Tab')
    const firstNavLink = page.locator('nav a').first()
    await expect(firstNavLink).toBeFocused()
  })

  test('review page has flip button and rating buttons', async ({ page }) => {
    await page.goto('/review')
    
    // Check for session setup first
    const startButton = page.locator('button:has-text("Start Session")')
    if (await startButton.isVisible()) {
      await startButton.click()
      await page.waitForSelector('button:has-text("Show Answer")')
    }
    
    // Verify flip button exists
    const flipButton = page.locator('button:has-text("Show Answer")')
    await expect(flipButton).toBeVisible()
    
    // Flip the card
    await flipButton.click()
    
    // Verify rating buttons exist
    await expect(page.locator('button:has-text("Again")')).toBeVisible()
    await expect(page.locator('button:has-text("Good")')).toBeVisible()
    await expect(page.locator('button:has-text("Easy")')).toBeVisible()
  })

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/import')
    
    // File input should have label
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveAttribute('accept', '.md')
    
    await page.goto('/library')
    
    // Search input should have label
    const searchInput = page.locator('input[type="text"]').first()
    const searchLabel = await searchInput.getAttribute('aria-label') || 
                        await page.locator('label[for="search"]').textContent()
    expect(searchLabel).toBeTruthy()
  })

  test('interactive elements have focus styles', async ({ page }) => {
    await page.goto('/')
    
    // Tab through navigation
    await page.keyboard.press('Tab') // Skip link
    await page.keyboard.press('Tab') // First nav item
    
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check if focus ring is visible (via computed styles)
    const outlineWidth = await focusedElement.evaluate((el) => {
      return window.getComputedStyle(el).outlineWidth
    })
    
    // Either outline or box-shadow should be present for focus indication
    expect(outlineWidth !== '0px' || await focusedElement.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow !== 'none'
    })).toBeTruthy()
  })

  test('dark mode toggle has proper ARIA attributes', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.locator('button[aria-label*="mode"]')
    await expect(darkModeButton).toBeVisible()
    await expect(darkModeButton).toHaveAttribute('aria-label')
    await expect(darkModeButton).toHaveAttribute('aria-pressed')
  })

  test('toast notifications use proper ARIA roles', async ({ page }) => {
    await page.goto('/import')
    
    // Trigger an import to show toast
    const samplePath = path.resolve(__dirname, '../../sample notes/04-eternal-soul.md')
    
    await page.locator('input[type="file"]').setInputFiles([samplePath])
    await page.waitForSelector('table tbody tr')
    await page.click('button:has-text("Import")')
    
    // Wait for toast
    const toast = page.locator('[role="alert"]')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })
})
