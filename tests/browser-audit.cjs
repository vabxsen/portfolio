// Run only against a disposable local app with the synthetic test owner.
// PLAYWRIGHT_MODULE may point to a preinstalled Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://localhost:5174';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('This destructive fixture test must only run on localhost.');
const results = [];
function pass(name) {
  results.push(name);
  console.log('PASS:', name);
}
async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  const button = (name) => page.getByRole('button', { name, exact: true });
  const tab = async (name) => {
    await button(name).click();
    await page.getByRole('heading', { name, exact: true, level: 1 }).waitFor();
  };
  const goto = async (url) => {
    await page.goto(url);
    await page.waitForTimeout(800);
  };
  const state = async () => (await context.request.get(base + '/api/admin/content/')).json();
  const post = async (action, data) =>
    context.request.post(base + '/api/admin/' + action + '/', { data, headers: { Origin: base } });
  const feedback = async (text) => page.getByRole('status').filter({ hasText: text }).waitFor();
  const save = async () => {
    await button('Save for later').click();
    await feedback('Draft saved.');
  };
  const originalDir = path.join(process.cwd(), 'work', 'browser-audit');
  await fs.mkdir(originalDir, { recursive: true });
  let restoreContent;
  try {
    if (!process.env.AUDIT_ADMIN_ONLY) {
      await goto(base);
      assert.deepEqual(
        await page.evaluate(() =>
          [...document.querySelectorAll('a[href^="#"]')]
            .filter((a) => !document.getElementById(a.hash.slice(1)))
            .map((a) => a.hash),
        ),
        [],
      );
      for (const hash of ['work', 'about', 'journey', 'opensource', 'contact', 'top']) {
        await page.locator(`a[href="#${hash}"]`).first().click();
        await page.waitForURL('**/#' + hash);
      }
      pass('All public section links and back-to-top targets');
      const disclosures = page.locator('.index-row');
      for (let i = 0; i < (await disclosures.count()); i++) {
        const row = disclosures.nth(i);
        await row.locator('summary').click();
        assert.notEqual(await row.getAttribute('open'), null);
        await row.locator('summary').press('Enter');
        assert.equal(await row.getAttribute('open'), null);
      }
      assert.equal(await page.locator('.chapter[data-project="pricepilot"]').count(), 0);
      assert.equal(await page.locator('.index-list [data-project="pricepilot"]').count(), 1);
      pass('Every More Work disclosure opens/closes by mouse and keyboard; PricePilot placement');
      const email = new URL(await page.locator('.email-link').getAttribute('href'));
      assert.equal(email.hostname, 'mail.google.com');
      assert.equal(email.searchParams.get('to'), 'cheeseburst06@gmail.com');
      const outbound = await page
        .locator('a[href^="https:"]')
        .evaluateAll((xs) => xs.map((x) => ({ href: x.href, text: x.textContent.trim() })));
      assert(outbound.every((x) => x.href.startsWith('https://')));
      // Intercept the destination only; the real button/link still receives the click.
      await context.route('https://**/*', (route) =>
        route.fulfill({ status: 200, body: '<title>Destination reached</title>' }),
      );
      for (const selector of ['.stage-link', '.project-link', '.repo-card']) {
        const links = page.locator(selector);
        for (let i = 0; i < (await links.count()); i++) {
          const link = links.nth(i);
          const details = link.locator('xpath=ancestor::details');
          if ((await details.count()) && (await details.getAttribute('open')) === null)
            await details.locator('summary').click();
          const destination = await link.getAttribute('href');
          const popupEvent = context.waitForEvent('page');
          await link.click();
          const popup = await popupEvent;
          await popup.waitForLoadState();
          assert.equal(popup.url().replace(/\/$/, ''), destination.replace(/\/$/, ''));
          await popup.close();
        }
      }
      await page.locator('.email-link').click();
      await page.waitForURL('https://mail.google.com/**');
      await goto(base);
      await context.unroute('https://**/*');
      pass(
        'Every project preview, project link, repository card, and Gmail contact click opens its destination',
      );
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 850 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      await page.setViewportSize({ width: 390, height: 844 });
      const toggle = page.locator('.menu-toggle');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await toggle.click();
      await page.locator('#mobile-menu a').first().click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      pass('Responsive widths and mobile menu, Escape, and menu navigation');
      await page.screenshot({ path: path.join(originalDir, 'mobile.png') });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await goto(base + '/admin/');
    await page.getByLabel('Email address').fill('seedy@sites.test');
    await page.getByLabel('Password', { exact: true }).fill('wrong');
    await button('Show password').click();
    assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
    await button('Hide password').click();
    await button('Sign in').click();
    await page.getByRole('alert').filter({ hasText: 'Incorrect email or password' }).waitFor();
    await context.route('**/api/auth/login/', (route) =>
      route.fulfill({ status: 503, contentType: 'text/html', body: 'Gateway unavailable' }),
    );
    await button('Sign in').click();
    await page.getByRole('alert').filter({ hasText: 'temporarily unavailable' }).waitFor();
    await context.unroute('**/api/auth/login/');
    await page.getByLabel('Password', { exact: true }).fill('Local-owner-test!6');
    await button('Sign in').click();
    await button('Profile').waitFor();
    await page.waitForFunction(() => {
      const el = document.querySelector('.admin-sidebar button');
      return el && Object.keys(el).some((key) => key.startsWith('__reactProps'));
    });
    pass(
      'Password visibility, incorrect credentials, readable server errors, and successful login',
    );
    const original = (await state()).content;
    restoreContent = original;
    const initialPublicRecord = await fs.readFile(
      path.join(process.cwd(), '.local-data/data/published.json'),
      'utf8',
    );
    await tab('Projects');
    await page.locator('.admin-project-summary').filter({ hasText: 'Kimi' }).click();
    const screenshot = page.getByLabel('Project screenshot');
    const oldImage = await screenshot.inputValue();
    await screenshot.selectOption('');
    await screenshot.selectOption(oldImage);
    await button('Move down').click();
    assert.deepEqual(
      await page.locator('.admin-project-column').first().locator('strong').allTextContents(),
      ['Scoop', 'Budgie', 'Kimi'],
    );
    await button('Move up').click();
    await button('Move Kimi to More Work').click();
    await button('Move Kimi to Featured work').click();
    await button('Move Kimi up in Featured work').click();
    await button('Add project').click();
    await page
      .locator('.admin-project-detail')
      .getByLabel('Name', { exact: true })
      .fill('Browser audit project');
    await save();
    assert.equal((await state()).content.projects.at(-1).github, null);
    const added = (await state()).content.projects.at(-1);
    const newPreviewEvent = context.waitForEvent('page');
    await button('Preview draft').click();
    const newPreview = await newPreviewEvent;
    await newPreview.waitForURL('**/admin/preview/');
    const addedRow = newPreview.locator(`.index-list [data-project="${added.slug}"]`);
    await addedRow.locator('summary').click();
    assert.equal(await addedRow.locator('.mock-bar > span').textContent(), 'Browser audit project');
    await newPreview.close();
    await button('Remove').click();
    await save();
    pass(
      'Project add/remove, both ordering controls, placement, optional links, and restoring built-in screenshots',
    );
    await tab('Profile');
    await page.getByLabel('Name', { exact: true }).fill('Preview Verification');
    const previewEvent = context.waitForEvent('page');
    await button('Preview draft').click();
    const preview = await previewEvent;
    await preview.waitForURL('**/admin/preview/');
    await preview.locator('#hero-title').filter({ hasText: 'Preview Verification' }).waitFor();
    await preview.close();
    const publicPage = await context.newPage();
    await publicPage.goto(base);
    assert(!(await publicPage.locator('#hero-title').innerText()).includes('Preview Verification'));
    await button('Publish changes').click();
    await feedback('Published.');
    await publicPage.reload();
    assert((await publicPage.locator('#hero-title').innerText()).includes('Preview Verification'));
    pass('Preview auto-saves latest edits privately; publishing updates the public site');
    await fs.writeFile(
      path.join(process.cwd(), '.local-data/data/published.json'),
      initialPublicRecord,
    );
    await goto(base + '/admin/');
    await page.waitForFunction(() => {
      const el = document.querySelector('.admin-sidebar button');
      return el && Object.keys(el).some((key) => key.startsWith('__reactProps'));
    });
    assert(await button('Publish changes').isEnabled());
    await button('Publish changes').click();
    await feedback('Published.');
    await publicPage.reload();
    assert((await publicPage.locator('#hero-title').innerText()).includes('Preview Verification'));
    pass('A partial publication remains retryable after reloading the admin');
    await tab('Overview');
    const downloadEvent = page.waitForEvent('download');
    await button('Export current content').click();
    const download = await downloadEvent;
    const backupPath = path.join(originalDir, 'backup.json');
    await download.saveAs(backupPath);
    const backup = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    assert.equal(backup.profile.name, 'Preview Verification');
    backup.profile.name = 'Imported Verification';
    const uploadPath = path.join(originalDir, 'import.json');
    await fs.writeFile(uploadPath, JSON.stringify(backup));
    const chooserEvent = page.waitForEvent('filechooser');
    await button('Import backup').click();
    await (await chooserEvent).setFiles(uploadPath);
    await feedback('Backup loaded');
    await save();
    assert.equal((await state()).content.profile.name, 'Imported Verification');
    pass('Backup download and import preserve content and save to draft');
    for (const name of ['Page copy', 'Tech stack', 'Journey', 'Open source']) {
      await tab(name);
      assert((await page.locator('.admin-editor input, .admin-editor textarea').count()) > 0);
      const field = page
        .locator('.admin-editor input[type="text"], .admin-editor textarea')
        .first();
      const old = await field.inputValue();
      await field.fill(old + ' test');
      await save();
      await field.fill(old);
      await save();
    }
    await tab('Tech stack');
    await button('Add Stack').click();
    assert((await page.getByLabel('Label', { exact: true }).count()) > 3);
    await save();
    await page
      .getByRole('button', { name: /^Remove stack item/ })
      .last()
      .click();
    await save();
    pass('Page copy, stack, journey, and repository editors save; array add/remove controls');
    await tab('Appearance');
    for (const name of ['Work', 'About', 'Journey', 'Opensource', 'Contact', 'Motion'])
      await page.getByLabel(name, { exact: true }).uncheck();
    await tab('Profile');
    await page.getByLabel('GitHub URL optional').fill('');
    await save();
    const pEvent = context.waitForEvent('page');
    await button('Preview draft').click();
    const minimal = await pEvent;
    await minimal.waitForURL('**/admin/preview/');
    assert.deepEqual(
      await minimal.evaluate(() =>
        [...document.querySelectorAll('a[href^="#"]')]
          .filter((a) => !document.getElementById(a.hash.slice(1)))
          .map((a) => a.hash),
      ),
      [],
    );
    assert.equal(await minimal.locator('a').filter({ hasText: 'GitHub' }).count(), 0);
    await minimal.close();
    pass('Section switches and optional GitHub setting do not leave dead links');
    await tab('Media library');
    const mediaEvent = page.waitForEvent('filechooser');
    await button('Upload image').click();
    await (await mediaEvent).setFiles(path.join(process.cwd(), 'public/projects/budgie-home.jpg'));
    await feedback('Image uploaded.');
    const media = await (await context.request.get(base + '/api/admin/media/')).json();
    assert(media.length > 0);
    await page.locator('.admin-media-grid img').first().waitFor();
    await page.waitForFunction(() => {
      const image = document.querySelector('.admin-media-grid img');
      return image?.complete && image.naturalWidth > 0;
    });
    await tab('Projects');
    await page.locator('.admin-project-summary').filter({ hasText: 'Budgie' }).click();
    await page.getByLabel('Project screenshot').selectOption('/media/' + media[0].id);
    await save();
    pass('Upload button, image library rendering, and project image selection');
    const invalidImage = await context.request.post(base + '/api/admin/upload/', {
      data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      headers: { Origin: base, 'Content-Type': 'image/jpeg', 'X-File-Name': 'invalid.jpg' },
    });
    assert.equal(invalidImage.status(), 400);
    pass('Corrupted images are rejected instead of saved as broken thumbnails');
    const sharp = require(path.join(process.cwd(), 'node_modules/sharp'));
    for (const format of ['png', 'webp']) {
      const image = await sharp({
        create: { width: 20, height: 20, channels: 3, background: '#336699' },
      })
        .toFormat(format)
        .toBuffer();
      const result = await context.request.post(base + '/api/admin/upload/', {
        data: image,
        headers: {
          Origin: base,
          'Content-Type': `image/${format}`,
          'X-File-Name': `audit.${format}`,
        },
      });
      assert.equal(result.status(), 200);
      const file = await context.request.get(base + (await result.json()).url);
      assert.equal(file.status(), 200);
      assert.equal((await sharp(await file.body()).metadata()).format, format);
    }
    pass('PNG and WebP uploads remain decodable after metadata removal');
    await tab('History');
    await page.getByRole('button', { name: 'Restore to draft', exact: true }).first().click();
    await feedback('Revision restored');
    assert.equal((await state()).content.profile.name, 'Preview Verification');
    pass('History restore updates draft');
    const current = await state();
    const newer = structuredClone(current.content);
    newer.profile.name = 'Concurrent edit';
    assert((await post('save', { content: newer, version: current.version })).ok());
    await tab('Profile');
    await page.getByLabel('Name', { exact: true }).fill('Stale edit');
    await button('Save for later').click();
    await page.getByRole('alert').filter({ hasText: 'another tab' }).waitFor();
    assert.equal(await page.getByLabel('Name', { exact: true }).inputValue(), 'Stale edit');
    pass('Conflicting saves show a recovery message and retain unsaved work');
    const latest = await state();
    const reset = await (await post('save', { content: original, version: latest.version })).json();
    assert((await post('publish', { version: reset.version })).ok());
    await goto(base + '/admin/');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ['Overview', 'Projects', 'Profile', 'Appearance', 'History']) {
        await tab(name);
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${name} overflows at ${width}`,
        );
      }
    }
    pass('Admin navigation and responsive layout across four viewport widths');
    await page.screenshot({ path: path.join(originalDir, 'admin.png') });
    await button('Sign out').click();
    await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
    assert.equal((await context.request.get(base + '/api/admin/content/')).status(), 401);
    pass('Sign out revokes admin access');
    assert.deepEqual(errors, []);
    pass('No uncaught browser errors');
    console.log(`Completed ${results.length} browser workflow groups.`);
  } catch (error) {
    await page.screenshot({ path: path.join(originalDir, 'failure.png'), fullPage: true });
    console.error(await page.locator('body').innerText());
    throw error;
  } finally {
    if (restoreContent) {
      const response = await context.request.get(base + '/api/admin/content/');
      if (response.ok()) {
        const current = await response.json();
        const saved = await post('save', { content: restoreContent, version: current.version });
        if (saved.ok()) await post('publish', { version: (await saved.json()).version });
      }
    }
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
