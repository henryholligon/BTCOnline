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
  },
  {
    id: "20",
    name: "Yum Yum Tree Fudge",
    description: "Premium handcrafted fudge made with natural ingredients. Discover a vast array of unique and traditional flavors from this artisan confectioner.",
    logo: "/assets/yum-yum-tree-fudge-new.png",
    categories: ["Food & Drink", "Sweets"],
    shippingCountries: ["UK", "Worldwide"],
    website: "https://www.yumyumtreefudge.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "21",
    name: "Tea and Tonic",
    description: "British luxury skincare and wellness brand using high-performance adaptogens and sustainable ingredients to support body and mind.",
    logo: "/assets/tea-and-tonic-new.png",
    categories: ["Health & Beauty", "Wellness"],
    shippingCountries: ["UK", "Worldwide"],
    website: "https://www.teaandtonic.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "22",
    name: "AroTags",
    description: "Premium wood air fresheners for your car. Long-lasting, artisan-crafted scents using high-quality essential oils.",
    logo: "/assets/arotags-new.png",
    categories: ["Auto", "Lifestyle"],
    shippingCountries: ["USA", "Worldwide"],
    website: "https://www.arotags.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "23",
    name: "Spitting Feathers",
    description: "Award-winning independent brewery and pub. Crafting exceptional real ales and craft beers with a focus on quality and tradition.",
    logo: "/assets/spitting-feathers-fox.png",
    categories: ["Food & Drink", "Alcohol"],
    shippingCountries: ["UK"],
    website: "https://spittingfeathers.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "24",
    name: "Mushmore Supplements",
    description: "Premium mushroom supplements crafted for optimal wellness. Harnessing the power of functional fungi for clarity, focus, and vitality.",
    logo: "/assets/mushmore-logo.png",
    categories: ["Health & Beauty", "Wellness"],
    shippingCountries: ["USA", "Worldwide"],
    website: "https://www.mushmoresupplements.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "25",
    name: "Hummingbird Amsterdam",
    description: "Specialty coffee bar and store in the heart of Amsterdam. Discover a curated selection of coffee beans and brewing equipment.",
    logo: "/assets/hummingbird-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["Netherlands", "Europe"],
    website: "https://www.hummingbird.amsterdam/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "26",
    name: "Planet Express",
    description: "Your premier package forwarding and shipping partner. Ship from the USA to anywhere in the world with ease and reliability.",
    logo: "/assets/planet-express-logo.png",
    categories: ["Services", "Lifestyle"],
    shippingCountries: ["USA", "Worldwide"],
    website: "https://planetexpress.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "27",
    name: "Farfetch",
    description: "The global destination for modern luxury. Shop the world's best designers and boutiques for clothing, shoes, and accessories.",
    logo: "/assets/farfetch-logo.png",
    categories: ["Fashion", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://www.farfetch.com/",
    lightningSupported: false,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "28",
    name: "Bramleigh Farm",
    description: "Family-run regenerative farm in the KZN Midlands. Premium pasture-raised chicken, eggs, pork, and grass-fed beef delivered direct to your door.",
    logo: "/assets/bramleigh-logo.png",
    categories: ["Food & Drink", "Wellness"],
    shippingCountries: ["South Africa"],
    website: "https://www.bramleigh.co.za/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "29",
    name: "Oshi Good",
    description: "Specialty coffee and cafe goods. Discover premium coffee beans and accessories for the perfect home brewing experience.",
    logo: "/assets/oshigood-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["USA"],
    website: "https://www.oshigood.us/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "30",
    name: "Palingshop",
    description: "Traditional Dutch smoked eel and premium seafood delicacies delivered fresh from Volendam. Experience authentic Dutch flavors.",
    logo: "/assets/palingshop-logo.png",
    categories: ["Food & Drink"],
    shippingCountries: ["Netherlands", "Europe"],
    website: "https://www.palingshop.nl/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "31",
    name: "Ticketpro",
    description: "South Africa's leading ticketing provider for sports, concerts, and events. Book your next experience with Bitcoin.",
    logo: "/assets/ticketpro-logo.png",
    categories: ["Services", "Entertainment"],
    shippingCountries: ["South Africa"],
    website: "https://www.ticketpro.co.za/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "32",
    name: "Dynadot",
    description: "Affordable domain registration and hosting services. Manage your digital identity with ease and security.",
    logo: "/assets/dynadot-logo.png",
    categories: ["Services", "Tech"],
    shippingCountries: ["Worldwide"],
    website: "https://www.dynadot.com/",
    lightningSupported: false,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "33",
    name: "Soapminer",
    description: "Handcrafted natural soaps for Bitcoiners. High-quality ingredients and unique designs that celebrate the Bitcoin lifestyle.",
    logo: "/assets/soapminer-logo.png",
    categories: ["Health & Beauty", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://soapminer.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "34",
    name: "MobiMatter",
    description: "The best eSIM marketplace for travelers. Get instant connectivity worldwide with affordable data plans.",
    logo: "/assets/mobimatter-logo.png",
    categories: ["Services", "Travel", "Tech"],
    shippingCountries: ["Worldwide"],
    website: "https://mobimatter.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "35",
    name: "The Good Beans",
    description: "Ethically sourced, freshly roasted specialty coffee. Discover a wide variety of unique blends and single-origin beans.",
    logo: "/assets/thegoodbeans-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://thegoodbeans.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "36",
    name: "Pumphreys Coffee",
    description: "Multi-award winning coffee roasters based in the North East of England since 1750. Specialists in finest quality coffee and tea.",
    logo: "/assets/pumphreys-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["UK", "Worldwide"],
    website: "https://pumphreys-coffee.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "38",
    name: "Epic Deals",
    description: "South Africa's leading platform for pre-owned and new tech. Shop smartphones, tablets, and more with Bitcoin.",
    logo: "/assets/epicdeals-logo.png",
    categories: ["Electronics", "Tech"],
    shippingCountries: ["South Africa"],
    website: "https://epicdeals.co.za/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "39",
    name: "Farmer Bill's Provisions",
    description: "Premium, craft beef jerky and meat snacks. Ethically sourced and packed with flavor, delivered to your door.",
    logo: "/assets/farmerbills-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["USA"],
    website: "https://farmerbillsprovisions.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "40",
    name: "Acme Acres",
    description: "Pasture-raised heritage pork and poultry from a family-owned farm. Focused on ethical farming and sustainable practices.",
    logo: "/assets/acmeacres-logo.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["USA"],
    website: "https://acmeacres.us/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "41",
    name: "Chroma",
    description: "Chroma is dedicated to staying on the cutting edge of light therapy. Your support pushes forward devices designed by engineers who care deeply about health.",
    logo: "/assets/chroma-new.png",
    categories: ["Services", "Tech"],
    shippingCountries: ["Worldwide"],
    website: "https://getchroma.co/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "42",
    name: "Kawa",
    description: "Specialty coffee roastery offering unique and flavorful beans. Experience the art of Japanese-inspired coffee roasting.",
    logo: "/assets/kawa-new.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://www.u2kawa.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "43",
    name: "Kijicha",
    description: "Authentic Japanese tea and premium matcha sourced directly from growers. Experience the tradition and serenity of high-quality tea.",
    logo: "/assets/kijicha-new.png",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://kijicha.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "44",
    name: "Leeds Gin",
    description: "Premium gin hand crafted in small batches in the heart of Yorkshire. Traditional botanicals steeped with juniper, coriander, ginger and orange.",
    logo: "https://www.leedsgin.com/wp-content/uploads/elementor/thumbs/cropped-Favicon-v2-01-plyh4y2k69gla83ozhwxsz3smo2eeooufuj8remsgw.png",
    categories: ["Food & Drink", "Alcohol"],
    shippingCountries: ["UK"],
    website: "https://www.leedsgin.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "45",
    name: "ASF Tutoring",
    description: "Online Maths tutor specialising in 1-1 and small group tuition. Empowering young people to have confidence in their mathematical ability.",
    logo: "/assets/asf-tutoring-new.png",
    categories: ["Services", "Tech"],
    shippingCountries: ["Worldwide"],
    website: "https://www.asftutoring.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "46",
    name: "The Suffolk Tutor",
    description: "Personalised primary school tutoring and specialist SEND support. Qualified teacher offering one-to-one and group sessions in Maths, English, and Science.",
    logo: "https://static.wixstatic.com/media/e7f737_461ad44966af488b8bdfee9c8146a001~mv2.png/v1/fill/w_385,h_465,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/%40thesuffolktutor.png",
    categories: ["Services", "Tech"],
    shippingCountries: ["Worldwide", "UK"],
    website: "https://www.thesuffolktutor.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "47",
    name: "Jimble's Jumble",
    description: "Homemade preserves created in Northamptonshire from homegrown, wild foraged and food rescued ingredients. Small-batch jams, chutneys, and marmalades.",
    logo: "https://jimblesjumble.odoo.com/web/image/3369-f7e687f9/3-DSC_0022.webp",
    categories: ["Food & Drink", "Lifestyle"],
    shippingCountries: ["UK"],
    website: "https://jimblesjumble.odoo.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "48",
    name: "Hempful",
    description: "Premium European CBD and hemp products. High-potency, full-spectrum CBD oils, beverages, and skincare grown in the perfect climate for maximum potency.",
    logo: "/assets/hempful-new.png",
    categories: ["Food & Drink", "Wellness", "Health & Beauty"],
    shippingCountries: ["Worldwide", "UK", "Europe"],
    website: "https://hempful.eu/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "49",
    name: "Highland Fayre",
    description: "Scotland's No. 1 specialist hamper company. Luxury food and wine hampers, gift baskets, and corporate gifts delivered throughout the UK.",
    logo: "/assets/highland-fayre-new.png",
    categories: ["Food & Drink", "Alcohol", "Lifestyle"],
    shippingCountries: ["UK"],
    website: "https://www.highlandfayre.co.uk/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "50",
    name: "Golden Tallow",
    description: "Luxurious skincare powered by pure Wagyu tallow. Nutrient-rich, artisanal formulations designed to restore and elevate your natural glow.",
    logo: "/assets/golden-tallow-logo.png",
    categories: ["Health & Beauty", "Wellness", "Lifestyle"],
    shippingCountries: ["Worldwide"],
    website: "https://goldentallow.com/",
    lightningSupported: true,
    onchainSupported: true,
    reviews: []
  },
  {
    id: "51",
    name: "Mister Padel",
    description: "Italy's premier padel equipment specialist. Discover a wide selection of professional rackets, apparel, and accessories from leading brands like Nox, Bullpadel, and Adidas.",
    logo: "/assets/mister-padel-full.png",
    categories: ["Sports", "Clothing", "Lifestyle"],
    shippingCountries: ["Italy", "Europe"],
    website: "https://www.misterpadel.it/",
    lightningSupported: false,
    onchainSupported: true,
    reviews: []
  }
];
