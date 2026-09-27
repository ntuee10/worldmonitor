Tiny 8s VP9 fMP4 HLS test stream used by `iptv-panel.spec.ts` in place of real IPTV
channels (which are geo-blocked / flaky and unreachable in CI). VP9 rather than H.264
because Playwright's open-source Chromium build has no proprietary codecs.

Regenerate with:

    ffmpeg -f lavfi -i testsrc=size=320x180:rate=15 -t 8 -c:v libvpx-vp9 -b:v 150k \
      -deadline realtime -cpu-used 8 -g 30 -f hls -hls_time 2 -hls_playlist_type vod \
      -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 index.m3u8
