import { createServerFn } from "@tanstack/react-start";
import { colorsFor, type Song } from "@/backend/data/songs";

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
}

// Bollywood terms (India store) — kept rich and varied.
const BOLLYWOOD_TERMS = [
  "arijit singh",
  "shreya ghoshal",
  "pritam bollywood",
  "atif aslam",
  "a r rahman",
  "neha kakkar",
  "badshah",
  "jubin nautiyal",
  "bollywood party",
  "bollywood romantic hits",
  "sonu nigam",
  "honey singh",
  "kishore kumar",
  "lata mangeshkar",
  "vishal shekhar",
  "darshan raval",
  "armaan malik",
  "kk songs",
  "mohit chauhan",
  "sunidhi chauhan",
  "udit narayan",
  "kumar sanu",
  "shankar mahadevan",
  "tanishk bagchi",
  "b praak",
  "guru randhawa",
  "diljit dosanjh",
];

// South Indian terms (India store) — Telugu, Tamil, Kannada, Malayalam.
const TOLLYWOOD_TERMS = [
  "devi sri prasad",
  "thaman s",
  "anirudh ravichander",
  "telugu hits",
  "tollywood songs",
  "sid sriram",
  "ilaiyaraaja",
  "yuvan shankar raja",
  "rrr telugu",
  "pushpa songs",
  "tamil hits",
  "harris jayaraj",
  "kannada hits",
  "gv prakash",
  "ar rahman tamil",
  "malayalam hits",
  "vidyasagar malayalam",
  "shreya ghoshal tamil",
  "kannada film songs",
  "telugu melody",
];

// Regional India terms — Punjabi, Bengali, Marathi, Gujarati, Bhojpuri, etc.
const REGIONAL_TERMS = [
  "punjabi hits",
  "ammy virk",
  "sidhu moose wala",
  "ap dhillon",
  "shubh punjabi",
  "bengali songs",
  "rabindra sangeet",
  "anupam roy",
  "marathi hits",
  "ajay atul",
  "gujarati garba",
  "bhojpuri hits",
  "pawan singh",
  "rajasthani folk",
  "assamese songs",
  "zubeen garg",
  "haryanvi hits",
  "nepali songs",
  "odia songs",
  "himesh reshammiya",
];

// Hollywood / English terms (US store) — chosen so the trie fills out across
// nearly every starting letter A–Z for a richer node explorer.
const HOLLYWOOD_TERMS = [
  "adele",
  "beyonce",
  "coldplay",
  "drake",
  "ed sheeran",
  "eminem",
  "frank sinatra",
  "guns n roses",
  "harry styles",
  "imagine dragons",
  "justin bieber",
  "katy perry",
  "lady gaga",
  "maroon 5",
  "nirvana",
  "one republic",
  "post malone",
  "queen",
  "rihanna",
  "shakira",
  "taylor swift",
  "u2",
  "the weeknd",
  "xtina aguilera",
  "yellowcard",
  "zayn",
  "bruno mars",
  "dua lipa",
  "billie eilish",
  "michael jackson",
  "the beatles",
  "linkin park",
  "metallica",
  "sia",
  "sam smith",
  "olivia rodrigo",
  "ariana grande",
  "calvin harris",
  "david guetta",
  "kanye west",
  "kendrick lamar",
  "twenty one pilots",
  "vance joy",
  "weezer",
];

async function fetchTerm(term: string, country: string): Promise<ITunesResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term,
  )}&media=music&entity=song&limit=18&country=${country}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { results: ITunesResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

export const getSongs = createServerFn({ method: "GET" }).handler(
  async (): Promise<Song[]> => {
    const batches = await Promise.all([
      ...BOLLYWOOD_TERMS.map((t) => fetchTerm(t, "IN")),
      ...TOLLYWOOD_TERMS.map((t) => fetchTerm(t, "IN")),
      ...REGIONAL_TERMS.map((t) => fetchTerm(t, "IN")),
      ...HOLLYWOOD_TERMS.map((t) => fetchTerm(t, "US")),
    ]);
    const seen = new Set<number>();
    const songs: Song[] = [];

    for (const batch of batches) {
      for (const r of batch) {
        if (!r.previewUrl || seen.has(r.trackId)) continue;
        seen.add(r.trackId);
        const id = String(r.trackId);
        songs.push({
          id,
          title: r.trackName,
          artist: r.artistName,
          album: r.collectionName ?? "Single",
          year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : 2020,
          genre: r.primaryGenreName ?? "Bollywood",
          duration: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 30,
          plays: 0,
          audioUrl: r.previewUrl,
          artwork: (r.artworkUrl100 ?? "").replace("100x100", "400x400"),
          colors: colorsFor(id),
        });
      }
    }

    // Synthesize a deterministic popularity metric for ranking — based only on
    // the track id so it is identical on server and client (no order/index).
    songs.forEach((s) => {
      let h = 0;
      for (const c of s.id + s.title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      s.plays = 50_000_000 + (h % 950) * 1_000_000 + (h % 999) * 1_000;
    });

    return songs.sort((a, b) => b.plays - a.plays);
  },
);
