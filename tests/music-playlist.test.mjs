import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  latestTracks,
  loadMusicPlaylist,
  matchingSpotifyTrack,
  parsePublicPlaylist,
  playlistLocation,
  serviceSearches,
} from '../src/lib/music-playlist.ts';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/vibes-2026.json', import.meta.url)),
);
const url = 'https://music.apple.com/us/playlist/vibes-2026/pl.u-NJG4Fmx6YPL';
const html = (data) =>
  `<script type="application/json" id="serialized-server-data">${JSON.stringify(data)}</script>`;
const playlist = parsePublicPlaylist(html(fixture), url);

test('real public playlist fixture selects the final ten, newest first', () => {
  assert.equal(playlist.total, 93);
  const tracks = latestTracks(playlist.tracks, 'newest-last');
  assert.equal(tracks.length, 10);
  assert.equal(tracks[0].title, 'Tell Me');
  assert.equal(tracks[9].title, 'The Mechanism');
  assert.equal(playlist.tracks[0].title, 'Satisfaction Skank (Extended)');
  assert.equal(
    tracks[0].appleMusic,
    'https://music.apple.com/us/album/tell-me/1810141810?i=1810141811',
  );
});

test('newest-first, short, and empty playlists preserve the right order', () => {
  assert.equal(
    latestTracks(playlist.tracks, 'newest-first')[0].title,
    'Satisfaction Skank (Extended)',
  );
  assert.deepEqual(
    latestTracks(playlist.tracks.slice(0, 2), 'newest-last').map(
      (track) => track.title,
    ),
    ['Doses & Mimosas', 'Satisfaction Skank (Extended)'],
  );
  assert.deepEqual(latestTracks([], 'newest-last'), []);
});

test('partial pages and changed public page formats fail rather than selecting wrong songs', () => {
  const partial = structuredClone(fixture);
  partial.data[0].data.sections[1].items.pop();
  assert.throws(() => parsePublicPlaylist(html(partial), url), /incomplete/);
  assert.throws(
    () => parsePublicPlaylist('<html>Unavailable</html>', url),
    /not found/,
  );
  assert.throws(
    () => parsePublicPlaylist(html({ data: [] }), url),
    /unrecognized/,
  );
});

test('rejects non-Apple, non-HTTPS, and non-playlist URLs', () => {
  for (const value of [
    'https://example.com/us/playlist/name/pl.123',
    'http://music.apple.com/us/playlist/name/pl.123',
    'https://music.apple.com/us/album/name/123',
    'https://music.apple.com:8080/us/playlist/name/pl.123',
  ])
    assert.throws(() => playlistLocation(value));
  assert.deepEqual(playlistLocation(`${url}?l=en#songs`), {
    country: 'us',
    id: 'pl.u-NJG4Fmx6YPL',
    url,
  });
});

test('search links encode titles, artists, and special characters', () => {
  const links = serviceSearches({ title: 'A & B?', artist: 'Someone / Else' });
  assert.equal(
    decodeURIComponent(
      new URL(links.spotify).pathname.slice('/search/'.length),
    ),
    'A & B? Someone / Else',
  );
  assert.equal(
    new URL(links.youtube).searchParams.get('search_query'),
    'A & B? Someone / Else',
  );
  assert.equal(
    new URL(links.soundcloud).searchParams.get('q'),
    'A & B? Someone / Else',
  );
});

const song = {
  id: '123',
  title: 'Tell Me',
  artist: 'No Mana',
  primaryArtist: 'No Mana',
  duration: 180000,
};
const candidate = {
  name: 'Tell Me',
  artists: [{ name: 'No Mana' }],
  duration_ms: 180500,
  external_urls: { spotify: 'https://open.spotify.com/track/abc123' },
};
test('Spotify matching requires title, artist, duration, and canonical track URL', () => {
  assert.equal(
    matchingSpotifyTrack(song, [candidate]),
    candidate.external_urls.spotify,
  );
  for (const mismatch of [
    { name: 'Tell Me (Live)' },
    { artists: [{ name: 'Another Artist' }] },
    { duration_ms: 220000 },
    { external_urls: { spotify: 'https://example.com/track/123' } },
  ])
    assert.equal(
      matchingSpotifyTrack(song, [{ ...candidate, ...mismatch }]),
      undefined,
    );
  assert.equal(
    matchingSpotifyTrack({ ...song, duration: undefined }, [candidate]),
    undefined,
  );
});

function credentials(t, values) {
  for (const [key, value] of Object.entries(values)) {
    const previous = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
}
const apiSong = (id) => ({
  id: String(id),
  type: 'songs',
  attributes: {
    name: `Song ${id}`,
    artistName: 'Artist',
    url: `https://music.apple.com/us/song/${id}`,
    durationInMillis: 180000,
  },
});

test('Apple API reads every page before selecting the last ten and keeps tokens in headers', async (t) => {
  credentials(t, {
    APPLE_MUSIC_DEVELOPER_TOKEN: 'test-token',
    SPOTIFY_CLIENT_ID: undefined,
    SPOTIFY_CLIENT_SECRET: undefined,
  });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address, options) => {
    calls.push(address);
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return Response.json(
      calls.length === 1
        ? {
            data: [
              {
                attributes: { name: 'API playlist' },
                relationships: {
                  tracks: {
                    data: Array.from({ length: 10 }, (_, i) => apiSong(i)),
                    next: '/v1/catalog/us/playlists/pl.api-test/tracks?offset=10',
                  },
                },
              },
            ],
          }
        : { data: [apiSong(10), apiSong(11)] },
    );
  });
  const result = await loadMusicPlaylist(
    'https://music.apple.com/us/playlist/test/pl.api-test',
    'newest-last',
  );
  assert.equal(calls.length, 2);
  assert.equal(result.total, 12);
  assert.deepEqual(
    result.tracks.map((track) => track.id),
    ['11', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
  );
  assert.ok(calls.every((address) => !address.includes('test-token')));
});

test('Apple API rejects unsafe pagination without sending credentials to another host', async (t) => {
  credentials(t, { APPLE_MUSIC_DEVELOPER_TOKEN: 'test-token' });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json({
      data: [
        {
          attributes: { name: 'Broken' },
          relationships: {
            tracks: { data: [], next: 'https://example.com/steal' },
          },
        },
      ],
    });
  });
  await assert.rejects(
    loadMusicPlaylist(
      'https://music.apple.com/us/playlist/test/pl.unsafe-test',
      'newest-last',
    ),
    /pagination/,
  );
  assert.equal(calls, 1);
});

test('credential-free builds fetch public Apple data once and leave Spotify as search', async (t) => {
  credentials(t, {
    APPLE_MUSIC_DEVELOPER_TOKEN: undefined,
    SPOTIFY_CLIENT_ID: undefined,
    SPOTIFY_CLIENT_SECRET: undefined,
  });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(html(fixture));
  });
  const value = 'https://music.apple.com/us/playlist/test/pl.public-test';
  const result = await loadMusicPlaylist(value, 'newest-last');
  const reversed = await loadMusicPlaylist(value, 'newest-first');
  assert.equal(calls, 1);
  assert.equal(result.tracks[0].title, 'Tell Me');
  assert.equal(reversed.tracks[0].title, 'Satisfaction Skank (Extended)');
  assert.equal(result.tracks[0].spotify, undefined);
});

test('Spotify credentials resolve direct links through the official catalog API', async (t) => {
  credentials(t, {
    APPLE_MUSIC_DEVELOPER_TOKEN: 'apple-test',
    SPOTIFY_CLIENT_ID: 'spotify-test',
    SPOTIFY_CLIENT_SECRET: 'secret-test',
  });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address, options) => {
    calls.push(address);
    if (address.startsWith('https://api.music.apple.com/'))
      return Response.json({
        data: [
          {
            attributes: { name: 'One track' },
            relationships: {
              tracks: {
                data: [
                  {
                    id: '123',
                    type: 'songs',
                    attributes: {
                      name: song.title,
                      artistName: song.artist,
                      durationInMillis: song.duration,
                      url: 'https://music.apple.com/us/song/123',
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    if (address === 'https://accounts.spotify.com/api/token') {
      assert.equal(options.body, 'grant_type=client_credentials');
      assert.match(options.headers.Authorization, /^Basic /);
      return Response.json({ access_token: 'spotify-access' });
    }
    assert.equal(new URL(address).origin, 'https://api.spotify.com');
    assert.equal(options.headers.Authorization, 'Bearer spotify-access');
    return Response.json({ tracks: { items: [candidate] } });
  });
  const result = await loadMusicPlaylist(
    'https://music.apple.com/us/playlist/test/pl.spotify-test',
    'newest-last',
  );
  assert.equal(result.tracks[0].spotify, candidate.external_urls.spotify);
  assert.equal(calls.length, 3);
});

test('Apple failures are surfaced for the component fallback', async (t) => {
  credentials(t, { APPLE_MUSIC_DEVELOPER_TOKEN: undefined });
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('', { status: 503 }),
  );
  await assert.rejects(
    loadMusicPlaylist(
      'https://music.apple.com/us/playlist/test/pl.failure-test',
      'newest-last',
    ),
    /HTTP 503/,
  );
});

test('Spotify matching preserves band names and multi-artist credits', () => {
  const band = {
    ...song,
    artist: 'Earth, Wind & Fire',
    primaryArtist: 'Earth, Wind & Fire',
  };
  assert.equal(
    matchingSpotifyTrack(band, [
      { ...candidate, artists: [{ name: 'Earth, Wind & Fire' }] },
    ]),
    candidate.external_urls.spotify,
  );
  const collaboration = { ...song, primaryArtist: 'No Mana & Other Artist' };
  assert.equal(
    matchingSpotifyTrack(collaboration, [
      {
        ...candidate,
        artists: [{ name: 'No Mana' }, { name: 'Other Artist' }],
      },
    ]),
    candidate.external_urls.spotify,
  );
});

test('Spotify rate limiting preserves Apple tracks and falls back to searches', async (t) => {
  credentials(t, {
    APPLE_MUSIC_DEVELOPER_TOKEN: 'test-token',
    SPOTIFY_CLIENT_ID: 'test',
    SPOTIFY_CLIENT_SECRET: 'test',
  });
  t.mock.method(globalThis, 'fetch', async (address) => {
    if (address.startsWith('https://api.music.apple.com/'))
      return Response.json({
        data: [
          {
            attributes: { name: 'One song' },
            relationships: { tracks: { data: [apiSong(1)] } },
          },
        ],
      });
    return new Response('', { status: 429 });
  });
  t.mock.method(console, 'warn', () => {});
  const result = await loadMusicPlaylist(
    'https://music.apple.com/us/playlist/test/pl.rate-test',
    'newest-last',
  );
  assert.equal(result.tracks.length, 1);
  assert.equal(result.tracks[0].spotify, undefined);
  assert.ok(result.tracks[0].appleMusic.startsWith('https://music.apple.com/'));
});

test('custom song limits select the requested newest songs in either order', () => {
  assert.equal(latestTracks(playlist.tracks, 'newest-last', 6).length, 6);
  assert.equal(
    latestTracks(playlist.tracks, 'newest-last', 6)[0].title,
    'Tell Me',
  );
  assert.equal(latestTracks(playlist.tracks, 'newest-first', 12).length, 12);
  assert.equal(
    latestTracks(playlist.tracks, 'newest-first', 12)[0].title,
    'Satisfaction Skank (Extended)',
  );
  assert.equal(latestTracks(playlist.tracks, 'newest-last', 100).length, 93);
  assert.equal(latestTracks([], 'newest-last', 5).length, 0);
  for (const limit of [0, -1, 1.5, NaN, 101])
    assert.throws(
      () => latestTracks(playlist.tracks, 'newest-last', limit),
      /integer from 1 to 100/,
    );
});

test('multiple posts can choose different limits for the same cached playlist', async (t) => {
  credentials(t, {
    APPLE_MUSIC_DEVELOPER_TOKEN: undefined,
    SPOTIFY_CLIENT_ID: undefined,
    SPOTIFY_CLIENT_SECRET: undefined,
  });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(html(fixture));
  });
  const value = 'https://music.apple.com/us/playlist/test/pl.limits-test';
  const six = await loadMusicPlaylist(value, 'newest-last', 6);
  const twelve = await loadMusicPlaylist(value, 'newest-last', 12);
  assert.equal(calls, 1);
  assert.equal(six.tracks.length, 6);
  assert.equal(twelve.tracks.length, 12);
  assert.equal(six.tracks[0].title, twelve.tracks[0].title);
});
