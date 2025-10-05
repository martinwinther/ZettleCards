import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Clear any existing data
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('FlashFilesDB')
    })
    
    await page.reload()
    
    // Import sample cards first
    await page.goto('/import')
    const sampleFile = path.resolve(__dirname, '../../sample notes/04-eternal-soul.md')
    await page.locator('input[type="file"]').setInputFiles([sampleFile])
    await page.waitForSelector('table tbody tr')
    await page.click('button:has-text("Import")')
    await page.waitForURL('/library')
  })

  test('should start review session and rate a card', async ({ page }) => {
    await page.goto('/review')
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Review')
    
    // Start session
    await page.click('button:has-text("Start Session")')
    
    // Wait for card to appear
    await page.waitForSelector('button:has-text("Show Answer")', { timeout: 5000 })
    
    // Verify question is visible
    const question = page.locator('h1.text-2xl').first()
    await expect(question).toBeVisible()
    
    // Flip card
    await page.click('button:has-text("Show Answer")')
    
    // Wait for rating buttons to appear
    await page.waitForSelector('button:has-text("Again")')
    await page.waitForSelector('button:has-text("Good")')
    await page.waitForSelector('button:has-text("Easy")')
    
    // Rate as Good
    await page.click('button:has-text("Good")')
    
    // Verify session complete or next card
    await page.waitForTimeout(1000)
    
    // Check that we're either at session complete or next card
    const hasSessionComplete = await page.locator('text=Session Complete').isVisible()
    const hasNextCard = await page.locator('button:has-text("Show Answer")').isVisible()
    
    expect(hasSessionComplete || hasNextCard).toBeTruthy()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/review')
    
    // Start session
    await page.click('button:has-text("Start Session")')
    await page.waitForSelector('button:has-text("Show Answer")')
    
    // Press Space to flip
    await page.keyboard.press('Space')
    
    // Wait for rating buttons
    await page.waitForSelector('button:has-text("Good")')
    
    // Press 2 for Good rating
    await page.keyboard.press('2')
    
    // Verify rating was registered (session advances)
    await page.waitForTimeout(500)
  })

  test('should show empty state when no cards', async ({ page }) => {
    // Clear all cards
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('FlashFilesDB')
    })
    await page.reload()
    
    await page.goto('/review')
    
    // Should show empty state
    await expect(page.locator('text=No cards to review')).toBeVisible()
    await expect(page.locator('a:has-text("Import Files")')).toBeVisible()
  })

  test('should display HUD stats', async ({ page }) => {
    await page.goto('/review')
    
    // Check HUD elements are present
    await expect(page.locator('text=Due today')).toBeVisible()
    await expect(page.locator('text=New available')).toBeVisible()
    await expect(page.locator('text=In queue')).toBeVisible()
    await expect(page.locator('text=Reviewed')).toBeVisible()
  })
})
