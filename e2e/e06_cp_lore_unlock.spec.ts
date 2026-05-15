/**
 * E06 · cp_lore_unlock
 * Seed localStorage with perfect results on all 4 school subjects → reload →
 * CP LORE menu item should be unlocked (no 🔒, no disabled).
 */
import { test, expect } from '@playwright/test';
import { seedSkipIntros, seedAllSubjectsPerfect } from './helpers';

test('E06 cp_lore_unlock — CP LORE becomes selectable after 4 school subjects passed', async ({ page }) => {
  await seedSkipIntros(page);
  await seedAllSubjectsPerfect(page);

  await page.goto('/');

  // CP LORE button must be enabled (not disabled, no 🔒 in icon column).
  const cpLore = page.getByRole('button', { name: /CP\s*LORE/i });
  await expect(cpLore).toBeVisible();
  await expect(cpLore).toBeEnabled({ timeout: 5_000 });

  // The button must NOT contain the lock emoji.
  const buttonText = await cpLore.innerText();
  expect(buttonText).not.toContain('🔒');

  // Page should not show the "locked · N/4 cleared" hint.
  const lockHint = page.getByText(/CP2077 LORE locked/i);
  expect(await lockHint.count()).toBe(0);
});
