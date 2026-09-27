import { Panel } from './Panel';
import { IDLE_PAUSE_MS } from '@/config';
import { isDesktopRuntime, getLocalApiPort } from '@/services/runtime';
import { escapeHtml } from '@/utils/sanitize';
import { t } from '../services/i18n';
import { trackWebcamSelected, trackWebcamRegionFiltered } from '@/services/analytics';
import { getStreamQuality, subscribeStreamQualityChange } from '@/services/ai-flow-settings';
import { isMobileDevice } from '@/utils';
import { getLiveStreamsAlwaysOn, subscribeLiveStreamsSettingsChange } from '@/services/live-stream-settings';
import { IPTV_CHANNELS, IPTV_REGIONS, IPTV_REGION_LABELS, type IptvChannel, type IptvRegion } from '@/config/iptv-channels';

// ---------------------------------------------------------------------------
// Surveillance camera types & data (unchanged from original)
// ---------------------------------------------------------------------------
type WebcamRegion = 'iran' | 'middle-east' | 'europe' | 'asia' | 'americas';

interface WebcamFeed {
  id: string;
  city: string;
  country: string;
  region: WebcamRegion;
  channelHandle: string;
  fallbackVideoId: string;
  /** Approximate coordinates [lat, lng] for map view */
  coords?: [number, number];
}

const WEBCAM_FEEDS: WebcamFeed[] = [
  { id: 'iran-tehran', city: 'Tehran', country: 'Iran', region: 'iran', channelHandle: '@IranHDCams', fallbackVideoId: '-zGuR1qVKrU', coords: [35.69, 51.39] },
  { id: 'iran-telaviv', city: 'Tel Aviv', country: 'Israel', region: 'iran', channelHandle: '@IsraelLiveCam', fallbackVideoId: 'gmtlJ_m2r5A', coords: [32.07, 34.79] },
  { id: 'iran-jerusalem', city: 'Jerusalem', country: 'Israel', region: 'iran', channelHandle: '@JerusalemLive', fallbackVideoId: 'fIurYTprwzg', coords: [31.77, 35.23] },
  { id: 'iran-multicam', city: 'Middle East', country: 'Multi', region: 'iran', channelHandle: '@MiddleEastCams', fallbackVideoId: '4E-iFtUM2kk', coords: [30.0, 40.0] },
  { id: 'jerusalem', city: 'Jerusalem', country: 'Israel', region: 'middle-east', channelHandle: '@TheWesternWall', fallbackVideoId: 'UyduhBUpO7Q', coords: [31.78, 35.23] },
  { id: 'tehran', city: 'Tehran', country: 'Iran', region: 'middle-east', channelHandle: '@IranHDCams', fallbackVideoId: '-zGuR1qVKrU', coords: [35.69, 51.39] },
  { id: 'tel-aviv', city: 'Tel Aviv', country: 'Israel', region: 'middle-east', channelHandle: '@IsraelLiveCam', fallbackVideoId: 'gmtlJ_m2r5A', coords: [32.07, 34.79] },
  { id: 'mecca', city: 'Mecca', country: 'Saudi Arabia', region: 'middle-east', channelHandle: '@MakkahLive', fallbackVideoId: 'Cm1v4bteXbI', coords: [21.42, 39.83] },
  { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', region: 'europe', channelHandle: '@DWNews', fallbackVideoId: '-Q7FuPINDjA', coords: [50.45, 30.52] },
  { id: 'odessa', city: 'Odessa', country: 'Ukraine', region: 'europe', channelHandle: '@UkraineLiveCam', fallbackVideoId: 'e2gC37ILQmk', coords: [46.48, 30.73] },
  { id: 'paris', city: 'Paris', country: 'France', region: 'europe', channelHandle: '@PalaisIena', fallbackVideoId: 'OzYp4NRZlwQ', coords: [48.86, 2.35] },
  { id: 'st-petersburg', city: 'St. Petersburg', country: 'Russia', region: 'europe', channelHandle: '@SPBLiveCam', fallbackVideoId: 'CjtIYbmVfck', coords: [59.93, 30.32] },
  { id: 'london', city: 'London', country: 'UK', region: 'europe', channelHandle: '@EarthCam', fallbackVideoId: 'Lxqcg1qt0XU', coords: [51.51, -0.13] },
  { id: 'washington', city: 'Washington DC', country: 'USA', region: 'americas', channelHandle: '@AxisCommunications', fallbackVideoId: '1wV9lLe14aU', coords: [38.90, -77.04] },
  { id: 'new-york', city: 'New York', country: 'USA', region: 'americas', channelHandle: '@EarthCam', fallbackVideoId: '4qyZLflp-sI', coords: [40.76, -73.98] },
  { id: 'los-angeles', city: 'Los Angeles', country: 'USA', region: 'americas', channelHandle: '@VeniceVHotel', fallbackVideoId: 'EO_1LWqsCNE', coords: [34.02, -118.50] },
  { id: 'miami', city: 'Miami', country: 'USA', region: 'americas', channelHandle: '@FloridaLiveCams', fallbackVideoId: '5YCajRjvWCg', coords: [25.76, -80.19] },
  { id: 'taipei', city: 'Taipei', country: 'Taiwan', region: 'asia', channelHandle: '@JackyWuTaipei', fallbackVideoId: 'z_fY1pj1VBw', coords: [25.03, 121.57] },
  { id: 'shanghai', city: 'Shanghai', country: 'China', region: 'asia', channelHandle: '@SkylineWebcams', fallbackVideoId: '76EwqI5XZIc', coords: [31.23, 121.47] },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', region: 'asia', channelHandle: '@TokyoLiveCam4K', fallbackVideoId: '4pu9sF5Qssw', coords: [35.68, 139.69] },
  { id: 'seoul', city: 'Seoul', country: 'South Korea', region: 'asia', channelHandle: '@UNvillage_live', fallbackVideoId: '-JhoMGoAfFc', coords: [37.57, 126.98] },
  { id: 'sydney', city: 'Sydney', country: 'Australia', region: 'asia', channelHandle: '@WebcamSydney', fallbackVideoId: '7pcL-0Wo77U', coords: [-33.87, 151.21] },
];

const MAX_GRID_CELLS = 4;
const ECO_IDLE_PAUSE_MS = IDLE_PAUSE_MS;
const IDLE_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;

type SourceTab = 'surveillance' | 'iptv';
type ViewMode = 'grid' | 'single' | 'map';
type RegionFilter = 'all' | WebcamRegion;
type IptvRegionFilter = 'all' | IptvRegion;

interface WebcamIframeTracker {
  feed: WebcamFeed;
  container: HTMLElement;
  timeout: ReturnType<typeof setTimeout> | null;
  blocked: boolean;
}

// SVG icon constants
const ICON_FULLSCREEN_ENTER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
const ICON_FULLSCREEN_EXIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>';
const ICON_GRID = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>';
const ICON_SINGLE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="14" rx="2"/><rect x="3" y="19" width="18" height="2" rx="1"/></svg>';
const ICON_MAP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>';
const ICON_EXPAND = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

export class LiveWebcamsPanel extends Panel {
  // Source tab
  private sourceTab: SourceTab = 'surveillance';

  // Surveillance camera state
  private viewMode: ViewMode = 'grid';
  private regionFilter: RegionFilter = 'iran';
  private activeFeed: WebcamFeed = WEBCAM_FEEDS[0]!;
  private iframes: HTMLIFrameElement[] = [];
  private iframeTrackers = new Map<HTMLIFrameElement, WebcamIframeTracker>();

  // IPTV state
  private iptvRegionFilter: IptvRegionFilter = 'news';
  private activeIptvChannel: IptvChannel = IPTV_CHANNELS[0]!;
  private hlsInstances: Array<{ destroy(): void }> = [];
  private videoElements: HTMLVideoElement[] = [];

  // Map state
  private mapContainer: HTMLElement | null = null;
  private mapInstance: import('maplibre-gl').Map | null = null;
  // Incremented on every render so async work (hls.js / maplibre import) started by a stale render bails out.
  private renderGeneration = 0;

  // Shared UI
  private tabBar: HTMLElement | null = null;
  private toolbar: HTMLElement | null = null;
  private observer: IntersectionObserver | null = null;
  private isVisible = false;

  // Stream lifecycle
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private boundIdleResetHandler!: () => void;
  private boundVisibilityHandler!: () => void;
  private idleDetectionEnabled = false;
  private isIdle = false;
  private alwaysOn = getLiveStreamsAlwaysOn();
  private unsubscribeStreamSettings: (() => void) | null = null;

  // UI
  private fullscreenBtn: HTMLButtonElement | null = null;
  private isFullscreen = false;
  private readonly forceSingleView = !isDesktopRuntime() && isMobileDevice();
  private readonly EMBED_READY_TIMEOUT_MS = 15000;
  private boundEmbedMessageHandler: (e: MessageEvent) => void;

  constructor() {
    super({ id: 'live-webcams', title: t('panels.liveWebcams'), className: 'panel-wide' });

    if (this.forceSingleView) {
      this.viewMode = 'single';
    }
    this.createFullscreenButton();
    this.createTabBar();
    this.createToolbar();
    this.setupIntersectionObserver();
    this.setupIdleDetection();
    subscribeStreamQualityChange(() => this.render());
    this.unsubscribeStreamSettings = subscribeLiveStreamsSettingsChange((alwaysOn) => {
      this.alwaysOn = alwaysOn;
      this.applyIdleMode();
    });
    this.boundEmbedMessageHandler = (e) => this.handleEmbedMessage(e);
    window.addEventListener('message', this.boundEmbedMessageHandler);
    this.render();
    document.addEventListener('keydown', this.boundFullscreenEscHandler);
  }

  // ---------------------------------------------------------------------------
  // Tab bar (Surveillance / IPTV)
  // ---------------------------------------------------------------------------
  private createTabBar(): void {
    this.tabBar = document.createElement('div');
    this.tabBar.className = 'webcam-tab-bar';

    const tabs: { key: SourceTab; label: string; icon: string }[] = [
      { key: 'surveillance', label: 'Surveillance', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
      { key: 'iptv', label: 'IPTV', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>' },
    ];

    tabs.forEach(({ key, label, icon }) => {
      const btn = document.createElement('button');
      btn.className = `webcam-tab-btn${key === this.sourceTab ? ' active' : ''}`;
      btn.dataset.tab = key;
      btn.innerHTML = `${icon}<span>${escapeHtml(label)}</span>`;
      btn.addEventListener('click', () => this.setSourceTab(key));
      this.tabBar!.appendChild(btn);
    });

    this.element.insertBefore(this.tabBar, this.content);
  }

  private setSourceTab(tab: SourceTab): void {
    if (tab === this.sourceTab) return;
    this.sourceTab = tab;
    this.tabBar?.querySelectorAll('.webcam-tab-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.tab === tab);
    });
    // Reset view mode to non-map when switching tabs
    if (this.viewMode === 'map') this.viewMode = 'grid';
    this.rebuildToolbar();
    this.render();
  }

  // ---------------------------------------------------------------------------
  // Fullscreen
  // ---------------------------------------------------------------------------
  private createFullscreenButton(): void {
    this.fullscreenBtn = document.createElement('button');
    this.fullscreenBtn.className = 'live-mute-btn';
    this.fullscreenBtn.title = 'Fullscreen';
    this.fullscreenBtn.innerHTML = ICON_FULLSCREEN_ENTER;
    this.fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });
    const header = this.element.querySelector('.panel-header');
    header?.appendChild(this.fullscreenBtn);
  }

  private toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.element.classList.toggle('live-news-fullscreen', this.isFullscreen);
    document.body.classList.toggle('live-news-fullscreen-active', this.isFullscreen);
    if (this.fullscreenBtn) {
      this.fullscreenBtn.title = this.isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
      this.fullscreenBtn.innerHTML = this.isFullscreen ? ICON_FULLSCREEN_EXIT : ICON_FULLSCREEN_ENTER;
    }
    // Re-render map if in map view to fix sizing
    if (this.viewMode === 'map' && this.mapInstance) {
      setTimeout(() => this.mapInstance?.resize(), 100);
    }
  }

  private boundFullscreenEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isFullscreen) this.toggleFullscreen();
  };

  // ---------------------------------------------------------------------------
  // Toolbar (region filters + view mode buttons)
  // ---------------------------------------------------------------------------
  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'webcam-toolbar';
    this.buildToolbarContent();
    this.element.insertBefore(this.toolbar, this.content);
  }

  private rebuildToolbar(): void {
    if (!this.toolbar) return;
    this.toolbar.innerHTML = '';
    this.buildToolbarContent();
  }

  private buildToolbarContent(): void {
    if (!this.toolbar) return;

    const regionGroup = document.createElement('div');
    regionGroup.className = 'webcam-toolbar-group';

    if (this.sourceTab === 'surveillance') {
      const regions: { key: RegionFilter; label: string }[] = [
        { key: 'iran', label: t('components.webcams.regions.iran') },
        { key: 'all', label: t('components.webcams.regions.all') },
        { key: 'middle-east', label: t('components.webcams.regions.mideast') },
        { key: 'europe', label: t('components.webcams.regions.europe') },
        { key: 'americas', label: t('components.webcams.regions.americas') },
        { key: 'asia', label: t('components.webcams.regions.asia') },
      ];

      regions.forEach(({ key, label }) => {
        const btn = document.createElement('button');
        btn.className = `webcam-region-btn${key === this.regionFilter ? ' active' : ''}`;
        btn.dataset.region = key;
        btn.textContent = label;
        btn.addEventListener('click', () => this.setRegionFilter(key));
        regionGroup.appendChild(btn);
      });
    } else {
      // IPTV region filters
      const allRegions: { key: IptvRegionFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        ...IPTV_REGIONS.map(r => ({ key: r as IptvRegionFilter, label: IPTV_REGION_LABELS[r] })),
      ];

      allRegions.forEach(({ key, label }) => {
        const btn = document.createElement('button');
        btn.className = `webcam-region-btn${key === this.iptvRegionFilter ? ' active' : ''}`;
        btn.dataset.region = key;
        btn.textContent = label;
        btn.addEventListener('click', () => this.setIptvRegionFilter(key));
        regionGroup.appendChild(btn);
      });
    }

    const viewGroup = document.createElement('div');
    viewGroup.className = 'webcam-toolbar-group';

    // Grid button
    const gridBtn = document.createElement('button');
    gridBtn.className = `webcam-view-btn${this.viewMode === 'grid' ? ' active' : ''}`;
    gridBtn.dataset.mode = 'grid';
    gridBtn.innerHTML = ICON_GRID;
    gridBtn.title = 'Grid view';
    gridBtn.addEventListener('click', () => this.setViewMode('grid'));
    if (this.forceSingleView) { gridBtn.disabled = true; gridBtn.style.display = 'none'; }

    // Single button
    const singleBtn = document.createElement('button');
    singleBtn.className = `webcam-view-btn${this.viewMode === 'single' ? ' active' : ''}`;
    singleBtn.dataset.mode = 'single';
    singleBtn.innerHTML = ICON_SINGLE;
    singleBtn.title = 'Single view';
    singleBtn.addEventListener('click', () => this.setViewMode('single'));

    // Map button
    const mapBtn = document.createElement('button');
    mapBtn.className = `webcam-view-btn${this.viewMode === 'map' ? ' active' : ''}`;
    mapBtn.dataset.mode = 'map';
    mapBtn.innerHTML = ICON_MAP;
    mapBtn.title = 'Map view';
    mapBtn.addEventListener('click', () => this.setViewMode('map'));

    viewGroup.appendChild(gridBtn);
    viewGroup.appendChild(singleBtn);
    viewGroup.appendChild(mapBtn);

    this.toolbar.appendChild(regionGroup);
    this.toolbar.appendChild(viewGroup);
  }

  // ---------------------------------------------------------------------------
  // Surveillance camera filters / view switching
  // ---------------------------------------------------------------------------
  private get filteredFeeds(): WebcamFeed[] {
    if (this.regionFilter === 'all') return WEBCAM_FEEDS;
    return WEBCAM_FEEDS.filter(f => f.region === this.regionFilter);
  }

  private static readonly ALL_GRID_IDS = ['jerusalem', 'tehran', 'kyiv', 'washington'];

  private get gridFeeds(): WebcamFeed[] {
    if (this.regionFilter === 'all') {
      return LiveWebcamsPanel.ALL_GRID_IDS
        .map(id => WEBCAM_FEEDS.find(f => f.id === id)!)
        .filter(Boolean);
    }
    return this.filteredFeeds.slice(0, MAX_GRID_CELLS);
  }

  private setRegionFilter(filter: RegionFilter): void {
    if (filter === this.regionFilter) return;
    trackWebcamRegionFiltered(filter);
    this.regionFilter = filter;
    this.toolbar?.querySelectorAll('.webcam-region-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.region === filter);
    });
    const feeds = this.filteredFeeds;
    if (feeds.length > 0 && !feeds.includes(this.activeFeed)) {
      this.activeFeed = feeds[0]!;
    }
    this.render();
  }

  private setViewMode(mode: ViewMode): void {
    if (this.forceSingleView && mode === 'grid') return;
    if (mode === this.viewMode) return;
    this.viewMode = mode;
    this.toolbar?.querySelectorAll('.webcam-view-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
    });
    this.render();
  }

  // ---------------------------------------------------------------------------
  // IPTV region filter
  // ---------------------------------------------------------------------------
  private get filteredIptvChannels(): IptvChannel[] {
    if (this.iptvRegionFilter === 'all') return IPTV_CHANNELS;
    return IPTV_CHANNELS.filter(c => c.region === this.iptvRegionFilter);
  }

  private setIptvRegionFilter(filter: IptvRegionFilter): void {
    if (filter === this.iptvRegionFilter) return;
    this.iptvRegionFilter = filter;
    this.toolbar?.querySelectorAll('.webcam-region-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.region === filter);
    });
    const channels = this.filteredIptvChannels;
    if (channels.length > 0 && !channels.includes(this.activeIptvChannel)) {
      this.activeIptvChannel = channels[0]!;
    }
    this.render();
  }

  // ---------------------------------------------------------------------------
  // YouTube embed URL builder (surveillance cameras)
  // ---------------------------------------------------------------------------
  private buildEmbedUrl(videoId: string): string {
    const quality = getStreamQuality();
    if (isDesktopRuntime()) {
      const params = new URLSearchParams({ videoId, autoplay: '1', mute: '1' });
      if (quality !== 'auto') params.set('vq', quality);
      return `http://localhost:${getLocalApiPort()}/api/youtube-embed?${params.toString()}`;
    }
    const vq = quality !== 'auto' ? `&vq=${quality}` : '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0${vq}`;
  }

  private createIframe(feed: WebcamFeed): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.className = 'webcam-iframe';
    iframe.src = this.buildEmbedUrl(feed.fallbackVideoId);
    iframe.title = `${feed.city} live webcam`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    if (!isDesktopRuntime()) {
      iframe.allowFullscreen = true;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    }
    return iframe;
  }

  // ---------------------------------------------------------------------------
  // HLS playback for IPTV
  // ---------------------------------------------------------------------------
  private async playIptvStream(channel: IptvChannel, container: HTMLElement): Promise<void> {
    const generation = this.renderGeneration;
    const video = document.createElement('video');
    video.className = 'iptv-video';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = true;
    video.dataset.channelId = channel.id;
    this.videoElements.push(video);
    container.insertBefore(video, container.firstChild);

    // Native HLS (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.addEventListener('error', () => this.renderIptvError(container, channel), { once: true });
      video.src = channel.url;
      video.play().catch(() => { /* autoplay blocked */ });
      return;
    }

    try {
      const Hls = (await import('hls.js')).default;
      if (generation !== this.renderGeneration || !video.isConnected) return;
      if (!Hls.isSupported()) {
        this.renderIptvError(container, channel);
        return;
      }
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      this.hlsInstances.push(hls);
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { /* autoplay blocked */ });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy();
          this.renderIptvError(container, channel);
        }
      });
    } catch {
      this.renderIptvError(container, channel);
    }
  }

  private renderIptvError(container: HTMLElement, channel: IptvChannel): void {
    if (!container.isConnected || container.querySelector('.webcam-embed-fallback')) return;
    const overlay = document.createElement('div');
    overlay.className = 'webcam-embed-fallback';

    const msg = document.createElement('div');
    msg.className = 'webcam-embed-fallback-text';
    msg.textContent = `Failed to load ${channel.name}. The stream may be geo-restricted or offline.`;

    const actions = document.createElement('div');
    actions.className = 'webcam-embed-fallback-actions';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'offline-retry webcam-embed-retry';
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.render();
    });

    const openBtn = document.createElement('a');
    openBtn.className = 'offline-retry webcam-embed-open';
    openBtn.href = channel.url;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.textContent = 'Open stream';
    openBtn.addEventListener('click', (e) => e.stopPropagation());

    actions.append(retryBtn, openBtn);
    overlay.append(msg, actions);
    container.appendChild(overlay);
  }

  private destroyHls(): void {
    this.hlsInstances.forEach(hls => hls.destroy());
    this.hlsInstances = [];
    this.videoElements.forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    });
    this.videoElements = [];
  }

  // ---------------------------------------------------------------------------
  // Iframe tracking (surveillance cameras)
  // ---------------------------------------------------------------------------
  private findIframeBySource(source: MessageEventSource | null): HTMLIFrameElement | null {
    if (!source || !(source instanceof Window)) return null;
    for (const iframe of this.iframes) {
      if (iframe.contentWindow === source) return iframe;
    }
    return null;
  }

  private clearIframeTimeout(iframe: HTMLIFrameElement): void {
    const tracker = this.iframeTrackers.get(iframe);
    if (!tracker?.timeout) return;
    clearTimeout(tracker.timeout);
    tracker.timeout = null;
  }

  private markIframeBlocked(iframe: HTMLIFrameElement): void {
    const tracker = this.iframeTrackers.get(iframe);
    if (!tracker || tracker.blocked) return;
    tracker.blocked = true;
    this.clearIframeTimeout(iframe);
    this.renderBlockedOverlay(iframe, tracker.feed, tracker.container);
  }

  private markIframeReady(iframe: HTMLIFrameElement): void {
    const tracker = this.iframeTrackers.get(iframe);
    if (!tracker) return;
    tracker.blocked = false;
    this.clearIframeTimeout(iframe);
    tracker.container.querySelector('.webcam-embed-fallback')?.remove();
  }

  private trackIframe(iframe: HTMLIFrameElement, feed: WebcamFeed, container: HTMLElement): void {
    const tracker: WebcamIframeTracker = { feed, container, timeout: null, blocked: false };
    this.iframeTrackers.set(iframe, tracker);
    if (isDesktopRuntime()) {
      tracker.timeout = setTimeout(() => this.markIframeBlocked(iframe), this.EMBED_READY_TIMEOUT_MS);
    }
  }

  private retryIframe(oldIframe: HTMLIFrameElement): void {
    const tracker = this.iframeTrackers.get(oldIframe);
    if (!tracker) return;
    const freshIframe = this.createIframe(tracker.feed);
    oldIframe.replaceWith(freshIframe);
    oldIframe.src = 'about:blank';
    const idx = this.iframes.indexOf(oldIframe);
    if (idx >= 0) this.iframes[idx] = freshIframe;
    this.clearIframeTimeout(oldIframe);
    this.iframeTrackers.delete(oldIframe);
    this.trackIframe(freshIframe, tracker.feed, tracker.container);
    tracker.container.querySelector('.webcam-embed-fallback')?.remove();
  }

  private renderBlockedOverlay(iframe: HTMLIFrameElement, feed: WebcamFeed, container: HTMLElement): void {
    container.querySelector('.webcam-embed-fallback')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'webcam-embed-fallback';
    overlay.addEventListener('click', (e) => e.stopPropagation());

    const message = document.createElement('div');
    message.className = 'webcam-embed-fallback-text';
    message.textContent = 'This stream is blocked or failed to load.';

    const actions = document.createElement('div');
    actions.className = 'webcam-embed-fallback-actions';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'offline-retry webcam-embed-retry';
    retryBtn.textContent = t('common.retry') || 'Retry';
    retryBtn.addEventListener('click', (e) => { e.stopPropagation(); this.retryIframe(iframe); });

    const openBtn = document.createElement('a');
    openBtn.className = 'offline-retry webcam-embed-open';
    openBtn.href = `https://www.youtube.com/watch?v=${encodeURIComponent(feed.fallbackVideoId)}`;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.textContent = t('components.liveNews.openOnYouTube') || 'Open on YouTube';
    openBtn.addEventListener('click', (e) => e.stopPropagation());

    actions.append(retryBtn, openBtn);
    overlay.append(message, actions);
    container.appendChild(overlay);
  }

  private handleEmbedMessage(e: MessageEvent): void {
    if (!isDesktopRuntime()) return;
    const iframe = this.findIframeBySource(e.source);
    if (!iframe) return;
    const msg = e.data as { type?: string; state?: number; code?: number } | null;
    if (!msg?.type) return;
    if (msg.type === 'yt-ready') { this.markIframeReady(iframe); return; }
    if (msg.type === 'yt-state' && (msg.state === 1 || msg.state === 3)) { this.markIframeReady(iframe); return; }
    if (msg.type === 'yt-error') this.markIframeBlocked(iframe);
  }

  // ---------------------------------------------------------------------------
  // Map view
  // ---------------------------------------------------------------------------
  private async renderMapView(): Promise<void> {
    const generation = this.renderGeneration;
    this.content.innerHTML = '';
    this.content.className = 'panel-content webcam-content';

    this.mapContainer = document.createElement('div');
    this.mapContainer.className = 'webcam-map-container';
    this.content.appendChild(this.mapContainer);

    const container = this.mapContainer;
    try {
      const maplibregl = (await import('maplibre-gl')).default;
      if (generation !== this.renderGeneration || !container.isConnected) return;

      this.mapInstance = new maplibregl.Map({
        container,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [20, 20],
        zoom: 1.5,
        attributionControl: false,
      });

      this.mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      // Markers are DOM overlays and don't need the basemap style, so add them right away —
      // the map still shows channel locations if the tile CDN is slow or unreachable.
      this.addMapMarkers(maplibregl);
    } catch {
      container.innerHTML = '<div class="webcam-placeholder">Failed to load map</div>';
    }
  }

  private addMapMarkers(maplibregl: typeof import('maplibre-gl')): void {
    const map = this.mapInstance;
    if (!map) return;
    const bounds = new maplibregl.LngLatBounds();

    if (this.sourceTab === 'surveillance') {
      // Add surveillance camera markers
      const feeds = this.regionFilter === 'all' ? WEBCAM_FEEDS : WEBCAM_FEEDS.filter(f => f.region === this.regionFilter);
      // Deduplicate by id (some share coords between regions)
      const seen = new Set<string>();
      feeds.forEach(feed => {
        if (!feed.coords || seen.has(feed.id)) return;
        seen.add(feed.id);

        const el = document.createElement('div');
        el.className = 'webcam-map-marker webcam-map-marker--cam';
        el.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="fill:var(--red)" stroke="#fff" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
        el.title = `${feed.city}, ${feed.country}`;
        el.dataset.feedId = feed.id;

        el.addEventListener('click', () => {
          this.activeFeed = feed;
          this.setViewMode('single');
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([feed.coords[1], feed.coords[0]])
          .addTo(map);
        bounds.extend([feed.coords[1], feed.coords[0]]);
      });
    } else {
      // Add IPTV channel markers
      const channels = this.iptvRegionFilter === 'all' ? IPTV_CHANNELS : IPTV_CHANNELS.filter(c => c.region === this.iptvRegionFilter);
      // One marker per country, placed at its first channel's coordinates
      const byCountry = new Map<string, IptvChannel[]>();
      channels.forEach(ch => {
        if (!byCountry.has(ch.countryCode)) byCountry.set(ch.countryCode, []);
        byCountry.get(ch.countryCode)!.push(ch);
      });

      byCountry.forEach((group) => {
        const first = group[0]!;
        const el = document.createElement('div');
        el.className = 'webcam-map-marker webcam-map-marker--iptv';
        el.dataset.channelIds = group.map(c => c.id).join(',');

        const count = group.length;
        if (count > 1) {
          el.innerHTML = `<div class="webcam-map-marker-cluster">${count}</div>`;
          el.title = group.map(c => c.name).join(', ');
        } else {
          el.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#4fc3f7" stroke="#fff" stroke-width="1.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>';
          el.title = first.name;
        }

        el.addEventListener('click', () => {
          if (count === 1) {
            this.activeIptvChannel = first;
            this.setViewMode('single');
          } else {
            // Show popup with channel list
            this.showMapChannelPopup(group);
          }
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([first.coords[1], first.coords[0]])
          .addTo(map);
        bounds.extend([first.coords[1], first.coords[0]]);
      });
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 4, duration: 0 });
    }
  }

  private showMapChannelPopup(channels: IptvChannel[]): void {
    // Remove any existing popup
    this.content.querySelector('.webcam-map-popup')?.remove();

    const popup = document.createElement('div');
    popup.className = 'webcam-map-popup';

    const header = document.createElement('div');
    header.className = 'webcam-map-popup-header';
    header.textContent = `${channels[0]!.country} (${channels.length} channels)`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'webcam-map-popup-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => popup.remove());
    header.appendChild(closeBtn);

    const list = document.createElement('div');
    list.className = 'webcam-map-popup-list';

    channels.forEach(ch => {
      const item = document.createElement('button');
      item.className = 'webcam-map-popup-item';
      item.innerHTML = `<span class="webcam-live-dot"></span><span>${escapeHtml(ch.name)}</span><span class="webcam-map-popup-lang">${escapeHtml(ch.language.toUpperCase())}</span>`;
      item.addEventListener('click', () => {
        this.activeIptvChannel = ch;
        popup.remove();
        this.setViewMode('single');
      });
      list.appendChild(item);
    });

    popup.append(header, list);
    this.content.appendChild(popup);
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this.mapContainer = null;
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  private render(): void {
    this.renderGeneration++;
    this.destroyIframes();
    this.destroyHls();
    this.destroyMap();

    if (!this.isVisible || this.isIdle) {
      this.content.innerHTML = `<div class="webcam-placeholder">${escapeHtml(t('components.webcams.paused'))}</div>`;
      return;
    }

    if (this.viewMode === 'map') {
      this.renderMapView();
      return;
    }

    if (this.sourceTab === 'surveillance') {
      if (this.viewMode === 'grid') {
        this.renderSurveillanceGrid();
      } else {
        this.renderSurveillanceSingle();
      }
    } else {
      if (this.viewMode === 'grid') {
        this.renderIptvGrid();
      } else {
        this.renderIptvSingle();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Surveillance camera rendering
  // ---------------------------------------------------------------------------
  private renderSurveillanceGrid(): void {
    if (this.forceSingleView) {
      this.viewMode = 'single';
      this.renderSurveillanceSingle();
      return;
    }

    this.content.innerHTML = '';
    this.content.className = 'panel-content webcam-content';

    const grid = document.createElement('div');
    grid.className = 'webcam-grid';

    const feeds = this.gridFeeds;
    const desktop = isDesktopRuntime();

    feeds.forEach((feed, i) => {
      const cell = document.createElement('div');
      cell.className = 'webcam-cell';

      const label = document.createElement('div');
      label.className = 'webcam-cell-label';
      label.innerHTML = `<span class="webcam-live-dot"></span><span class="webcam-city">${escapeHtml(feed.city.toUpperCase())}</span>`;

      if (desktop) {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'webcam-expand-btn';
        expandBtn.title = t('webcams.expand') || 'Expand';
        expandBtn.innerHTML = ICON_EXPAND;
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          trackWebcamSelected(feed.id, feed.city, 'grid');
          this.activeFeed = feed;
          this.setViewMode('single');
        });
        label.appendChild(expandBtn);
      } else {
        cell.addEventListener('click', () => {
          trackWebcamSelected(feed.id, feed.city, 'grid');
          this.activeFeed = feed;
          this.setViewMode('single');
        });
      }

      cell.appendChild(label);
      grid.appendChild(cell);

      if (desktop && i > 0) {
        setTimeout(() => {
          if (!this.isVisible || this.isIdle) return;
          const iframe = this.createIframe(feed);
          cell.insertBefore(iframe, label);
          this.iframes.push(iframe);
          this.trackIframe(iframe, feed, cell);
        }, i * 800);
      } else {
        const iframe = this.createIframe(feed);
        cell.insertBefore(iframe, label);
        this.iframes.push(iframe);
        this.trackIframe(iframe, feed, cell);
      }
    });

    this.content.appendChild(grid);
  }

  private renderSurveillanceSingle(): void {
    this.content.innerHTML = '';
    this.content.className = 'panel-content webcam-content';

    const wrapper = document.createElement('div');
    wrapper.className = 'webcam-single';

    const iframe = this.createIframe(this.activeFeed);
    wrapper.appendChild(iframe);
    this.iframes.push(iframe);
    this.trackIframe(iframe, this.activeFeed, wrapper);

    const switcher = document.createElement('div');
    switcher.className = 'webcam-switcher';

    if (!this.forceSingleView) {
      const backBtn = document.createElement('button');
      backBtn.className = 'webcam-feed-btn webcam-back-btn';
      backBtn.innerHTML = `${ICON_GRID} Grid`;
      backBtn.addEventListener('click', () => this.setViewMode('grid'));
      switcher.appendChild(backBtn);
    }

    this.filteredFeeds.forEach(feed => {
      const btn = document.createElement('button');
      btn.className = `webcam-feed-btn${feed.id === this.activeFeed.id ? ' active' : ''}`;
      btn.textContent = feed.city;
      btn.addEventListener('click', () => {
        trackWebcamSelected(feed.id, feed.city, 'single');
        this.activeFeed = feed;
        this.render();
      });
      switcher.appendChild(btn);
    });

    this.content.appendChild(wrapper);
    this.content.appendChild(switcher);
  }

  // ---------------------------------------------------------------------------
  // IPTV rendering
  // ---------------------------------------------------------------------------
  private renderIptvGrid(): void {
    if (this.forceSingleView) {
      this.viewMode = 'single';
      this.renderIptvSingle();
      return;
    }

    this.content.innerHTML = '';
    this.content.className = 'panel-content webcam-content';

    const grid = document.createElement('div');
    grid.className = 'webcam-grid iptv-grid';

    const channels = this.filteredIptvChannels.slice(0, MAX_GRID_CELLS);

    channels.forEach(channel => {
      const cell = document.createElement('div');
      cell.className = 'webcam-cell iptv-cell';

      const label = document.createElement('div');
      label.className = 'webcam-cell-label';
      label.innerHTML = `<span class="webcam-live-dot"></span><span class="webcam-city">${escapeHtml(channel.name.toUpperCase())}</span><span class="iptv-country-badge">${escapeHtml(channel.countryCode)}</span>`;

      cell.addEventListener('click', () => {
        this.activeIptvChannel = channel;
        this.setViewMode('single');
      });

      cell.appendChild(label);
      grid.appendChild(cell);

      // Start playing in the grid cell
      this.playIptvStream(channel, cell);
    });

    this.content.appendChild(grid);
  }

  private renderIptvSingle(): void {
    this.content.innerHTML = '';
    this.content.className = 'panel-content webcam-content';

    const wrapper = document.createElement('div');
    wrapper.className = 'webcam-single';

    // Channel info bar
    const info = document.createElement('div');
    info.className = 'iptv-channel-info';
    info.innerHTML = `<span class="webcam-live-dot"></span><span class="iptv-channel-name">${escapeHtml(this.activeIptvChannel.name)}</span><span class="iptv-country-badge">${escapeHtml(this.activeIptvChannel.country)}</span>`;
    wrapper.appendChild(info);

    this.playIptvStream(this.activeIptvChannel, wrapper);

    const switcher = document.createElement('div');
    switcher.className = 'webcam-switcher';

    if (!this.forceSingleView) {
      const backBtn = document.createElement('button');
      backBtn.className = 'webcam-feed-btn webcam-back-btn';
      backBtn.innerHTML = `${ICON_GRID} Grid`;
      backBtn.addEventListener('click', () => this.setViewMode('grid'));
      switcher.appendChild(backBtn);
    }

    this.filteredIptvChannels.forEach(channel => {
      const btn = document.createElement('button');
      btn.className = `webcam-feed-btn${channel.id === this.activeIptvChannel.id ? ' active' : ''}`;
      btn.innerHTML = `${escapeHtml(channel.name)}`;
      btn.title = `${channel.country} — ${channel.language.toUpperCase()}`;
      btn.addEventListener('click', () => {
        this.activeIptvChannel = channel;
        this.render();
      });
      switcher.appendChild(btn);
    });

    this.content.appendChild(wrapper);
    this.content.appendChild(switcher);
  }

  // ---------------------------------------------------------------------------
  // Iframe / stream cleanup
  // ---------------------------------------------------------------------------
  private destroyIframes(): void {
    this.iframeTrackers.forEach((tracker, iframe) => {
      if (tracker.timeout) clearTimeout(tracker.timeout);
      iframe.src = 'about:blank';
      iframe.remove();
    });
    this.iframeTrackers.clear();
    this.iframes.forEach(iframe => {
      if (iframe.isConnected) {
        iframe.src = 'about:blank';
        iframe.remove();
      }
    });
    this.iframes = [];
  }

  // ---------------------------------------------------------------------------
  // Intersection / idle / lifecycle
  // ---------------------------------------------------------------------------
  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const wasVisible = this.isVisible;
        this.isVisible = entries.some(e => e.isIntersecting);
        if (this.isVisible && !wasVisible && !this.isIdle) {
          this.render();
        } else if (!this.isVisible && wasVisible) {
          this.destroyIframes();
          this.destroyHls();
          this.destroyMap();
        }
      },
      { threshold: 0.1 }
    );
    this.observer.observe(this.element);
  }

  private applyIdleMode(): void {
    if (this.alwaysOn) {
      if (this.idleTimeout) { clearTimeout(this.idleTimeout); this.idleTimeout = null; }
      if (this.idleDetectionEnabled) {
        IDLE_ACTIVITY_EVENTS.forEach((event) => document.removeEventListener(event, this.boundIdleResetHandler));
        this.idleDetectionEnabled = false;
      }
      if (this.isIdle && !document.hidden) {
        this.isIdle = false;
        if (this.isVisible) this.render();
      }
      return;
    }
    if (!this.idleDetectionEnabled) {
      IDLE_ACTIVITY_EVENTS.forEach((event) => document.addEventListener(event, this.boundIdleResetHandler, { passive: true }));
      this.idleDetectionEnabled = true;
    }
    this.boundIdleResetHandler();
  }

  private setupIdleDetection(): void {
    this.boundVisibilityHandler = () => {
      if (document.hidden) {
        if (this.idleTimeout) clearTimeout(this.idleTimeout);
        return;
      }
      if (this.isIdle) {
        this.isIdle = false;
        if (this.isVisible) this.render();
      }
      this.applyIdleMode();
    };
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);

    this.boundIdleResetHandler = () => {
      if (this.alwaysOn) return;
      if (this.idleTimeout) clearTimeout(this.idleTimeout);
      if (this.isIdle) {
        this.isIdle = false;
        if (this.isVisible) this.render();
      }
      this.idleTimeout = setTimeout(() => {
        this.isIdle = true;
        this.destroyIframes();
        this.destroyHls();
        this.destroyMap();
        this.content.innerHTML = `<div class="webcam-placeholder">${escapeHtml(t('components.webcams.pausedIdle'))}</div>`;
      }, ECO_IDLE_PAUSE_MS);
    };

    this.applyIdleMode();
  }

  public refresh(): void {
    if (this.isVisible && !this.isIdle) this.render();
  }

  public destroy(): void {
    if (this.idleTimeout) { clearTimeout(this.idleTimeout); this.idleTimeout = null; }
    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    document.removeEventListener('keydown', this.boundFullscreenEscHandler);
    window.removeEventListener('message', this.boundEmbedMessageHandler);
    IDLE_ACTIVITY_EVENTS.forEach(event => document.removeEventListener(event, this.boundIdleResetHandler));
    if (this.isFullscreen) this.toggleFullscreen();
    this.observer?.disconnect();
    this.unsubscribeStreamSettings?.();
    this.unsubscribeStreamSettings = null;
    this.destroyIframes();
    this.destroyHls();
    this.destroyMap();
    super.destroy();
  }
}
