const { chromium, expect } = require('/Users/jincenmathew/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const output = __dirname;
const base = 'http://127.0.0.1:3000';
const executablePath = '/Users/jincenmathew/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const result = { captured_at: new Date().toISOString(), base_url: base, scope: 'Local combined submission candidate. No deployment or live provider operations. Next.js development indicator hidden from screenshots only.', checks: [], screenshots: [], api_requests: [], browser_errors: [] };
const check = (name, detail = {}) => result.checks.push({ name, passed: true, ...detail });
const snap = async (page, name, locator) => {
  const filename = `${name}.png`;
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  if (locator) await locator.screenshot({ path: path.join(output, filename), animations: 'disabled' });
  else await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: 'disabled' });
  result.screenshots.push(filename);
};
const overflow = async page => page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > innerWidth }));
function track(page, context) {
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) result.api_requests.push({ context, method: request.method(), path: new URL(request.url()).pathname }); });
  page.on('pageerror', error => result.browser_errors.push({ context, error: error.message }));
}
async function ready() {
  for (let attempt = 0; attempt < 90; attempt++) {
    try { const response = await fetch(`${base}/play`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Local web server did not become ready within 90 seconds');
}
(async () => {
  let browser;
  try {
    await ready();
    browser = await chromium.launch({ headless: true, executablePath });
    result.browser_version = browser.version();
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await desktop.newPage(); track(page, 'desktop');
    await page.goto(`${base}/play`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'The clearing question', exact: true })).toBeVisible();
    const game = page.getByRole('region', { name: 'The clearing question opening mission' });
    await snap(page, 'play-desktop-opening', game);
    const desktopOverflow = await overflow(page); expect(desktopOverflow.overflow).toBe(false); check('desktop_initial_no_horizontal_overflow', desktopOverflow);
    await page.getByRole('button', { name: 'Start mission', exact: true }).click();
    const office = page.getByRole('group', { name: /^Navigable office/ });
    await expect(office).toBeFocused();
    for (let step = 0; step < 4; step++) await office.press('ArrowUp');
    await expect(office).toHaveAccessibleName(/column 4, row 5.*Desk nearby/);
    await office.press('e');
    await expect(page.getByRole('heading', { name: 'A letter on Eli’s desk', exact: true })).toBeFocused();
    await expect(page.getByText(/maintenance support ends on 31 October/)).toBeVisible();
    check('desktop_keyboard_movement_proximity_interaction_and_document_focus');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByText('Mission paused', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close evidence & return to office', exact: true })).toBeDisabled();
    await snap(page, 'play-desktop-paused', game);
    await page.getByRole('button', { name: 'Resume mission', exact: true }).click();
    await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
    check('pause_resume_retains_evidence');
    await page.getByRole('heading', { name: 'A letter on Eli’s desk', exact: true }).press('Escape');
    await office.press('ArrowDown');
    for (let step = 0; step < 4; step++) await office.press('ArrowRight');
    await office.press('e');
    await expect(page.getByRole('heading', { name: 'The clearing ledger', exact: true })).toBeVisible();
    await snap(page, 'play-desktop-ledger', game);
    await page.getByRole('heading', { name: 'The clearing ledger', exact: true }).press('Escape');
    for (let step = 0; step < 6; step++) await office.press('ArrowRight');
    await office.press('ArrowUp'); await office.press('e');
    await expect(page.getByRole('heading', { name: 'The settlement file', exact: true })).toBeVisible();
    await page.getByRole('heading', { name: 'The settlement file', exact: true }).press('Escape');
    await office.press('ArrowLeft'); await office.press('ArrowDown'); await office.press('ArrowDown'); await office.press('e');
    await expect(page.getByRole('heading', { name: 'A mapping worth checking', exact: true })).toBeVisible();
    await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
    check('all_three_evidence_items_reachable_through_keyboard_gameplay');
    await page.getByLabel('Amount still held by the processor (USD)').fill('25.00');
    await page.getByLabel('Destination for 1200 · Misc Clearing').selectOption('bank');
    await page.getByRole('button', { name: 'Run readiness check', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Bank reconciliation failed' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore Demo →', exact: true })).toHaveCount(0);
    await snap(page, 'play-desktop-failed-mapping', game);
    check('bank_mapping_failure_blocks_demo_unlock_and_explains_25_dollar_cash_difference');
    await page.getByLabel('Destination for 1200 · Misc Clearing').selectOption('clearing');
    await page.getByRole('button', { name: 'Run readiness check', exact: true }).click();
    await expect(page.getByText('Mission complete · Demo unlocked', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore Demo →', exact: true })).toHaveAttribute('href', '/simulator');
    await expect(page.getByRole('button', { name: 'Run readiness check', exact: true })).toBeDisabled();
    await snap(page, 'play-desktop-complete', game);
    check('failed_mapping_recovery_success_and_optional_explore_demo_handoff');
    expect((await overflow(page)).overflow).toBe(false); check('desktop_complete_no_horizontal_overflow');
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const m = await mobile.newPage(); track(m, 'mobile390');
    await m.goto(`${base}/play`, { waitUntil: 'networkidle' });
    let mobileOverflow = await overflow(m); expect(mobileOverflow.overflow).toBe(false); check('mobile390_initial_no_horizontal_overflow', mobileOverflow);
    await snap(m, 'play-mobile390-opening');
    await m.getByRole('button', { name: 'Start mission', exact: true }).tap();
    await m.getByRole('button', { name: 'Walk right', exact: true }).tap();
    await expect(m.getByRole('group', { name: /^Navigable office/ })).toHaveAccessibleName(/column 5, row 9/);
    check('mobile_touch_direction_pad_moves_character');
    await m.getByText('Object shortcuts · keyboard, touch & screen reader', { exact: true }).tap();
    await m.getByRole('button', { name: 'Inspect laptop', exact: true }).tap();
    await expect(m.getByRole('button', { name: 'Run readiness check', exact: true })).toBeDisabled();
    check('mobile_readiness_stays_locked_without_collected_evidence');
    for (const name of ['desk', 'ledger', 'filing cabinet']) await m.getByRole('button', { name: `Inspect ${name}`, exact: true }).tap();
    await m.getByRole('button', { name: 'Inspect laptop · collected', exact: true }).tap();
    await m.getByLabel('Amount still held by the processor (USD)').fill('25');
    await m.getByLabel('Destination for 1200 · Misc Clearing').selectOption('clearing');
    await m.getByRole('button', { name: 'Run readiness check', exact: true }).tap();
    await expect(m.getByText('Mission complete · Demo unlocked', { exact: true })).toBeVisible();
    mobileOverflow = await overflow(m); expect(mobileOverflow.overflow).toBe(false); check('mobile390_completion_and_no_horizontal_overflow', mobileOverflow);
    await snap(m, 'play-mobile390-complete');
    await mobile.close();

    const reduced = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const r = await reduced.newPage(); track(r, 'reduced-motion');
    await r.goto(`${base}/play`, { waitUntil: 'networkidle' });
    await r.getByRole('button', { name: 'Start mission', exact: true }).click();
    const motion = await r.locator('[data-facing]').evaluate(element => ({ preference: matchMedia('(prefers-reduced-motion: reduce)').matches, transitionDuration: getComputedStyle(element).transitionDuration, transitionProperty: getComputedStyle(element).transitionProperty }));
    expect(motion.preference).toBe(true); expect(motion.transitionProperty).toBe('none'); expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.00001);
    check('os_reduced_motion_disables_character_interpolation', motion);
    await snap(r, 'play-reduced-motion', r.getByRole('region', { name: 'The clearing question opening mission' }));
    await reduced.close();
    expect(result.api_requests.filter(request => !request.path.startsWith('/api/auth/'))).toEqual([]);
    check('no_financial_api_calls_during_gameplay', { requests: result.api_requests });
    expect(result.browser_errors).toEqual([]); check('no_browser_runtime_errors');
    result.status = 'PASSED';
  } catch (error) {
    result.status = 'FAILED'; result.error = error.stack;
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    fs.writeFileSync(path.join(output, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify({ status: result.status, checks: result.checks.length, screenshots: result.screenshots, error: result.error }, null, 2));
  }
})();
