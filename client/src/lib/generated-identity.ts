const NAME_WORDS = [
  "Satoshi", "Lightning", "Bitcoin", "Block", "Chain", "Hash", "Relay",
  "Cipher", "Orange", "Golden", "Quiet", "Brave", "Bright", "Free",
  "Sovereign", "Digital", "Atomic", "Rapid", "Open", "True",
];

const NAME_NOUNS = [
  "Hawk", "Owl", "Fox", "Falcon", "Comet", "Sparrow", "Lion", "Wolf",
  "Panda", "Tiger", "Badger", "Raven", "Eagle", "Otter", "Whale",
  "Node", "Miner", "Voyager", "Pioneer", "Nomad",
];

const EMOJIS = ["🦊", "🐺", "🦉", "🦅", "🐻", "🐼", "🐯", "🦁", "🐸", "🐙", "🐳", "⚡", "🔥", "🌞", "🪙", "🚀"];

function hash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** Creates a stable initial identity that can be published as a Nostr kind:0 profile. */
export function generateNostrIdentity(pubkey: string) {
  const seed = hash(pubkey);
  const first = NAME_WORDS[seed % NAME_WORDS.length];
  const second = NAME_NOUNS[Math.floor(seed / NAME_WORDS.length) % NAME_NOUNS.length];
  const emoji = EMOJIS[Math.floor(seed / 997) % EMOJIS.length];
  const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(pubkey)}`;
  return { name: `${first}${second}`, emoji, avatarUrl };
}