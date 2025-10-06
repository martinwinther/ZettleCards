import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Clear any existing data
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('FlashFilesDB')
    })
    
    await page.reload()
  })

  test('should import markdown files and show them in library', async ({ page }) => {
    // Navigate to import page
    await page.goto('/import')
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Import')
    
    // Prepare sample markdown files
    const sampleFiles = [
      path.resolve(__dirname, '../../sample notes/04-eternal-soul.md'),
      path.resolve(__dirname, '../../sample notes/05-what-is-bhakti.md')
    ]
    
    // Upload files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(sampleFiles)
    
    // Wait for preview to show
    await page.waitForSelector('table tbody tr', { timeout: 5000 })
    
    // Check that 2 rows are shown in preview
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    
    // Click import button
    await page.click('button:has-text("Import")')
    
    // Wait for navigation to library
    await page.waitForURL('/library', { timeout: 10000 })
    
    // Verify cards are in library
    await expect(page.locator('h1')).toContainText('Library')
    
    // Check that 2 cards are displayed
    const cardElements = page.locator('[class*="bg-white dark:bg-gray-800"][class*="border"]').filter({ hasText: /#/ })
    await expect(cardElements).toHaveCount(2, { timeout: 5000 })
    
    // Verify success toast appears
    await expect(page.locator('[role="alert"]')).toContainText('Import successful')
  })

  test('should handle duplicate detection', async ({ page }) => {
    // First import
    await page.goto('/import')
    
    const sampleFile = path.resolve(__dirname, '../../sample notes/04-eternal-soul.md')
    await page.locator('input[type="file"]').setInputFiles([sampleFile])
    
    await page.waitForSelector('table tbody tr')
    await page.click('button:has-text("Import")')
    await page.waitForURL('/library')
    
    // Second import (same file)
    await page.goto('/import')
    await page.locator('input[type="file"]').setInputFiles([sampleFile])
    
    await page.waitForSelector('table tbody tr')
    
    // Check for duplicate indicator
    await expect(page.locator('text=Duplicate')).toBeVisible()
    
    // Verify skip action is default
    const actionSelect = page.locator('select').first()
    await expect(actionSelect).toHaveValue('skip')
  })

  test('should show empty state when no files uploaded', async ({ page }) => {
    await page.goto('/import')
    
    // Should show the drop zone
    await expect(page.locator('text=Drop your Obsidian')).toBeVisible()
    
    // Should show the select files button
    await expect(page.locator('button:has-text("Select Files")')).toBeVisible()
  })
})
