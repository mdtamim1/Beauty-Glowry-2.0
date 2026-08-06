export interface ActiveIngredient {
  name: string;
  concentration: number;
  unit: string;
}

export interface ProductVariant {
  label: string;
  sku: string;
  stock: number;
  price: number;
}

// ─── Brand ───────────────────────────────────────────────────────────────────
export interface Brand {
  id: string;           // slug, e.g. "beauty-glowry"
  name: string;         // display name
  tagline: string;
  description: string;
  logo: string;         // URL or emoji fallback
  coverImage: string;   // hero image for brand page
  country: string;
  founded: string;
  accentColor: string;  // brand color for cards
  productCount?: number; // computed
}

export const brands: Brand[] = [
  {
    id: 'beauty-glowry',
    name: 'Beauty Glowry',
    tagline: 'Clinical Science. Visible Results.',
    description: 'Our in-house clinical skincare line, formulated by dermatologists with pharmaceutical-grade actives sourced from certified labs in South Korea and Bangladesh.',
    logo: '✦',
    coverImage: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600&auto=format&fit=crop',
    country: 'Bangladesh',
    founded: '2021',
    accentColor: '#C9956D',
  },
  {
    id: 'dermalab',
    name: 'DermaLab',
    tagline: 'Evidence-Based Dermatology',
    description: 'Precision dermatological formulations developed with clinical trial data. Every formula is backed by peer-reviewed research and independent efficacy testing.',
    logo: '◆',
    coverImage: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1600&auto=format&fit=crop',
    country: 'South Korea',
    founded: '2018',
    accentColor: '#4CAF82',
  },
  {
    id: 'pureact',
    name: 'PureAct',
    tagline: 'Clean Actives. Pure Results.',
    description: 'Minimal ingredient formulations that let high-concentration actives do the work. No fillers, no fragrance, no compromise — just clean efficacy.',
    logo: '○',
    coverImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1600&auto=format&fit=crop',
    country: 'Germany',
    founded: '2019',
    accentColor: '#60A5FA',
  },
  {
    id: 'luminos',
    name: 'Luminos',
    tagline: 'Radiance Unlocked',
    description: 'Brightening specialists. We combine melanin-targeting actives with antioxidant complexes to fade pigmentation and restore your skin\'s natural luminosity.',
    logo: '◇',
    coverImage: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1600&auto=format&fit=crop',
    country: 'France',
    founded: '2020',
    accentColor: '#F0A54B',
  },
];

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  brand: string;        // brand id (slug), e.g. "beauty-glowry"
  category: string;
  price: number;
  originalPrice: number;
  discountPrice?: number;
  image: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isBestseller: boolean;
  isNew: boolean;
  isFreeDelivery?: boolean;
  description: string;
  actives: ActiveIngredient[];
  skinTypes: string[];
  concerns: string[];
  inciList: string;
  usageSteps: string[];
  variants: ProductVariant[];
  productImages: string[];
  size: string;
  weight?: string;
  shelfLife?: string;
  madeIn?: string;
}

export const categories = [
  "Serums & Elixirs",
  "Moisturizers & Creams",
  "Toners & Essences",
  "Cleansers & Washes",
  "Sun Protection",
  "Treatments & Masks"
];

export const skinConcerns = [
  { id: 'acne', name: 'Acne & Blemishes', tag: 'Acne' },
  { id: 'aging', name: 'Aging & Fine Lines', tag: 'Aging' },
  { id: 'hydration', name: 'Dehydration & Dryness', tag: 'Hydration' },
  { id: 'brightening', name: 'Dullness & Uneven Tone', tag: 'Brightening' },
  { id: 'darkspots', name: 'Hyperpigmentation & Dark Spots', tag: 'Dark Spots' },
  { id: 'sensitive', name: 'Redness & Sensitivity', tag: 'Sensitive' },
  { id: 'pores', name: 'Enlarged Pores', tag: 'Pores' },
  { id: 'oiliness', name: 'Excess Sebum & Oiliness', tag: 'Oiliness' }
];

export const locations: Record<string, string[]> = {
  Dhaka: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar", "Ramna", "Shahbagh", "New Market", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mirpur", "Mohammadpur"],
  Chittagong: ["Chittagong Sadar", "Agrabad", "Halishahar", "Nasirabad", "Panchlaish", "Patiya"],
  Sylhet: ["Sylhet Sadar", "Beanibazar", "Golapganj", "Sreemangal"],
  Rajshahi: ["Rajshahi Sadar", "Paba", "Boalia"],
  Khulna: ["Khulna Sadar", "Daulatpur", "Khalishpur"],
  Barisal: ["Barisal Sadar", "Gournadi"],
  Rangpur: ["Rangpur Sadar", "Badarganj"],
  Mymensingh: ["Mymensingh Sadar", "Muktagachha"]
};

export const products: Product[] = [
  {
    id: 1,
    brand: 'beauty-glowry',
    name: "Niacinamide 10% + Zinc 1% Clarifying Serum",
    category: "Serums & Elixirs",
    price: 1250,
    originalPrice: 1500,
    discountPrice: 1250,
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1000&auto=format&fit=crop",
    stock: 25,
    rating: 4.9,
    reviewCount: 142,
    isBestseller: true,
    isNew: false,
    description: "High-potency dermatological serum engineered to regulate sebum synthesis, reduce blemish density, and visibly refine skin texture.",
    actives: [
      { name: "NIACINAMIDE", concentration: 10.0, unit: "%" },
      { name: "ZINC PCA", concentration: 1.0, unit: "%" },
      { name: "HYALURONIC ACID", concentration: 2.0, unit: "%" }
    ],
    skinTypes: ["Oily", "Combination", "Acne-Prone"],
    concerns: ["Acne & Blemishes", "Dullness & Uneven Tone", "Enlarged Pores"],
    inciList: "Aqua (Water), Niacinamide, Zinc PCA, Sodium Hyaluronate, Dimethyl Isosorbide, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin.",
    usageSteps: [
      "Dispense 3-4 drops onto clean palms.",
      "Gently press across face avoiding delicate eye contours.",
      "Allow 60 seconds for optimal epidermal absorption before applying moisturizer."
    ],
    variants: [
      { label: "30ml Standard Dropper", sku: "NZ-30ML", stock: 15, price: 1250 },
      { label: "60ml Value Flask", sku: "NZ-60ML", stock: 10, price: 2100 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574719394220-456b3f6b0f2a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "30ml",
    weight: "32g",
    shelfLife: "24 months (12M after opening)",
    madeIn: "South Korea"
  },
  {
    id: 2,
    brand: 'luminos',
    name: "Vitamin C 15% + Ferulic Acid Radiance Emulsion",
    category: "Serums & Elixirs",
    price: 1850,
    originalPrice: 2200,
    discountPrice: 1850,
    image: "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1000&auto=format&fit=crop",
    stock: 18,
    rating: 4.8,
    reviewCount: 98,
    isBestseller: true,
    isNew: false,
    description: "Stabilized L-Ascorbic Acid formula enhanced with Ferulic Acid and Vitamin E for potent antioxidant defence and dark spot fading.",
    actives: [
      { name: "L-ASCORBIC ACID", concentration: 15.0, unit: "%" },
      { name: "FERULIC ACID", concentration: 0.5, unit: "%" },
      { name: "TOCOPHEROL", concentration: 1.0, unit: "%" }
    ],
    skinTypes: ["Normal", "Dry", "Combination"],
    concerns: ["Dullness & Uneven Tone", "Hyperpigmentation & Dark Spots", "Aging & Fine Lines"],
    inciList: "Water, Ascorbic Acid, Ethoxydiglycol, Tocopherol, Ferulic Acid, Glycerin, Sodium Hyaluronate, Panthenol, Triethanolamine.",
    usageSteps: [
      "Apply 4 drops to dry face every AM after cleansing.",
      "Follow immediately with a broad-spectrum SPF 50 sunscreen."
    ],
    variants: [
      { label: "30ml UV Amber Bottle", sku: "VC-30ML", stock: 18, price: 1850 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "30ml",
    weight: "34g",
    shelfLife: "24 months (12M after opening)",
    madeIn: "Bangladesh"
  },
  {
    id: 3,
    brand: 'dermalab',
    name: "Centella Asiatica 84% Soothing Repair Essence",
    category: "Toners & Essences",
    price: 950,
    originalPrice: 1100,
    discountPrice: 950,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1000&auto=format&fit=crop",
    stock: 32,
    rating: 4.7,
    reviewCount: 64,
    isBestseller: false,
    isNew: true,
    description: "Pure Madagascar Centella extract concentrate designed to repair compromised skin barriers, calm inflammation, and restore hydration levels.",
    actives: [
      { name: "CENTELLA ASIATICA", concentration: 84.0, unit: "%" },
      { name: "MADECASSOSIDE", concentration: 0.5, unit: "%" },
      { name: "PANTHENOL B5", concentration: 3.0, unit: "%" }
    ],
    skinTypes: ["Sensitive", "Dry", "Redness-Prone"],
    concerns: ["Redness & Sensitivity", "Dehydration & Dryness", "Compromised Barrier"],
    inciList: "Centella Asiatica Extract, Water, Butylene Glycol, Glycerin, 1,2-Hexanediol, Panthenol, Madecassoside, Ethylhexylglycerin.",
    usageSteps: [
      "Pour a moderate amount onto palms.",
      "Pat gently into face until completely absorbed. Layer 2-3 times for intense recovery."
    ],
    variants: [
      { label: "100ml Glass Decanter", sku: "CA-100ML", stock: 32, price: 950 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "100ml",
    weight: "105g",
    shelfLife: "18 months (6M after opening)",
    madeIn: "South Korea"
  },
  {
    id: 4,
    brand: 'pureact',
    name: "Salicylic Acid 2% Deep Pore Cleansing Gel",
    category: "Cleansers & Washes",
    price: 750,
    originalPrice: 900,
    discountPrice: 750,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=1000&auto=format&fit=crop",
    stock: 40,
    rating: 4.9,
    reviewCount: 110,
    isBestseller: true,
    isNew: false,
    description: "Beta-hydroxy acid cleanser formulated at optimal pH 3.8 to dissolve pore-clogging sebum and cellular debris without hydration loss.",
    actives: [
      { name: "SALICYLIC ACID (BHA)", concentration: 2.0, unit: "%" },
      { name: "TEA TREE FLAVONOIDS", concentration: 0.5, unit: "%" },
      { name: "ALLANTOIN", concentration: 1.0, unit: "%" }
    ],
    skinTypes: ["Oily", "Combination", "Acne-Prone"],
    concerns: ["Acne & Blemishes", "Blackheads & Pores", "Excess Sebum"],
    inciList: "Water, Sodium Lauroyl Methyl Isethionate, Cocamidopropyl Betaine, Salicylic Acid, Glycerin, Melaleuca Alternifolia Leaf Oil, Allantoin, Citric Acid.",
    usageSteps: [
      "Massage 1 pump onto damp face for 60 seconds to allow BHA penetration.",
      "Rinse thoroughly with lukewarm water."
    ],
    variants: [
      { label: "150ml Pump Bottle", sku: "SA-150ML", stock: 40, price: 750 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "150ml",
    weight: "160g",
    shelfLife: "24 months (6M after opening)",
    madeIn: "Bangladesh"
  },
  {
    id: 5,
    brand: 'dermalab',
    name: "Ceramide 3% + Hyaluronic Matrix Barrier Cream",
    category: "Moisturizers & Creams",
    price: 1650,
    originalPrice: 1900,
    discountPrice: 1650,
    image: "https://images.unsplash.com/photo-1608248597309-45da1707ad33?q=80&w=1000&auto=format&fit=crop",
    stock: 20,
    rating: 4.9,
    reviewCount: 88,
    isBestseller: false,
    isNew: true,
    description: "Dermatologist-recommended lipid recovery cream featuring bio-identical Ceramides 1, 3, 6-II to lock in moisture and reinforce lipid barrier.",
    actives: [
      { name: "CERAMIDE COMPLEX", concentration: 3.0, unit: "%" },
      { name: "MULTIWAVE HA", concentration: 2.5, unit: "%" },
      { name: "SQUALANE", concentration: 5.0, unit: "%" }
    ],
    skinTypes: ["Dry", "Sensitive", "Dehydrated"],
    concerns: ["Dehydration & Dryness", "Compromised Barrier", "Redness & Sensitivity"],
    inciList: "Aqua, Squalane, Ceramide NP, Ceramide AP, Ceramide EOP, Phytosphingosine, Cholesterol, Sodium Hyaluronate, Glycerin, Cetearyl Alcohol.",
    usageSteps: [
      "Smooth a pea-sized amount over face and neck as final step in PM routine."
    ],
    variants: [
      { label: "50ml Airless Jar", sku: "CC-50ML", stock: 20, price: 1650 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1608248597309-45da1707ad33?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "50ml",
    weight: "55g",
    shelfLife: "24 months (12M after opening)",
    madeIn: "South Korea"
  },
  {
    id: 6,
    brand: 'beauty-glowry',
    name: "Hyaluronic Acid 2% + B5 Intense Hydration Serum",
    category: "Serums & Elixirs",
    price: 1150,
    originalPrice: 1400,
    discountPrice: 1150,
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1000&auto=format&fit=crop",
    stock: 30,
    rating: 4.8,
    reviewCount: 76,
    isBestseller: true,
    isNew: false,
    description: "Triple-molecular weight Hyaluronic Acid complex combined with Pro-Vitamin B5 for multi-depth epidermal hydration and plumping.",
    actives: [
      { name: "HYALURONIC ACID (TRIPLE)", concentration: 2.0, unit: "%" },
      { name: "PRO-VITAMIN B5", concentration: 5.0, unit: "%" }
    ],
    skinTypes: ["All Skin Types", "Dehydrated"],
    concerns: ["Dehydration & Dryness", "Fine Lines", "Dullness"],
    inciList: "Aqua, Sodium Hyaluronate, Panthenol, Pentylene Glycol, Propanediol, Sodium Hyaluronate Crosspolymer, Hydrolyzed Hyaluronic Acid, Ethylhexylglycerin.",
    usageSteps: [
      "Apply 3 drops to slightly damp skin AM and PM before oil-based products."
    ],
    variants: [
      { label: "30ml Dropper Bottle", sku: "HA-30ML", stock: 30, price: 1150 }
    ],
    productImages: [
      "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1000&auto=format&fit=crop"
    ],
    size: "30ml",
    weight: "32g",
    shelfLife: "24 months (12M after opening)",
    madeIn: "Bangladesh"
  }
];
