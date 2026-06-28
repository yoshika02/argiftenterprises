export const categories = [
  {
    id: 'anime-figurines',
    name: 'Anime Figurines',
    description: 'Masterfully crafted 1/7 scale figures featuring dynamic poses, vibrant coloring, and hand-finished details.',
    image: '/images/cyber_valkyrie.png',
    active: true
  },
  {
    id: 'ar-gift-collection',
    name: 'A.R. Gift Collection',
    description: 'Premium wholesale toy collections and custom enterprise solutions.',
    image: '/images/cyber_valkyrie.png',
    active: true
  },
  {
    id: 'action-figures',
    name: 'Articulated Action Figures',
    description: 'Fully posable premium action figures with heavy metal joints, custom weaponry, and interchangeable parts.',
    image: '/images/aeronaut_captain.png',
    active: false,
    comingSoon: true
  },
  {
    id: 'designer-toys',
    name: 'Designer Plush & Vinyl',
    description: 'Limited edition art toys, soft plush collectibles, and vinyl figurines designed by leading industry artists.',
    image: '/images/mage_emperor.png',
    active: false,
    comingSoon: true
  }
];

const staticProducts = [];

const productMetadata = {
  "1001": { name: "TANJIRO", size: "15CM", price: "130" },
  "1002": { name: "NEZUKO", size: "15CM", price: "130" },
  "1003": { name: "ZENITSU", size: "15CM", price: "130" },
  "1004": { name: "INOSUKE", size: "15CM", price: "130" },
  "1005": { name: "INOSUKE", size: "15CM", price: "130" },
  "1006": { name: "SHINOBU KOCHO", size: "15CM", price: "130" },
  "1007": { name: "WITH STICK", size: "23CM", price: "200" },
  "1008": { name: "GOKU POWER", size: "19CM", price: "200" },
  "1009": { name: "DEADPOOL PK3", size: "N/A", price: "165" },
  "1010": { name: "NEW DEADPOOL PK3", size: "N/A", price: "180" },
  "1011": { name: "TOM AND JERRY", size: "N/A", price: "130" },
  "1012": { name: "JLL WITH BALLOON", size: "N/A", price: "75" },
  "1013": { name: "CAR DRIFT", size: "N/A", price: "150" },
  "1014": { name: "BLACK TANJIRO", size: "N/A", price: "150" },
  "1015": { name: "LUFFY", size: "21CM", price: "300" },
  "1016": { name: "RED KISS", size: "21CM", price: "125" },
  "1017": { name: "GOKU AIR", size: "21CM", price: "380" },
  "1018": { name: "ITACHI", size: "21CM", price: "270" },
  "1019": { name: "MARVEL SET4", size: "9CM", price: "150" },
  "1020": { name: "DBZ SET6", size: "17CM", price: "750" },
  "1021": { name: "DEMON SLAYER SET6", size: "15CM", price: "700" },
  "1022": { name: "AKAZA NO BOX", size: "18CM", price: "250" },
  "1023": { name: "RENGOKU", size: "16CM", price: "150" },
  "1024": { name: "MITSURI", size: "16CM", price: "150" },
  "1025": { name: "SANEMI", size: "16CM", price: "150" },
  "1026": { name: "GOJO", size: "19CM", price: "230" },
  "1027": { name: "FIRE", size: "16CM", price: "320" },
  "1028": { name: "VEGETA", size: "N/A", price: "200" },
  "1029": { name: "GOKU", size: "N/A", price: "200" },
  "1030": { name: "SPARK", size: "17CM", price: "210" },
  "1031": { name: "SAIYAN", size: "15CM", price: "270" },
  "1032": { name: "ZORO 9S", size: "16CM", price: "320" },
  "1033": { name: "NARUTO SET6", size: "16CM", price: "900" },
  "1034": { name: "AIR GOGETA", size: "22CM", price: "260" },
  "1035": { name: "GOKU SILVER NO BOX", size: "22CM", price: "370" },
  "1036": { name: "AIR GOKU YELLOW NO BOX", size: "20CM", price: "370" },
  "1037": { name: "ATTACK ON TITAN", size: "15CM", price: "220" },
  "1038": { name: "ATTACK ON TITAN", size: "16CM", price: "150" },
  "1039": { name: "SUKUNA STANDING NO BOX", size: "20CM", price: "450" },
  "1040": { name: "SMALL JOKER NO BOX", size: "10CM", price: "155" }
};

const generatedProducts = Array.from({ length: 24 }).flatMap((_, i) => {
  const pageNum = String(i + 3).padStart(4, '0');
  const imageUrl = `./ilovepdf_pages-to-jpg/A.R%20ENTERPRISES%20WHOLESALE_pages-to-jpg-${pageNum}.jpg`;
  
  const idTop = String(1001 + (i * 2));
  const idBottom = String(1002 + (i * 2));
  
  const topData = productMetadata[idTop] || { name: `Figure ${idTop}`, size: "Assorted", price: "TBD" };
  const bottomData = productMetadata[idBottom] || { name: `Figure ${idBottom}`, size: "Assorted", price: "TBD" };

  return [
    {
      id: `ar-wholesale-${idTop}`,
      categoryId: 'ar-gift-collection',
      name: topData.name,
      scale: topData.size,
      material: 'Premium PVC/ABS',
      dimensions: topData.size,
      releaseDate: 'Available Now',
      description: `Size: ${topData.size} | Price: ₹${topData.price}`,
      features: ['Highly detailed sculpt', 'Vibrant paint application', 'Official wholesale packaging'],
      image: imageUrl,
      cropClass: 'crop-top'
    },
    {
      id: `ar-wholesale-${idBottom}`,
      categoryId: 'ar-gift-collection',
      name: bottomData.name,
      scale: bottomData.size,
      material: 'Premium PVC/ABS',
      dimensions: bottomData.size,
      releaseDate: 'Available Now',
      description: `Size: ${bottomData.size} | Price: ₹${bottomData.price}`,
      features: ['Highly detailed sculpt', 'Vibrant paint application', 'Official wholesale packaging'],
      image: imageUrl,
      cropClass: 'crop-bottom'
    }
  ];
});

export const products = [...staticProducts, ...generatedProducts];

