import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { IPTV_CHANNELS, IPTV_REGIONS } from '../src/config/iptv-channels';

/**
 * End-to-end coverage for the IPTV tab of the Live Webcams panel.
 *
 * Real IPTV streams are geo-restricted and come and go, so every channel URL is
 * routed to a small local HLS fixture. This exercises the real hls.js playback path
 * (manifest -> init segment -> media segments -> MSE) without depending on third parties.
 */

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'hls');
const FIXTURE_HOST = 'https://hls-fixture.invalid';
const CHANNEL_URLS = new Set(IPTV_CHANNELS.map(c => c.url));
const BROKEN_CHANNEL_ID = 'bbc-news';
const BROKEN_CHANNEL_URL = IPTV_CHANNELS.find(c => c.id === BROKEN_CHANNEL_ID)!.url;

// Segment URIs in the fixture playlist are relative; hls.js resolves them against the
// playlist URL, so rewrite them to the fixture host to keep one route handler.
const FIXTURE_PLAYLIST = readFileSync(join(FIXTURE_DIR, 'index.m3u8'), 'utf8')
  .replace(/URI="init\.mp4"/, `URI="${FIXTURE_HOST}/init.mp4"`)
  .replace(/^(index\d+\.m4s)$/gm, `${FIXTURE_HOST}/$1`);

const EMPTY_MAP_STYLE = JSON.stringify({
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0b1020' } }],
});

async function routeStreams(page: Page, opts: { broken?: string[] } = {}): Promise<{ manifestHits: string[] }> {
  const manifestHits: string[] = [];
  const broken = new Set(opts.broken ?? []);

  await page.route(url => CHANNEL_URLS.has(url.toString()), route => {
    const url = route.request().url();
    manifestHits.push(url);
    if (broken.has(url)) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({
      status: 200,
      contentType: 'application/vnd.apple.mpegurl',
      headers: { 'access-control-allow-origin': '*' },
      body: FIXTURE_PLAYLIST,
    });
  });

  await page.route(`${FIXTURE_HOST}/**`, route => {
    const file = new URL(route.request().url()).pathname.slice(1);
    return route.fulfill({
      status: 200,
      contentType: 'video/mp4',
      headers: { 'access-control-allow-origin': '*' },
      body: readFileSync(join(FIXTURE_DIR, file)),
    });
  });

  await page.route('https://basemaps.cartocdn.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_MAP_STYLE }),
  );

  return { manifestHits };
}

async function openIptvTab(page: Page) {
  await page.goto('/');
  const panel = page.locator('.panel[data-panel="live-webcams"]');
  await panel.waitFor({ state: 'attached', timeout: 60000 });
  await panel.scrollIntoViewIfNeeded();
  await panel.locator('.webcam-tab-btn[data-tab="iptv"]').click();
  return panel;
}

async function waitForPlayback(page: Page, channelId: string) {
  const selector = `.panel[data-panel="live-webcams"] video.iptv-video[data-channel-id="${channelId}"]`;
  await page.waitForFunction(sel => {
    const v = document.querySelector<HTMLVideoElement>(sel);
    return !!v && v.readyState >= 2 && v.currentTime > 0.2 && !v.error;
  }, selector, { timeout: 30000 });
}

test.describe('IPTV panel', () => {
  test('channel config is well-formed', () => {
    const ids = IPTV_CHANNELS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of IPTV_CHANNELS) {
      expect(c.url, c.id).toMatch(/^https:\/\//);
      expect(c.url, c.id).not.toContain('youtube.com');
      expect(Math.abs(c.coords[0]), c.id).toBeLessThanOrEqual(90);
      expect(Math.abs(c.coords[1]), c.id).toBeLessThanOrEqual(180);
      expect(c.countryCode, c.id).toMatch(/^[A-Z]{2}$/);
    }
    for (const region of IPTV_REGIONS) {
      expect(IPTV_CHANNELS.some(c => c.region === region), `region ${region} has channels`).toBe(true);
    }
  });

  test('surveillance tab still renders YouTube webcams by default', async ({ page }) => {
    await routeStreams(page);
    await page.goto('/');
    const panel = page.locator('.panel[data-panel="live-webcams"]');
    await panel.waitFor({ state: 'attached', timeout: 60000 });
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator('.webcam-tab-btn[data-tab="surveillance"]')).toHaveClass(/active/);
    await expect(panel.locator('.webcam-grid .webcam-cell')).toHaveCount(4);
    await expect(panel.locator('iframe.webcam-iframe').first()).toHaveAttribute('src', /youtube/);
  });

  test('grid view plays four HLS channels and cleans up on tab switch', async ({ page }) => {
    const { manifestHits } = await routeStreams(page);
    const pageErrors: string[] = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    const panel = await openIptvTab(page);
    const expected = IPTV_CHANNELS.filter(c => c.region === 'news').slice(0, 4);

    await expect(panel.locator('.iptv-grid .iptv-cell')).toHaveCount(4);
    await expect(panel.locator('video.iptv-video')).toHaveCount(4);
    for (const c of expected) await waitForPlayback(page, c.id);
    expect(new Set(manifestHits)).toEqual(new Set(expected.map(c => c.url)));

    await panel.locator('.webcam-tab-btn[data-tab="surveillance"]').click();
    await expect(panel.locator('video.iptv-video')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('single view, channel switching and region filter', async ({ page }) => {
    await routeStreams(page);
    const panel = await openIptvTab(page);

    await panel.locator('.webcam-view-btn[data-mode="single"]').click();
    await expect(panel.locator('video.iptv-video')).toHaveCount(1);
    await waitForPlayback(page, IPTV_CHANNELS[0]!.id);

    const europe = IPTV_CHANNELS.filter(c => c.region === 'europe');
    await panel.locator('.webcam-region-btn[data-region="europe"]').click();
    await expect(panel.locator('.webcam-switcher .webcam-feed-btn:not(.webcam-back-btn)')).toHaveCount(europe.length);
    await expect(panel.locator('.iptv-channel-name')).toHaveText(europe[0]!.name);

    const target = europe[3]!;
    await panel.locator('.webcam-switcher .webcam-feed-btn', { hasText: target.name }).click();
    await expect(panel.locator('.iptv-channel-name')).toHaveText(target.name);
    await expect(panel.locator('video.iptv-video')).toHaveCount(1);
    await waitForPlayback(page, target.id);
  });

  test('broken stream shows fallback overlay with retry', async ({ page }) => {
    await routeStreams(page, { broken: [BROKEN_CHANNEL_URL] });
    const panel = await openIptvTab(page);

    const cell = panel.locator('.iptv-cell', { has: page.locator(`video[data-channel-id="${BROKEN_CHANNEL_ID}"]`) });
    await expect(cell.locator('.webcam-embed-fallback')).toBeVisible({ timeout: 30000 });
    await expect(cell.locator('.webcam-embed-fallback')).toHaveCount(1);
    await expect(cell.locator('.webcam-embed-open')).toHaveAttribute('href', BROKEN_CHANNEL_URL);

    // Other channels keep playing.
    await waitForPlayback(page, 'al-jazeera-en');
  });

  test('map view shows channel markers and opens a channel', async ({ page }) => {
    await routeStreams(page);
    const panel = await openIptvTab(page);
    await panel.locator('.webcam-region-btn[data-region="all"]').click();
    await panel.locator('.webcam-view-btn[data-mode="map"]').click();

    await expect(panel.locator('.webcam-map-container .maplibregl-canvas')).toBeVisible({ timeout: 30000 });
    const markers = panel.locator('.webcam-map-marker--iptv');
    await expect(markers.first()).toBeVisible();

    const markerIds = await markers.evaluateAll(els => els.flatMap(el => (el as HTMLElement).dataset.channelIds!.split(',')));
    expect(markerIds.sort()).toEqual(IPTV_CHANNELS.map(c => c.id).sort());

    // A clustered marker opens the channel picker; picking one switches to single view.
    // At world zoom neighbouring European markers overlap, so pick a cluster nothing covers.
    const clusterIds = await panel.locator('.webcam-map-marker--iptv:has(.webcam-map-marker-cluster)').evaluateAll(els =>
      els.filter(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      }).map(el => (el as HTMLElement).dataset.channelIds!),
    );
    expect(clusterIds.length).toBeGreaterThan(0);
    const cluster = panel.locator(`.webcam-map-marker--iptv[data-channel-ids="${clusterIds[0]}"]`);
    const ids = clusterIds[0]!.split(',');
    await cluster.click();
    await expect(panel.locator('.webcam-map-popup-item')).toHaveCount(ids.length);
    await panel.locator('.webcam-map-popup-item').first().click();

    await expect(panel.locator('.webcam-view-btn[data-mode="single"]')).toHaveClass(/active/);
    await waitForPlayback(page, ids[0]!);
  });

  test('surveillance map view shows camera markers', async ({ page }) => {
    await routeStreams(page);
    await page.goto('/');
    const panel = page.locator('.panel[data-panel="live-webcams"]');
    await panel.waitFor({ state: 'attached', timeout: 60000 });
    await panel.scrollIntoViewIfNeeded();
    await panel.locator('.webcam-region-btn[data-region="all"]').click();
    await panel.locator('.webcam-view-btn[data-mode="map"]').click();
    await expect(panel.locator('.webcam-map-marker--cam').first()).toBeVisible({ timeout: 30000 });
    expect(await panel.locator('.webcam-map-marker--cam').count()).toBeGreaterThanOrEqual(15);

    await panel.locator('.webcam-map-marker--cam[data-feed-id="tokyo"]').click();
    await expect(panel.locator('.webcam-feed-btn.active')).toHaveText('Tokyo');
    await expect(panel.locator('iframe.webcam-iframe')).toHaveCount(1);
  });
});
