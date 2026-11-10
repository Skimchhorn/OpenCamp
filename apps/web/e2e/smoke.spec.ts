import { expect, test } from '@playwright/test'

test('a new user can add a campsite and see it as not verified', async ({ page }) => {
  const stamp = Date.now()
  const name = `Smoke Test Spot ${stamp}`

  await page.goto('/login')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Email').fill(`smoke-${stamp}@example.com`)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

  await page.getByRole('link', { name: 'Add campsite' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Description and access notes').fill('Gravel pull-out beside the river. Created by the smoke test.')
  await page.getByLabel('Region').fill('Smoke Test Valley')
  await page.getByLabel('Latitude').fill('49.5')
  await page.getByLabel('Longitude').fill('-121.5')
  await page.getByLabel('Road condition').selectOption('GRAVEL')
  await page.getByLabel('Vehicle required').selectOption('ANY_CAR')
  await page.getByLabel('Legal status').selectOption('NEEDS_VERIFICATION')
  await expect(page.getByLabel('Legal status').locator('option[value="PRIVATE_PROPERTY"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Submit campsite' }).click()

  await expect(page).toHaveURL(/\/campsites\/\d+$/)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('Not verified yet')

  // Clean up so repeated runs do not pile up listings in the dev database.
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page).toHaveURL('/')
})
