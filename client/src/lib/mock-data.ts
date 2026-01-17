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
  "Art",
  "Charity"
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
    logo: "/assets/bitrefill-logo.png",
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
    name: "SLNT",
    description: "Privacy-first Faraday bags and signal blocking accessories.",
    logo: "/assets/slnt-logo.png",
    categories: ["Services", "Electronics"],
    shippingCountries: ["Worldwide"],
    website: "https://slnt.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: [
      { id: "r3", authorNpub: "npub1...def", rating: 5, comment: "High quality signal blocking gear.", date: "2024-01-20" }
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
    name: "Coinkite",
    description: "Hardware wallets for Bitcoin security. Makers of Coldcard.",
    logo: "/assets/coinkite-logo.png",
    categories: ["Electronics", "Services"],
    shippingCountries: ["Worldwide"],
    website: "https://coinkite.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "5",
    name: "Start9",
    description: "Sovereign computing. Run your own personal server.",
    logo: "/assets/start9-logo.png",
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
    name: "Daylight Computer",
    description: "Building the first computer that feels like paper. The Daylight Tablet.",
    logo: "/assets/daylight-logo.png",
    categories: ["Electronics"],
    shippingCountries: ["Worldwide"],
    website: "https://daylightcomputer.com",
    lightningSupported: false,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "7",
    name: "Tor Project",
    description: "Defending your rights to privacy and freedom online. Help us keep Tor strong.",
    logo: "/assets/tor-logo-new.png",
    categories: ["Services", "Charity", "VPN & Privacy"],
    shippingCountries: ["Worldwide"],
    website: "https://torproject.org",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "8",
    name: "Namecheap",
    description: "Register domains and buy web hosting with Bitcoin. Privacy-focused domain registrar.",
    logo: "/assets/namecheap-logo.png",
    categories: ["Services", "Hosting"],
    shippingCountries: ["Worldwide"],
    website: "https://namecheap.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "9",
    name: "Human Rights Foundation",
    description: "Supporting civil society in closed societies and uniting people in the common cause of human rights.",
    logo: "/assets/hrf-logo.png",
    categories: ["Services", "Charity"],
    shippingCountries: ["Worldwide"],
    website: "https://hrf.org",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "10",
    name: "CheapAir",
    description: "Book flights and hotels with Bitcoin. One of the first travel sites to accept BTC.",
    logo: "/assets/cheapair-logo.png",
    categories: ["Services", "Travel"],
    shippingCountries: ["Worldwide"],
    website: "https://cheapair.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "11",
    name: "Travala",
    description: "Book 3,000,000+ travel products worldwide with Bitcoin and other cryptocurrencies.",
    logo: "/assets/travala-logo-new.png",
    categories: ["Services", "Travel"],
    shippingCountries: ["Worldwide"],
    website: "https://travala.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "12",
    name: "G2A",
    description: "The world's largest marketplace for digital entertainment. Buy games, gift cards, and software with Bitcoin.",
    logo: "/assets/g2a-logo-new.png",
    categories: ["Services", "Gift Cards"],
    shippingCountries: ["Worldwide"],
    website: "https://g2a.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "13",
    name: "Obscura",
    description: "High-performance VPN service built for the Bitcoin ecosystem. Privacy without compromise.",
    logo: "/assets/obscura-logo-new.png",
    categories: ["VPN & Privacy", "Services"],
    shippingCountries: ["Worldwide"],
    website: "https://obscuravpn.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "14",
    name: "Silent.link",
    description: "Anonymously purchase eSIMs with Bitcoin. Privacy-first mobile data and SMS services.",
    logo: "/assets/silent-link-logo-new.png",
    categories: ["Services", "VPN & Privacy"],
    shippingCountries: ["Worldwide"],
    website: "https://silent.link",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "15",
    name: "Great Ghee",
    description: "Handcrafted, small-batch ghee made from grass-fed butter. High-quality clarified butter for healthy cooking.",
    logo: "/assets/great-ghee-clean.png",
    categories: ["Food & Drink"],
    shippingCountries: ["USA"],
    website: "https://greatghee.com",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "16",
    name: "Great North Air Ambulance",
    description: "Life-saving charity providing emergency medical care across the North of England. Supporting their operations via Bitcoin donations.",
    logo: "/assets/gnaas-logo-new.png",
    categories: ["Charity", "Health"],
    shippingCountries: ["UK"],
    website: "https://www.greatnorthairambulance.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "17",
    name: "Castle Hill Gin",
    description: "Premium handcrafted gin distilled in the heart of Yorkshire. Traditional methods with modern botanical blends.",
    logo: "/assets/castle-hill-gin-new.png",
    categories: ["Food & Drink", "Alcohol"],
    shippingCountries: ["UK"],
    website: "https://www.castlehillgin.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "18",
    name: "Bonjour Wines",
    description: "Specialist importer of fine French wines and artisanal spirits. Discover a curated selection of exceptional vineyards.",
    logo: "/assets/bonjour-wines-new.png",
    categories: ["Food & Drink", "Alcohol"],
    shippingCountries: ["UK"],
    website: "https://www.bonjourwines.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "19",
    name: "Peony Lane Wine",
    description: "Artisan winery specializing in elegant, floral-noted wines. Experience the unique terroir of our boutique vineyards.",
    logo: "/assets/peony-lane-new.png",
    categories: ["Food & Drink", "Alcohol"],
    shippingCountries: ["USA"],
    website: "https://www.peonylanewine.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  }
];
