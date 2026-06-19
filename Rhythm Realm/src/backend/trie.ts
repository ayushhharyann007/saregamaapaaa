import type { Song } from "@/backend/data/songs";

export interface TrieNode {
  char: string;
  children: Map<string, TrieNode>;
  isEnd: boolean;
  songIds: string[]; // songs whose searchable text passes through this node
}

const createNode = (char = ""): TrieNode => ({
  char,
  children: new Map(),
  isEnd: false,
  songIds: [],
});

export class SongTrie {
  root: TrieNode = createNode();

  insert(text: string, songId: string) {
    let node = this.root;
    const key = text.toLowerCase();
    for (const ch of key) {
      if (!node.children.has(ch)) node.children.set(ch, createNode(ch));
      node = node.children.get(ch)!;
      if (!node.songIds.includes(songId)) node.songIds.push(songId);
    }
    node.isEnd = true;
  }

  /** Returns the path of nodes traversed for a prefix, or null if it breaks. */
  traverse(prefix: string): { path: TrieNode[]; node: TrieNode | null } {
    let node: TrieNode = this.root;
    const path: TrieNode[] = [this.root];
    for (const ch of prefix.toLowerCase()) {
      const next: TrieNode | undefined = node.children.get(ch);
      if (!next) return { path, node: null };
      node = next;
      path.push(node);
    }
    return { path, node };
  }

  /** Collect songIds under a prefix node, ranked by plays. */
  search(prefix: string): string[] {
    const { node } = this.traverse(prefix);
    if (!node) return [];
    return node.songIds;
  }
}

export function buildTrie(songs: Song[]): SongTrie {
  const trie = new SongTrie();
  for (const s of songs) {
    trie.insert(s.title, s.id);
    trie.insert(s.artist, s.id);
    // also index individual words for better prefix coverage
    for (const w of s.title.split(/\s+/)) trie.insert(w, s.id);
    for (const w of s.artist.split(/\s+/)) trie.insert(w, s.id);
  }
  return trie;
}

export interface SearchResult {
  id: string;
  steps: number; // characters compared
}

/** Top N song ids for a prefix ranked by global playback volume. */
export function suggest(
  trie: SongTrie,
  prefix: string,
  songMap: Map<string, Song>,
  limit = 5,
): string[] {
  if (!prefix.trim()) return [];
  const ids = Array.from(new Set(trie.search(prefix)));
  return ids
    .map((id) => songMap.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit)
    .map((s) => s.id);
}
