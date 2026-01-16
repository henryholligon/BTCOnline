export interface Review {
  id: string;
  authorNpub: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Merchant {
  id: string;
  name: string;
  description: string;
  logo: string; // Emoji or initial for now
  categories: string[];
  shippingCountries: string[];
  website: string;
  lightningSupported: boolean;
  onchainSupported: boolean;
  reviews: Review[];
  featured?: boolean;
}

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Services",
  "Food & Drink",
  "Travel",
  "Gift Cards",
  "VPN & Privacy",
  "Hosting",
  "Books",
  "Art"
];

export const COUNTRIES = [
  "Worldwide",
  "USA",
  "Europe",
  "Canada",
  "UK",
  "Australia",
  "El Salvador"
];

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: "1",
    name: "BitRefill",
    description: "Buy Gift Cards & Mobile Refills with Bitcoin. Live on crypto.",
    logo: "🎁",
    categories: ["Gift Cards", "Services", "Travel"],
    shippingCountries: ["Worldwide"],
    website: "https://bitrefill.com",
    lightningSupported: true,
    onchainSupported: true,
    featured: true,
    reviews: [
      { id: "r1", authorNpub: "npub1...xyz", rating: 5, comment: "Works instantly via Lightning!", date: "2024-03-10" },
      { id: "r2", authorNpub: "npub1...abc", rating: 5, comment: "Essential for living on Bitcoin.", date: "2024-02-15" }
    ]
  },
  {
    id: "2",
    name: "Coincards",
    description: "Buy Gift Cards with Bitcoin & Altcoins. Canada & US supported.",
    logo: "💳",
    categories: ["Gift Cards", "Services"],
    shippingCountries: ["USA", "Canada"],
    website: "https://coincards.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: [
      { id: "r3", authorNpub: "npub1...def", rating: 4, comment: "Great service, fast delivery.", date: "2024-01-20" }
    ]
  },
  {
    id: "3",
    name: "Mullvad VPN",
    description: "Mullvad is a VPN service that helps keep your online activity, identity, and location private.",
    logo: "/assets/mullvad-logo.png",
    categories: ["VPN & Privacy", "Services"],
    shippingCountries: ["Worldwide"],
    website: "https://mullvad.net",
    lightningSupported: true,
    onchainSupported: true,
    featured: true,
    reviews: [
      { id: "r4", authorNpub: "npub1...ghi", rating: 5, comment: "Best privacy VPN, accepts cash and BTC.", date: "2024-03-01" }
    ]
  },
  {
    id: "4",
    name: "Coldcard (Coinkite)",
    description: "Hardware wallets for Bitcoin security. Makers of Coldcard.",
    logo: "🔐",
    categories: ["Electronics", "Services"],
    shippingCountries: ["Worldwide"],
    website: "https://store.coinkite.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "5",
    name: "Start9",
    description: "Sovereign computing. Run your own personal server.",
    logo: "🖥️",
    categories: ["Electronics", "Hosting"],
    shippingCountries: ["Worldwide", "USA"],
    website: "https://start9.com",
    lightningSupported: true,
    onchainSupported: true,
    featured: true,
    reviews: []
  },
  {
    id: "6",
    name: "Opendime",
    description: "The Bitcoin Credit Stick. A small USB stick that lets you spend Bitcoin like a dollar bill.",
    logo: "💾",
    categories: ["Electronics"],
    shippingCountries: ["Worldwide"],
    website: "https://opendime.com",
    lightningSupported: false,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "7",
    name: "Fold App",
    description: "Earn bitcoin on everything you do. Shop at your favorites and get cash back.",
    logo: "🛍️",
    categories: ["Services", "Gift Cards"],
    shippingCountries: ["USA"],
    website: "https://foldapp.com",
    lightningSupported: true,
    onchainSupported: false,
    reviews: []
  },
  {
    id: "8",
    name: "Blockstream Store",
    description: "Official store for Blockstream Jade, clothing, and stickers.",
    logo: "⛓️",
    categories: ["Electronics", "Clothing"],
    shippingCountries: ["Worldwide"],
    website: "https://store.blockstream.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "9",
    name: "Bitcoin Magazine Store",
    description: "Apparel, art, and books for Bitcoiners.",
    logo: "📖",
    categories: ["Clothing", "Books", "Art"],
    shippingCountries: ["Worldwide"],
    website: "https://store.bitcoinmagazine.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "10",
    name: "Orange Pill App",
    description: "Find Bitcoiners near you.",
    logo: "💊",
    categories: ["Services", "Social"],
    shippingCountries: ["Worldwide"],
    website: "https://theorangepillapp.com",
    lightningSupported: true,
    onchainSupported: false,
    reviews: []
  }
];
