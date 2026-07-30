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
  { id: 'sensitive', name: 'Redness & Sensitivity', tag: 'Sensitive' }
];

export const locations = {
  Dhaka: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar", "Ramna", "Shahbagh", "New Market", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mirpur", "Mohammadpur"],
  Chittagong: ["Chittagong Sadar", "Agrabad", "Halishahar", "Nasirabad", "Panchlaish", "Patiya"],
  Sylhet: ["Sylhet Sadar", "Beanibazar", "Golapganj", "Sreemangal"],
  Rajshahi: ["Rajshahi Sadar", "Paba", "Boalia"],
  Khulna: ["Khulna Sadar", "Daulatpur", "Khalishpur"],
  Barisal: ["Barisal Sadar", "Gournadi"],
  Rangpur: ["Rangpur Sadar", "Badarganj"],
  Mymensingh: ["Mymensingh Sadar", "Muktagachha"]
};

export const products = [
  {
    id: 1,
    name: "Niacinamide 10% + Zinc 1% Clarifying Serum",
    category: "Serums & Elixirs",
    price: 1250,
    originalPrice: 1500,
    discountPrice: 1250,
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7abe71a9?q=80&w=1000&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1601049541289-9b1b7abe71a9?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574719394220-456b3f6b0f2a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop"
    ]
  },
  {
    id: 2,
    name: "Vitamin C 15% + Ferulic Acid Radiance Emulsion",
    category: "Serums & Elixirs",
    price: 1850,
    originalPrice: 2200,
    discountPrice: 1850,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612198188060-c7d8ce72a67e?q=80&w=1000&auto=format&fit=crop"
    ]
  },
  {
    id: 3,
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
    ]
  },
  {
    id: 4,
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
    ]
  },
  {
    id: 5,
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
    ]
  },
  {
    id: 6,
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
    ]
  }
];
