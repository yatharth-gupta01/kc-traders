export const productsData = [
  {
    id: 'kcm',
    name: "Kacchi Ghani Mustard Oil",
    subtitle: "Cold-Pressed & 100% Pure",
    image: "/assets/product_oil.png",
    thumbnails: [
      "/assets/product_oil.png",
      "/assets/product_filtered.png"
    ],
    description: "Extracted using traditional methods to retain natural pungency, original flavor, and health benefits of mustard seeds. Our Kacchi Ghani is unadulterated, untouched by chemicals, and rich in Monounsaturated Fatty Acids (MUFA).",
    color: "from-mustard-600 to-mustard-400",
    rating: 4.8,
    reviews: 1240,
    inStock: true,
    nutrition: {
      "Energy": "898 kcal",
      "Protein": "0g",
      "Carbohydrates": "0g",
      "Fat": "99.8g",
      "Saturated Fat": "4.1g",
      "MUFA": "70.2g",
      "PUFA": "25.5g",
      "Trans Fat": "0g",
      "Cholesterol": "0mg"
    },
    features: ["Zero Argemone Oil", "High in Omega-3 and Omega-6", "Cholesterol Free", "Strong Natural Pungency"],
    variants: [
      { id: 'kcm-500ml', size: '500ml', volume: '500ml', retailPrice: 100, wholesalePrice: 80, isBestValue: false },
      { id: 'kcm-1L', size: '1L', volume: '1L', retailPrice: 180, wholesalePrice: 140, isBestValue: false },
      { id: 'kcm-2L', size: '2L', volume: '2L', retailPrice: 350, wholesalePrice: 275, isBestValue: false },
      { id: 'kcm-5L', size: '5L', volume: '5L', retailPrice: 850, wholesalePrice: 680, isBestValue: true },
      { id: 'kcm-15L', size: '15L', volume: '15L', retailPrice: 2500, wholesalePrice: 1950, isBestValue: false }
    ]
  },
  {
    id: 'pfm',
    name: "Premium Filtered Mustard Oil",
    subtitle: "Refined for Everyday Cooking",
    image: "/assets/product_filtered.png",
    thumbnails: [
      "/assets/product_filtered.png",
      "/assets/product_oil.png"
    ],
    description: "Carefully filtered to remove impurities while preserving the essential nutrients. This variant has a lighter taste and higher smoke point, making it the perfect choice for daily household cooking and deep frying.",
    color: "from-amber-600 to-amber-400",
    rating: 4.6,
    reviews: 855,
    inStock: true,
    nutrition: {
      "Energy": "898 kcal",
      "Protein": "0g",
      "Carbohydrates": "0g",
      "Fat": "99.8g",
      "Saturated Fat": "4.5g",
      "MUFA": "65.5g",
      "PUFA": "29.8g",
      "Trans Fat": "0g",
      "Cholesterol": "0mg"
    },
    features: ["Light Golden Color", "High Smoke Point", "Triple Filtered", "Heart Healthy"],
    variants: [
      { id: 'pfm-500ml', size: '500ml', volume: '500ml', retailPrice: 90, wholesalePrice: 70, isBestValue: false },
      { id: 'pfm-1L', size: '1L', volume: '1L', retailPrice: 160, wholesalePrice: 125, isBestValue: false },
      { id: 'pfm-2L', size: '2L', volume: '2L', retailPrice: 310, wholesalePrice: 245, isBestValue: false },
      { id: 'pfm-5L', size: '5L', volume: '5L', retailPrice: 750, wholesalePrice: 600, isBestValue: true },
      { id: 'pfm-15L', size: '15L', volume: '15L', retailPrice: 2300, wholesalePrice: 1800, isBestValue: false }
    ]
  },
  {
    id: 'ym',
    name: "Yellow Mustard Oil",
    subtitle: "Mild, Sweet & Nutrient-Rich",
    image: "/assets/product_oil.png",
    thumbnails: [
      "/assets/product_oil.png"
    ],
    description: "Extracted from premium organic yellow seeds, this cold-pressed oil is milder in aroma and pungency, offering a sweet buttery flavor ideal for cooking and dressings.",
    color: "from-yellow-600 to-yellow-400",
    rating: 4.8,
    reviews: 320,
    inStock: true,
    nutrition: {
      "Energy": "898 kcal",
      "Protein": "0g",
      "Carbohydrates": "0g",
      "Fat": "99.8g",
      "Saturated Fat": "4.2g",
      "MUFA": "74.1g",
      "PUFA": "21.5g",
      "Trans Fat": "0g",
      "Cholesterol": "0mg"
    },
    features: ["Mild Pungency", "Buttery Taste", "100% Cold Pressed", "High in Omega-3"],
    variants: [
      { id: 'ym-500ml', size: '500ml', volume: '500ml', retailPrice: 110, wholesalePrice: 85, isBestValue: false },
      { id: 'ym-1L', size: '1L', volume: '1L', retailPrice: 200, wholesalePrice: 160, isBestValue: false },
      { id: 'ym-2L', size: '2L', volume: '2L', retailPrice: 390, wholesalePrice: 310, isBestValue: false },
      { id: 'ym-5L', size: '5L', volume: '5L', retailPrice: 950, wholesalePrice: 780, isBestValue: true },
      { id: 'ym-15L', size: '15L', volume: '15L', retailPrice: 2800, wholesalePrice: 2300, isBestValue: false }
    ]
  }
];
