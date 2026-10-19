// Runs only while Astro builds the static blog pages. Tokens never reach visitors.
export type PlaylistOrder = 'newest-last' | 'newest-first';
export type PlaylistLayout = 'grid' | 'list';
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  primaryArtist: string;
  appleMusic: string;
  artwork?: string;
  duration?: number;
  spotify?: string;
}
export interface MusicPlaylist {
  title: string;
  url: string;
  tracks: MusicTrack[];
  total: number;
  fetchedAt: string;
}
interface PublicItem {
  title?: string;
  artistName?: string;
  subtitleLinks?: { title: string }[];
  contentDescriptor?: {
    kind: string;
    identifiers?: { storeAdamID?: string };
    url?: string;
  };
  artwork?: { dictionary?: { url?: string } };
  duration?: number;
  trackCount?: number;
}
interface CatalogSong {
  id: string;
  type: string;
  attributes?: {
    name: string;
    artistName: string;
    url: string;
    artwork?: { url: string };
    durationInMillis?: number;
  };
}

export function playlistLocation(value: string) {
  const url = new URL(value);
  const match = url.pathname.match(
    /^\/([a-z]{2})\/playlist\/(?:[^/]+\/)?(pl\.[\w.-]+)\/?$/i,
  );
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'music.apple.com' ||
    url.port ||
    url.username ||
    url.password ||
    !match
  ) {
    throw new Error(
      'Use a public https://music.apple.com/{country}/playlist/... URL.',
    );
  }
  return {
    country: match[1].toLowerCase(),
    id: match[2],
    url: `${url.origin}${url.pathname}`,
  };
}

function artworkUrl(value?: string) {
  if (!value) return undefined;
  const url = value
    .replaceAll('{w}', '480')
    .replaceAll('{h}', '480')
    .replaceAll('{f}', 'jpg');
  return /^https:\/\/[^/]+\.mzstatic\.com\//.test(url) ? url : undefined;
}

export function parsePublicPlaylist(html: string, url: string): MusicPlaylist {
  const script = html.match(
    /<script\b[^>]*\bid=["']serialized-server-data["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!script)
    throw new Error('Apple Music public playlist data was not found.');
  const payload = JSON.parse(script[1]) as {
    data: { data: { sections: { itemKind: string; items: PublicItem[] }[] } }[];
  };
  const sections = payload.data?.[0]?.data?.sections;
  const header = sections?.find(
    (section) => section.itemKind === 'containerDetailHeaderLockup',
  )?.items[0];
  const items = sections
    ?.filter((section) => section.itemKind === 'trackLockup')
    .flatMap((section) => section.items);
  if (!header?.title || !items || !Number.isInteger(header.trackCount)) {
    throw new Error('Apple Music returned an unrecognized playlist.');
  }
  // A partial page must never silently produce the wrong "latest" ten tracks.
  if (items.length !== header.trackCount)
    throw new Error('Apple Music returned an incomplete playlist.');
  const tracks = items.map((item): MusicTrack => {
    const descriptor = item.contentDescriptor;
    if (
      descriptor?.kind !== 'song' ||
      !descriptor.identifiers?.storeAdamID ||
      !item.title ||
      !item.artistName ||
      !descriptor.url?.startsWith('https://music.apple.com/')
    ) {
      throw new Error('Apple Music returned an unsupported playlist item.');
    }
    return {
      id: descriptor.identifiers.storeAdamID,
      title: item.title,
      artist: item.artistName,
      primaryArtist: item.subtitleLinks?.[0]?.title ?? item.artistName,
      appleMusic: descriptor.url,
      artwork: artworkUrl(item.artwork?.dictionary?.url),
      duration: item.duration,
    };
  });
  return {
    title: header.title,
    url,
    tracks,
    total: tracks.length,
    fetchedAt: new Date().toISOString(),
  };
}

export function latestTracks(
  tracks: MusicTrack[],
  order: PlaylistOrder,
  limit = 10,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Playlist limit must be an integer from 1 to 100.');
  }
  return order === 'newest-first'
    ? tracks.slice(0, limit)
    : tracks.slice(-limit).reverse();
}

async function request(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(`Music service returned HTTP ${response.status}.`);
  return response;
}

async function catalogPlaylist(
  value: string,
  token: string,
): Promise<MusicPlaylist> {
  const location = playlistLocation(value);
  const path = `/v1/catalog/${location.country}/playlists/${location.id}`;
  const headers = { Authorization: `Bearer ${token}` };
  const response = await request(
    `https://api.music.apple.com${path}?include=tracks`,
    headers,
  );
  const payload = await response.json();
  const playlist = payload.data?.[0];
  if (!playlist?.attributes?.name || !playlist.relationships?.tracks?.data)
    throw new Error('Apple Music API returned no playlist.');
  const songs: CatalogSong[] = [...playlist.relationships.tracks.data];
  let next = playlist.relationships.tracks.next as string | undefined;
  const visited = new Set<string>();
  while (next) {
    if (
      !next.startsWith(`${path}/tracks?`) ||
      visited.has(next) ||
      visited.size >= 100
    )
      throw new Error('Invalid Apple Music pagination.');
    visited.add(next);
    const page = await (
      await request(`https://api.music.apple.com${next}`, headers)
    ).json();
    if (!Array.isArray(page.data))
      throw new Error('Apple Music returned an incomplete playlist.');
    songs.push(...page.data);
    next = page.next;
  }
  const tracks = songs.map((song): MusicTrack => {
    const a = song.attributes;
    if (
      song.type !== 'songs' ||
      !a?.name ||
      !a.artistName ||
      !a.url?.startsWith('https://music.apple.com/')
    )
      throw new Error('Apple Music returned an unsupported playlist item.');
    return {
      id: song.id,
      title: a.name,
      artist: a.artistName,
      primaryArtist: a.artistName,
      appleMusic: a.url,
      artwork: artworkUrl(a.artwork?.url),
      duration: a.durationInMillis,
    };
  });
  return {
    title: playlist.attributes.name,
    url: location.url,
    total: tracks.length,
    tracks,
    fetchedAt: new Date().toISOString(),
  };
}

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  external_urls: { spotify?: string };
}
export function matchingSpotifyTrack(
  track: MusicTrack,
  candidates: SpotifyTrack[],
) {
  return candidates.find(
    (candidate) =>
      normalize(candidate.name) === normalize(track.title) &&
      (candidate.artists.some(
        (artist) => normalize(artist.name) === normalize(track.primaryArtist),
      ) ||
        normalize(candidate.artists.map((artist) => artist.name).join(' ')) ===
          normalize(track.primaryArtist)) &&
      track.duration !== undefined &&
      Math.abs(candidate.duration_ms - track.duration) < 2500 &&
      /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+$/.test(
        candidate.external_urls?.spotify ?? '',
      ),
  )?.external_urls.spotify;
}

export function serviceSearches(track: MusicTrack) {
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  return {
    spotify: `https://open.spotify.com/search/${query}`,
    soundcloud: `https://soundcloud.com/search/sounds?q=${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
  };
}

const musicEnv = import.meta.env ?? process.env;
let spotifyToken: Promise<string> | undefined;
async function resolveSpotify(tracks: MusicTrack[]) {
  const { SPOTIFY_CLIENT_ID: client, SPOTIFY_CLIENT_SECRET: secret } = musicEnv;
  if (!client || !secret || tracks.length === 0) return;
  spotifyToken ??= (async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15_000),
      redirect: 'error',
    });
    if (!response.ok)
      throw new Error(
        `Spotify authentication returned HTTP ${response.status}.`,
      );
    const data = await response.json();
    if (typeof data.access_token !== 'string')
      throw new Error('Spotify returned no access token.');
    return data.access_token;
  })();
  try {
    const token = await spotifyToken;
    // Sequential requests avoid a burst of catalog searches during builds.
    for (const track of tracks) {
      const query = new URLSearchParams({
        q: `track:${track.title} artist:${track.primaryArtist}`,
        type: 'track',
        market: 'US',
        limit: '5',
      });
      const data = await (
        await request(`https://api.spotify.com/v1/search?${query}`, {
          Authorization: `Bearer ${token}`,
        })
      ).json();
      track.spotify = matchingSpotifyTrack(track, data.tracks?.items ?? []);
    }
  } catch (error) {
    console.warn(
      '[music] Spotify matching unavailable; using labeled search links.',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

const playlists = new Map<string, Promise<MusicPlaylist>>();
export async function loadMusicPlaylist(
  value: string,
  order: PlaylistOrder,
  limit = 10,
): Promise<MusicPlaylist> {
  const { url } = playlistLocation(value);
  if (!playlists.has(url)) {
    playlists.set(
      url,
      (async () => {
        const token = musicEnv.APPLE_MUSIC_DEVELOPER_TOKEN;
        // Public HTML is a credential-free fallback, not an undocumented API/token.
        return token
          ? catalogPlaylist(url, token)
          : parsePublicPlaylist(await (await request(url)).text(), url);
      })(),
    );
  }
  const playlist = await playlists.get(url)!;
  const tracks = latestTracks(playlist.tracks, order, limit).map((track) => ({
    ...track,
  }));
  await resolveSpotify(tracks);
  return { ...playlist, tracks };
}
