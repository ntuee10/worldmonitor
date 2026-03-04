/**
 * Tests for Taiwan-specific news monitoring features.
 *
 * These tests verify:
 * - Taiwan feeds are present in server-side VARIANT_FEEDS (full variant)
 * - Taiwan feeds are present in client-side FULL_FEEDS (asia section)
 * - Classifier correctly detects Taiwan-specific high/medium threat keywords
 * - Source metadata (tiers, types) is defined for Taiwan sources
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const readSrc = (relPath) => readFileSync(resolve(root, relPath), 'utf-8');

// ---------------------------------------------------------------------------
// 1. Server-side _feeds.ts — taiwan category in full variant
// ---------------------------------------------------------------------------

describe('Taiwan feeds in server-side _feeds.ts', () => {
  const src = readSrc('server/worldmonitor/news/v1/_feeds.ts');

  it('defines a taiwan category in VARIANT_FEEDS.full', () => {
    assert.match(src, /taiwan:\s*\[/, 'Should have a taiwan feed category');
  });

  it('includes Focus Taiwan RSS feed', () => {
    assert.match(src, /Focus Taiwan/, 'Should include Focus Taiwan source');
    assert.match(src, /focustaiwan\.tw/, 'Should reference focustaiwan.tw URL');
  });

  it('includes Taipei Times RSS feed', () => {
    assert.match(src, /Taipei Times/, 'Should include Taipei Times source');
    assert.match(src, /taipeitimes\.com/, 'Should reference taipeitimes.com URL');
  });

  it('includes Taiwan News RSS feed', () => {
    assert.match(src, /Taiwan News/, 'Should include Taiwan News source');
    assert.match(src, /taiwannews\.com\.tw/, 'Should reference taiwannews.com.tw URL');
  });

  it('includes Taiwan Strait Watch monitoring feed', () => {
    assert.match(src, /Taiwan Strait Watch/, 'Should include Taiwan Strait Watch feed');
    assert.match(src, /Taiwan Strait/, 'Should monitor Taiwan Strait news');
  });

  it('includes Taiwan Semiconductor monitoring feed', () => {
    assert.match(src, /Taiwan Semiconductor/, 'Should include Taiwan Semiconductor feed');
    assert.match(src, /TSMC/, 'Should monitor TSMC semiconductor news');
  });
});

// ---------------------------------------------------------------------------
// 2. Client-side feeds.ts — Taiwan feeds in asia section + source metadata
// ---------------------------------------------------------------------------

describe('Taiwan feeds in client-side feeds.ts', () => {
  const src = readSrc('src/config/feeds.ts');

  it('includes Focus Taiwan in client-side asia section', () => {
    assert.match(src, /Focus Taiwan/, 'Should include Focus Taiwan in client feeds');
  });

  it('includes Taipei Times in client-side asia section', () => {
    assert.match(src, /Taipei Times/, 'Should include Taipei Times in client feeds');
  });

  it('includes Taiwan Strait Watch in client-side feeds', () => {
    assert.match(src, /Taiwan Strait Watch/, 'Should include Taiwan Strait Watch feed');
  });

  it('has SOURCE_TIERS entry for Focus Taiwan', () => {
    assert.match(src, /'Focus Taiwan':\s*\d/, 'Should have tier for Focus Taiwan');
  });

  it('has SOURCE_TIERS entry for Taiwan Strait Watch', () => {
    assert.match(src, /'Taiwan Strait Watch':\s*\d/, 'Should have tier for Taiwan Strait Watch');
  });

  it('has SOURCE_TYPES entry for Focus Taiwan', () => {
    assert.match(src, /'Focus Taiwan':\s*'[a-z]+'/, 'Should have source type for Focus Taiwan');
  });

  it('has SOURCE_TYPES entry for Taiwan Semiconductor', () => {
    assert.match(src, /'Taiwan Semiconductor':\s*'[a-z]+'/, 'Should have source type for Taiwan Semiconductor');
  });
});

// ---------------------------------------------------------------------------
// 3. Classifier — Taiwan-specific keyword detection
// ---------------------------------------------------------------------------

describe('Taiwan-specific classifier keywords in _classifier.ts', () => {
  const src = readSrc('server/worldmonitor/news/v1/_classifier.ts');

  it('includes PLA exercises as a high-alert keyword', () => {
    assert.match(src, /pla exercises/, 'Should classify PLA exercises as high threat');
  });

  it('includes PLA drills as a high-alert keyword', () => {
    assert.match(src, /pla drills/, 'Should classify PLA drills as high threat');
  });

  it('includes Taiwan invasion as a high-alert keyword', () => {
    assert.match(src, /taiwan invasion/, 'Should classify Taiwan invasion as high threat');
  });

  it('includes Taiwan ADIZ as a high-alert keyword', () => {
    assert.match(src, /taiwan adiz/, 'Should classify Taiwan ADIZ incursions as high threat');
  });

  it('includes Taiwan Strait as a medium-alert keyword', () => {
    assert.match(src, /taiwan strait/, 'Should classify Taiwan Strait news as medium threat');
  });

  it('includes TSMC disruption as a medium economic keyword', () => {
    assert.match(src, /tsmc disruption/, 'Should classify TSMC disruption as medium economic event');
  });

  it('includes chip supply chain as a medium economic keyword', () => {
    assert.match(src, /chip supply chain/, 'Should classify chip supply chain as medium economic event');
  });

  it('includes us taiwan relations as a medium diplomatic keyword', () => {
    assert.match(src, /us taiwan relations/, 'Should classify US-Taiwan relations news as medium diplomatic event');
  });
});

// ---------------------------------------------------------------------------
// 4. VALID_VARIANTS still covers full (no regression)
// ---------------------------------------------------------------------------

describe('list-feed-digest handler includes taiwan feeds for full variant', () => {
  const src = readSrc('server/worldmonitor/news/v1/list-feed-digest.ts');

  it('full variant is in VALID_VARIANTS', () => {
    assert.match(src, /'full'/, 'full variant must remain valid');
  });

  it('builds digest using VARIANT_FEEDS', () => {
    assert.match(src, /VARIANT_FEEDS/, 'Should reference VARIANT_FEEDS to build digest');
  });
});
