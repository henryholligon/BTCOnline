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
  paymentProvider?: string;
  reviews: Review[];
  featured?: boolean;
  countryMadeIn?: string;
  countryShippedFrom?: string;
}

export const PAYMENT_PROVIDERS = [
  "BTCPay Server",
  "Zaprite",
  "Strike",
  "OpenNode",
  "IBEX",
  "CoinCorner",
  "CoinGate"
];

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Drink",
  "Travel",
  "Gift Cards",
  "VPN & Privacy",
  "Hosting",
  "Books",
  "Art",
  "Charity"
];

export const COUNTRIES = [
  "🌍 Worldwide",
  "🇺🇸 USA",
  "🇪🇺 Europe",
  "🇨🇦 Canada",
  "🇬🇧 UK",
  "🇦🇺 Australia",
  "🇸🇻 El Salvador",
  "🇸🇪 Sweden"
];

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: "1",
    name: "BitRefill",
    description: "Buy Gift Cards & Mobile Refills with Bitcoin. Live on crypto.",
    logo: "/assets/bitrefill-logo.png",
    categories: ["Gift Cards", "Travel"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://bitrefill.com",
    lightningSupported: true,
    onchainSupported: true,
    paymentProvider: "BTCPay Server",
    featured: true,
    reviews: [
      { id: "r1", authorNpub: "npub1...xyz", rating: 5, comment: "Works instantly via Lightning!", date: "2024-03-10" },
      { id: "r2", authorNpub: "npub1...abc", rating: 5, comment: "Essential for living on Bitcoin.", date: "2024-02-15" }
    ]
  },
  {
    id: "2",
    name: "SLNT",
    description: "Privacy-first Faraday bags and signal blocking accessories.",
    logo: "/assets/slnt-logo.png",
    categories: ["Electronics"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://slnt.com",
    lightningSupported: true,
    onchainSupported: true,
    paymentProvider: "Zaprite",
    countryShippedFrom: "USA",
    countryMadeIn: "USA",
    reviews: [
      { id: "r3", authorNpub: "npub1...def", rating: 5, comment: "High quality signal blocking gear.", date: "2024-01-20" }
    ]
  },
  {
    id: "3",
    name: "Mullvad VPN",
    description: "Mullvad is a VPN service that helps keep your online activity, identity, and location private.",
    logo: "/assets/mullvad-logo.png",
    categories: ["VPN & Privacy"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://mullvad.net",
    lightningSupported: true,
    onchainSupported: true,
    paymentProvider: "Strike",
    countryShippedFrom: "Sweden",
    countryMadeIn: "Sweden",
    featured: true,
    reviews: [
      { id: "r4", authorNpub: "npub1...ghi", rating: 5, comment: "Best privacy VPN, accepts cash and BTC.", date: "2024-03-01" }
    ]
  },
  {
    id: "4",
    name: "Coinkite",
    description: "Hardware wallets for Bitcoin security. Makers of Coldcard.",
    logo: "/assets/coinkite-logo.png",
    categories: ["Electronics"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://coinkite.com",
    lightningSupported: true,
    onchainSupported: true,
    countryShippedFrom: "Canada",
    countryMadeIn: "Canada",
    reviews: []
  },
  {
    id: "5",
    name: "Start9",
    description: "Sovereign computing made simple. Your own private server for data and communications.",
    logo: "/assets/start9-logo.png",
    categories: ["Electronics", "Hosting"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://start9.com",
    lightningSupported: true,
    onchainSupported: true,
    countryShippedFrom: "USA",
    countryMadeIn: "USA",
    reviews: []
  },
  {
    id: "6",
    name: "Trezor",
    description: "The original Bitcoin hardware wallet. Secure your coins with ease.",
    logo: "/assets/trezor-logo.png",
    categories: ["Electronics"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://trezor.io",
    lightningSupported: false,
    onchainSupported: true,
    countryShippedFrom: "Czech Republic",
    reviews: []
  },
  {
    id: "7",
    name: "BTCPay Server",
    description: "Free and open-source Bitcoin payment processor. Self-host your payments.",
    logo: "/assets/btcpayserver-logo.png",
    categories: ["Charity"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://btcpayserver.org",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "8",
    name: "Foundation Devices",
    description: "Bitcoin hardware that respects your rights. Makers of Passport.",
    logo: "/assets/foundation-logo.png",
    categories: ["Electronics"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://foundationdevices.com",
    lightningSupported: true,
    onchainSupported: true,
    countryShippedFrom: "USA",
    countryMadeIn: "USA",
    reviews: []
  },
  {
    id: "9",
    name: "Orange Pill App",
    description: "Social network for Bitcoiners. Find events and connect with local plebs.",
    logo: "/assets/orangepill-logo.png",
    categories: ["Lifestyle"],
    shippingCountries: ["🌍 Worldwide"],
    website: "https://theorangepillapp.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "10",
    name: "River",
    description: "Bitcoin exchange and custody. Buy, sell, and manage your Bitcoin.",
    logo: "/assets/river-logo.png",
    categories: ["Lifestyle"],
    shippingCountries: ["🇺🇸 USA"],
    website: "https://river.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  }
];
