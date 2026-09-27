/**
 * IPTV channel configuration — curated from Free-TV/IPTV
 * https://github.com/Free-TV/IPTV
 *
 * Channels are organized by region and country with HLS stream URLs.
 * Only verified, freely-available streams are included.
 */

export type IptvRegion = 'news' | 'americas' | 'europe' | 'asia' | 'middle-east' | 'africa';

export type IptvCategory = 'news' | 'general' | 'business' | 'weather' | 'entertainment' | 'sports' | 'music' | 'kids';

export interface IptvChannel {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: IptvRegion;
  category: IptvCategory;
  language: string;
  url: string;
  /** Approximate coordinates [lat, lng] for the broadcaster HQ / target audience */
  coords: [number, number];
}

// ---------------------------------------------------------------------------
// International News (region: 'news')
// ---------------------------------------------------------------------------
const NEWS_CHANNELS: IptvChannel[] = [
  { id: 'al-jazeera-en', name: 'Al Jazeera English', country: 'Qatar', countryCode: 'QA', region: 'news', category: 'news', language: 'en', url: 'https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8', coords: [25.29, 51.53] },
  { id: 'bbc-news', name: 'BBC News', country: 'UK', countryCode: 'GB', region: 'news', category: 'news', language: 'en', url: 'https://vs-hls-push-uk.live.fastly.md.bbci.co.uk/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/iptv_hd_abr_v1.m3u8', coords: [51.51, -0.12] },
  { id: 'dw-en', name: 'DW News', country: 'Germany', countryCode: 'DE', region: 'news', category: 'news', language: 'en', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', coords: [50.73, 7.10] },
  { id: 'cgtn-en', name: 'CGTN', country: 'China', countryCode: 'CN', region: 'news', category: 'news', language: 'en', url: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8', coords: [39.91, 116.40] },
  { id: 'nhk-world', name: 'NHK World Japan', country: 'Japan', countryCode: 'JP', region: 'news', category: 'news', language: 'en', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_4M.m3u8', coords: [35.68, 139.69] },
  { id: 'trt-world', name: 'TRT World', country: 'Turkey', countryCode: 'TR', region: 'news', category: 'news', language: 'en', url: 'https://api.trtworld.com/livestream/v1/WcM3Oa2LHD9iUjWDSRUI335NkMWVTUV351H56dqC/master.m3u8', coords: [41.01, 28.98] },
  { id: 'india-today', name: 'India Today', country: 'India', countryCode: 'IN', region: 'news', category: 'news', language: 'en', url: 'https://indiatodaylive.akamaized.net/hls/live/2014320/indiatoday/indiatodaylive/playlist.m3u8', coords: [28.61, 77.23] },
  { id: 'rt-en', name: 'Russia Today', country: 'Russia', countryCode: 'RU', region: 'news', category: 'news', language: 'en', url: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8', coords: [55.75, 37.62] },
  { id: 'reuters', name: 'Reuters', country: 'USA', countryCode: 'US', region: 'news', category: 'news', language: 'en', url: 'https://reuters-reutersnow-1-nl.samsung.wurl.tv/playlist.m3u8', coords: [40.76, -73.98] },
  { id: 'sky-news', name: 'Sky News', country: 'UK', countryCode: 'GB', region: 'news', category: 'news', language: 'en', url: 'https://linear021-gb-hls1-prd-ak.cdn.skycdp.com/Content/HLS_001_hd/Live/channel(skynews)/index_mob.m3u8', coords: [51.50, -0.18] },
  { id: 'gb-news', name: 'GB News', country: 'UK', countryCode: 'GB', region: 'news', category: 'news', language: 'en', url: 'https://live-gbnews.simplestreamcdn.com/live5/gbnews/bitrate1.isml/manifest.m3u8', coords: [51.52, -0.09] },
  { id: 'tv5monde-info', name: 'TV5Monde Info', country: 'France', countryCode: 'FR', region: 'news', category: 'news', language: 'fr', url: 'https://ott.tv5monde.com/Content/HLS/Live/channel(info)/index.m3u8', coords: [48.85, 2.35] },
  { id: 'cgtn-fr', name: 'CGTN Français', country: 'China', countryCode: 'CN', region: 'news', category: 'news', language: 'fr', url: 'https://news.cgtn.com/resource/live/french/cgtn-f.m3u8', coords: [39.91, 116.40] },
  { id: 'ticker-news', name: 'Ticker News', country: 'Australia', countryCode: 'AU', region: 'news', category: 'news', language: 'en', url: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01486-tickernews-tickernewsweb-ono/playlist.m3u8', coords: [-33.87, 151.21] },
  // Business
  { id: 'bloomberg-us', name: 'Bloomberg US', country: 'USA', countryCode: 'US', region: 'news', category: 'business', language: 'en', url: 'https://bloomberg.com/media-manifest/streams/us.m3u8', coords: [40.76, -73.97] },
  { id: 'bloomberg-eu', name: 'Bloomberg EU', country: 'UK', countryCode: 'GB', region: 'news', category: 'business', language: 'en', url: 'https://bloomberg.com/media-manifest/streams/eu.m3u8', coords: [51.51, -0.08] },
  { id: 'yahoo-finance', name: 'Yahoo! Finance', country: 'USA', countryCode: 'US', region: 'news', category: 'business', language: 'en', url: 'https://d1ewctnvcwvvvu.cloudfront.net/playlist.m3u8', coords: [37.47, -122.17] },
  { id: 'cheddar-news', name: 'Cheddar News', country: 'USA', countryCode: 'US', region: 'news', category: 'business', language: 'en', url: 'https://dbrb49pjoymg4.cloudfront.net/10001/99991220/hls/index.m3u8', coords: [40.74, -73.99] },
  // Weather
  { id: 'accuweather', name: 'AccuWeather', country: 'USA', countryCode: 'US', region: 'news', category: 'weather', language: 'en', url: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg00684-accuweather-accuweather-plex/playlist.m3u8', coords: [40.79, -77.86] },
];

// ---------------------------------------------------------------------------
// Americas
// ---------------------------------------------------------------------------
const AMERICAS_CHANNELS: IptvChannel[] = [
  // USA
  { id: 'cbs-news', name: 'CBS News', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://dai.google.com/linear/hls/event/Sid4xiTQTkCT1SLu6rjUSQ/master.m3u8', coords: [40.76, -73.97] },
  { id: 'abc-news-us', name: 'ABC News Live', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://lnc-abc-news.tubi.video/index.m3u8', coords: [40.77, -73.98] },
  { id: 'nbc-news', name: 'NBC News NOW', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://dai2.xumo.com/amagi_hls_data_xumo1212A-xumo-nbcnewsnow/CDN/master.m3u8', coords: [40.76, -73.98] },
  { id: 'fox-livenow', name: 'LiveNOW from FOX', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://lnc-fox-live-now.tubi.video/index.m3u8', coords: [40.77, -73.96] },
  { id: 'scripps-news', name: 'Scripps News', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://content.uplynk.com/channel/4bb4901b934c4e029fd4c1abfc766c37.m3u8', coords: [39.10, -84.51] },
  { id: 'usa-today', name: 'USA Today', country: 'USA', countryCode: 'US', region: 'americas', category: 'news', language: 'en', url: 'https://lnc-usa-today.tubi.video/playlist.m3u8', coords: [38.85, -77.04] },
  { id: 'nasa-tv', name: 'NASA TV', country: 'USA', countryCode: 'US', region: 'americas', category: 'general', language: 'en', url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master_2000.m3u8', coords: [38.88, -77.02] },
  { id: 'buzzr', name: 'Buzzr', country: 'USA', countryCode: 'US', region: 'americas', category: 'entertainment', language: 'en', url: 'https://buzzrota-ono.amagi.tv/playlist1080.m3u8', coords: [34.05, -118.24] },
  // Canada
  { id: 'cbc-news-ca', name: 'CBC News Network', country: 'Canada', countryCode: 'CA', region: 'americas', category: 'news', language: 'en', url: 'https://dai2.xumo.com/amagi_hls_data_xumo1212A-redboxcbcnews/CDN/playlist.m3u8', coords: [43.65, -79.38] },
  { id: 'ici-tele', name: 'ICI Télé', country: 'Canada', countryCode: 'CA', region: 'americas', category: 'general', language: 'fr', url: 'https://rcavlive.akamaized.net/hls/live/696615/xcancbft/master.m3u8', coords: [45.50, -73.57] },
  { id: 'global-news-ca', name: 'Global News', country: 'Canada', countryCode: 'CA', region: 'americas', category: 'news', language: 'en', url: 'https://live.corusdigitaldev.com/groupd/live/49a91e7f-1023-430f-8d66-561055f3d0f7/live.isml/.m3u8', coords: [43.64, -79.39] },
  // Brazil
  { id: 'tv-cultura', name: 'TV Cultura', country: 'Brazil', countryCode: 'BR', region: 'americas', category: 'general', language: 'pt', url: 'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8', coords: [-23.55, -46.63] },
];

// ---------------------------------------------------------------------------
// Europe
// ---------------------------------------------------------------------------
const EUROPE_CHANNELS: IptvChannel[] = [
  // UK
  { id: 'bbc-one', name: 'BBC One', country: 'UK', countryCode: 'GB', region: 'europe', category: 'general', language: 'en', url: 'https://vs-hls-pushb-uk-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_one_yorks/iptv_hd_abr_v1.m3u8', coords: [51.51, -0.12] },
  { id: 'bbc-two', name: 'BBC Two', country: 'UK', countryCode: 'GB', region: 'europe', category: 'general', language: 'en', url: 'https://vs-hls-push-uk-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_two_hd/iptv_hd_abr_v1.m3u8', coords: [51.51, -0.12] },
  { id: 'bbc-four', name: 'BBC Four', country: 'UK', countryCode: 'GB', region: 'europe', category: 'general', language: 'en', url: 'https://vs-hls-pushb-uk-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_four_hd/iptv_hd_abr_v1.m3u8', coords: [51.51, -0.12] },
  { id: 'bbc-parliament', name: 'BBC Parliament', country: 'UK', countryCode: 'GB', region: 'europe', category: 'news', language: 'en', url: 'https://vs-hls-pushb-uk-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_parliament/pc_hd_abr_v2.m3u8', coords: [51.50, -0.12] },
  { id: 'talktv', name: 'TalkTV', country: 'UK', countryCode: 'GB', region: 'europe', category: 'news', language: 'en', url: 'https://live-talktv-ssai.simplestreamcdn.com/v1/master/82267e84b9e5053b3fd0ade12cb1a146df74169a/talktv-live/index.m3u8', coords: [51.51, -0.14] },
  // Germany
  { id: 'das-erste', name: 'Das Erste', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'general', language: 'de', url: 'https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8', coords: [50.11, 8.68] },
  { id: 'zdf', name: 'ZDF', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'general', language: 'de', url: 'https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8', coords: [49.99, 8.25] },
  { id: 'zdf-info', name: 'ZDFinfo', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'news', language: 'de', url: 'https://zdf-hls-17.akamaized.net/hls/live/2016500/de/veryhigh/master.m3u8', coords: [49.99, 8.25] },
  { id: 'tagesschau24', name: 'tagesschau24', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'news', language: 'de', url: 'https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8', coords: [53.56, 10.00] },
  { id: 'welt', name: 'WELT', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'news', language: 'de', url: 'https://w-live2weltcms.akamaized.net/hls/live/2041019/Welt-LivePGM/index.m3u8', coords: [52.52, 13.40] },
  { id: 'phoenix', name: 'Phoenix', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'news', language: 'de', url: 'https://zdf-hls-19.akamaized.net/hls/live/2016502/de/veryhigh/master.m3u8', coords: [50.93, 6.96] },
  { id: 'arte-de', name: 'ARTE', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'general', language: 'de', url: 'https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8', coords: [48.58, 7.75] },
  { id: '3sat', name: '3sat', country: 'Germany', countryCode: 'DE', region: 'europe', category: 'general', language: 'de', url: 'https://zdf-hls-18.akamaized.net/hls/live/2016501/dach/veryhigh/master.m3u8', coords: [49.99, 8.25] },
  // France
  { id: 'arte-fr', name: 'Arte', country: 'France', countryCode: 'FR', region: 'europe', category: 'general', language: 'fr', url: 'https://artesimulcast.akamaized.net/hls/live/2031003/artelive_fr/index.m3u8', coords: [48.58, 7.75] },
  { id: 'nrj12', name: 'NRJ 12', country: 'France', countryCode: 'FR', region: 'europe', category: 'entertainment', language: 'fr', url: 'https://nrj12.nrjaudio.fm/hls/live/2038374/nrj_12/master.m3u8', coords: [48.87, 2.33] },
  { id: 'tv5monde-fbs', name: 'TV5Monde FBS', country: 'France', countryCode: 'FR', region: 'europe', category: 'general', language: 'fr', url: 'https://ott.tv5monde.com/Content/HLS/Live/channel(fbs)/index.m3u8', coords: [48.87, 2.33] },
  { id: 'tv5monde-eu', name: 'TV5Monde Europe', country: 'France', countryCode: 'FR', region: 'europe', category: 'general', language: 'fr', url: 'https://ott.tv5monde.com/Content/HLS/Live/channel(europe)/index.m3u8', coords: [48.87, 2.33] },
  // Austria
  { id: 'orf1', name: 'ORF 1', country: 'Austria', countryCode: 'AT', region: 'europe', category: 'general', language: 'de', url: 'https://orf1.mdn.ors.at/out/u/orf1/q8c/manifest.m3u8', coords: [48.21, 16.37] },
  { id: 'arise-news', name: 'Arise News', country: 'UK', countryCode: 'GB', region: 'europe', category: 'news', language: 'en', url: 'https://liveedge-arisenews.visioncdn.com/live-hls/arisenews/arisenews/arisenews_web/master.m3u8', coords: [51.51, -0.12] },
  // S4C (Wales)
  { id: 's4c', name: 'S4C', country: 'UK', countryCode: 'GB', region: 'europe', category: 'general', language: 'cy', url: 'https://live-uk.s4c-cdn.co.uk/out/v1/a0134f1fd5a2461b9422b574566d4442/live_uk.m3u8', coords: [52.48, -3.18] },
];

// ---------------------------------------------------------------------------
// Asia-Pacific
// ---------------------------------------------------------------------------
const ASIA_CHANNELS: IptvChannel[] = [
  // Japan
  { id: 'nhk-world-catv', name: 'NHK WORLD-JAPAN (CATV)', country: 'Japan', countryCode: 'JP', region: 'asia', category: 'general', language: 'ja', url: 'https://master.nhkworld.jp/nhkworld-tv/playlist/live.m3u8', coords: [35.68, 139.69] },
  { id: 'shop-channel-jp', name: 'ショップチャンネル', country: 'Japan', countryCode: 'JP', region: 'asia', category: 'entertainment', language: 'ja', url: 'https://stream3.shopch.jp/HLS/master.m3u8', coords: [35.68, 139.69] },
  { id: 'weathernews-jp', name: 'ウェザーニュース', country: 'Japan', countryCode: 'JP', region: 'asia', category: 'weather', language: 'ja', url: 'https://rch01e-alive-hls.akamaized.net/38fb45b25cdb05a1/out/v1/4e907bfabc684a1dae10df8431a84d21/index.m3u8', coords: [35.68, 139.69] },
  // China
  { id: 'cctv1', name: 'CCTV-1', country: 'China', countryCode: 'CN', region: 'asia', category: 'general', language: 'zh', url: 'https://node1.olelive.com:6443/live/CCTV1HD/hls.m3u8', coords: [39.91, 116.40] },
  { id: 'cctv5', name: 'CCTV-5 Sports', country: 'China', countryCode: 'CN', region: 'asia', category: 'sports', language: 'zh', url: 'https://node1.olelive.com:6443/live/CCTV5HD/hls.m3u8', coords: [39.91, 116.40] },
  // India
  { id: 'ndtv-india', name: 'NDTV India', country: 'India', countryCode: 'IN', region: 'asia', category: 'news', language: 'hi', url: 'https://ndtvindiaelemarchana.akamaized.net/hls/live/2003679/ndtvindia/master.m3u8', coords: [28.61, 77.21] },
  { id: 'abp-news', name: 'ABP News', country: 'India', countryCode: 'IN', region: 'asia', category: 'news', language: 'hi', url: 'https://abplivetv.pc.cdn.bitgravity.com/httppush/abp_livetv/abp_abpnews/master.m3u8', coords: [19.08, 72.88] },
  // South Korea
  { id: 'arirang', name: 'Arirang World', country: 'South Korea', countryCode: 'KR', region: 'asia', category: 'general', language: 'en', url: 'https://amdlive.ctnd.com.edgesuite.net/arirang_1ch/smil:arirang_1ch.smil/chunklist_b2256000_sleng.m3u8', coords: [37.57, 126.98] },
  // Indonesia
  { id: 'metro-globe', name: 'Metro Globe Network', country: 'Indonesia', countryCode: 'ID', region: 'asia', category: 'news', language: 'id', url: 'https://edge.medcom.id/live-edge/smil:mgnch.smil/playlist.m3u8', coords: [-6.21, 106.85] },
  { id: 'tokyo-mx', name: 'TOKYO MX', country: 'Japan', countryCode: 'JP', region: 'asia', category: 'general', language: 'ja', url: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01287-rakutentvjapan-tokyomx-cmaf-rakutenjp/playlist.m3u8', coords: [35.68, 139.69] },
  // Australia
  { id: 'abc-news-au', name: 'ABC News Australia', country: 'Australia', countryCode: 'AU', region: 'asia', category: 'news', language: 'en', url: 'https://abc-iview-mediapackagestreams-2.akamaized.net/out/v1/6e1cc6d25ec0480ea099a5399d73bc4b/index.m3u8', coords: [-33.87, 151.21] },
  { id: 'sky-news-au', name: 'Sky News Australia', country: 'Australia', countryCode: 'AU', region: 'asia', category: 'news', language: 'en', url: 'https://i.mjh.nz/sky-news-now.m3u8', coords: [-33.87, 151.21] },
  // CNBC Indonesia
  { id: 'cnbc-id', name: 'CNBC Indonesia', country: 'Indonesia', countryCode: 'ID', region: 'asia', category: 'business', language: 'id', url: 'https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8', coords: [-6.21, 106.85] },
];

// ---------------------------------------------------------------------------
// Middle East
// ---------------------------------------------------------------------------
const MIDDLE_EAST_CHANNELS: IptvChannel[] = [
  { id: 'i24-news', name: 'i24 News', country: 'Israel', countryCode: 'IL', region: 'middle-east', category: 'news', language: 'en', url: 'https://bcovlive-a.akamaihd.net/6e3dd61ac4c34d6f8fb9698b565b9f50/eu-central-1/5377161796001/playlist-all_dvr.m3u8', coords: [32.07, 34.79] },
];

// ---------------------------------------------------------------------------
// Africa
// ---------------------------------------------------------------------------
const AFRICA_CHANNELS: IptvChannel[] = [
  { id: 'sabc-news', name: 'SABC News', country: 'South Africa', countryCode: 'ZA', region: 'africa', category: 'news', language: 'en', url: 'https://sabconetanw.cdn.mangomolo.com/news/smil:news.stream.smil/chunklist_b250000_t64MjQwcA==.m3u8', coords: [-26.20, 28.05] },
];

// ---------------------------------------------------------------------------
// Exported aggregate
// ---------------------------------------------------------------------------

export const IPTV_CHANNELS: IptvChannel[] = [
  ...NEWS_CHANNELS,
  ...AMERICAS_CHANNELS,
  ...EUROPE_CHANNELS,
  ...ASIA_CHANNELS,
  ...MIDDLE_EAST_CHANNELS,
  ...AFRICA_CHANNELS,
];

/** All unique regions present in the channel list */
export const IPTV_REGIONS: IptvRegion[] = ['news', 'americas', 'europe', 'asia', 'middle-east', 'africa'];

/** Human-readable region labels */
export const IPTV_REGION_LABELS: Record<IptvRegion, string> = {
  news: 'Global News',
  americas: 'Americas',
  europe: 'Europe',
  asia: 'Asia-Pacific',
  'middle-east': 'Middle East',
  africa: 'Africa',
};

export const IPTV_CATEGORY_LABELS: Record<IptvCategory, string> = {
  news: 'News',
  general: 'General',
  business: 'Business',
  weather: 'Weather',
  entertainment: 'Entertainment',
  sports: 'Sports',
  music: 'Music',
  kids: 'Kids',
};
