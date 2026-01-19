// Biome/Geography system for different train routes

export type BiomeType =
  | 'temperate_forest'    // Europe, Northeast US
  | 'alpine'              // Switzerland, Alps
  | 'mediterranean'       // Spain, Italy coast
  | 'cherry_blossom'      // Japan
  | 'siberian'            // Trans-Siberian, Russia
  | 'tropical'            // India, Southeast Asia
  | 'coastal'             // Australia, seaside routes
  | 'urban_corridor'      // Dense urban areas
  | 'plains'              // Flat agricultural land
  | 'desert'              // Arid regions
  | 'nordic';             // Scandinavia

export interface BiomeConfig {
  type: BiomeType;
  name: string;
  skyGradient: {
    top: string;
    middle: string;
    bottom: string;
  };
  sunsetGradient: {
    top: string;
    middle: string;
    bottom: string;
  };
  mountainColors: string[];
  hillColors: string[];
  treeTypes: ('pine' | 'oak' | 'cherry' | 'birch' | 'palm' | 'cactus')[];
  treeColors: string[];
  groundColors: string[];
  hasSnow: boolean;
  hasWater: boolean;
  specialElements?: ('sakura' | 'windmill' | 'pagoda' | 'vineyard' | 'rice_field' | 'city_skyline')[];
}

export const biomes: Record<BiomeType, BiomeConfig> = {
  temperate_forest: {
    type: 'temperate_forest',
    name: 'Temperate Forest',
    skyGradient: { top: '#87CEEB', middle: '#B0E2FF', bottom: '#E0F4FF' },
    sunsetGradient: { top: '#2C3E50', middle: '#E74C3C', bottom: '#F39C12' },
    mountainColors: ['#4A5568', '#5A6578', '#6A7588'],
    hillColors: ['#22543D', '#276749', '#2F855A'],
    treeTypes: ['oak', 'pine', 'birch'],
    treeColors: ['#1B4332', '#2D6A4F', '#40916C'],
    groundColors: ['#228B22', '#32CD32', '#3CB371'],
    hasSnow: false,
    hasWater: false,
  },
  alpine: {
    type: 'alpine',
    name: 'Alpine Mountains',
    skyGradient: { top: '#4A90D9', middle: '#87CEEB', bottom: '#E8F4FF' },
    sunsetGradient: { top: '#1A365D', middle: '#C53030', bottom: '#ED8936' },
    mountainColors: ['#718096', '#A0AEC0', '#E2E8F0'],
    hillColors: ['#276749', '#38A169', '#68D391'],
    treeTypes: ['pine'],
    treeColors: ['#1A472A', '#234E3A', '#2D5A4A'],
    groundColors: ['#48BB78', '#68D391', '#9AE6B4'],
    hasSnow: true,
    hasWater: false,
    specialElements: ['windmill'],
  },
  mediterranean: {
    type: 'mediterranean',
    name: 'Mediterranean Coast',
    skyGradient: { top: '#1E90FF', middle: '#87CEEB', bottom: '#E0F7FF' },
    sunsetGradient: { top: '#2C3E50', middle: '#E67E22', bottom: '#F1C40F' },
    mountainColors: ['#8B7355', '#A68B64', '#C4A87C'],
    hillColors: ['#808000', '#9ACD32', '#BDB76B'],
    treeTypes: ['oak', 'pine'],
    treeColors: ['#556B2F', '#6B8E23', '#8FBC8F'],
    groundColors: ['#DEB887', '#D2B48C', '#F5DEB3'],
    hasSnow: false,
    hasWater: true,
    specialElements: ['vineyard'],
  },
  cherry_blossom: {
    type: 'cherry_blossom',
    name: 'Japanese Countryside',
    skyGradient: { top: '#87CEEB', middle: '#FFE4E1', bottom: '#FFF0F5' },
    sunsetGradient: { top: '#4A5568', middle: '#ED64A6', bottom: '#FBB6CE' },
    mountainColors: ['#5A6C8A', '#7A8CAA', '#9AACCA'],
    hillColors: ['#38A169', '#48BB78', '#68D391'],
    treeTypes: ['cherry', 'pine'],
    treeColors: ['#FFB7C5', '#FF69B4', '#2F855A'],
    groundColors: ['#68D391', '#9AE6B4', '#C6F6D5'],
    hasSnow: false,
    hasWater: false,
    specialElements: ['sakura', 'pagoda'],
  },
  siberian: {
    type: 'siberian',
    name: 'Siberian Taiga',
    skyGradient: { top: '#A0AEC0', middle: '#CBD5E0', bottom: '#E2E8F0' },
    sunsetGradient: { top: '#1A365D', middle: '#553C9A', bottom: '#F56565' },
    mountainColors: ['#4A5568', '#718096', '#A0AEC0'],
    hillColors: ['#234E52', '#285E61', '#2C7A7B'],
    treeTypes: ['pine', 'birch'],
    treeColors: ['#1A3A3A', '#234E4E', '#2D6A6A'],
    groundColors: ['#E2E8F0', '#CBD5E0', '#A0AEC0'],
    hasSnow: true,
    hasWater: false,
  },
  tropical: {
    type: 'tropical',
    name: 'Tropical Landscape',
    skyGradient: { top: '#00CED1', middle: '#7FFFD4', bottom: '#98FB98' },
    sunsetGradient: { top: '#2C3E50', middle: '#9B59B6', bottom: '#E74C3C' },
    mountainColors: ['#2F4F4F', '#3E6363', '#4D7777'],
    hillColors: ['#006400', '#228B22', '#32CD32'],
    treeTypes: ['palm', 'oak'],
    treeColors: ['#006400', '#228B22', '#32CD32'],
    groundColors: ['#228B22', '#32CD32', '#7CFC00'],
    hasSnow: false,
    hasWater: true,
    specialElements: ['rice_field'],
  },
  coastal: {
    type: 'coastal',
    name: 'Coastal Views',
    skyGradient: { top: '#00BFFF', middle: '#87CEEB', bottom: '#E0FFFF' },
    sunsetGradient: { top: '#191970', middle: '#FF6347', bottom: '#FFD700' },
    mountainColors: ['#708090', '#778899', '#87CEEB'],
    hillColors: ['#3CB371', '#2E8B57', '#228B22'],
    treeTypes: ['palm', 'oak'],
    treeColors: ['#228B22', '#2E8B57', '#3CB371'],
    groundColors: ['#F0E68C', '#EEE8AA', '#FAFAD2'],
    hasSnow: false,
    hasWater: true,
  },
  urban_corridor: {
    type: 'urban_corridor',
    name: 'Urban Corridor',
    skyGradient: { top: '#6B7280', middle: '#9CA3AF', bottom: '#D1D5DB' },
    sunsetGradient: { top: '#1F2937', middle: '#7C3AED', bottom: '#F59E0B' },
    mountainColors: ['#4B5563', '#6B7280', '#9CA3AF'],
    hillColors: ['#374151', '#4B5563', '#6B7280'],
    treeTypes: ['oak'],
    treeColors: ['#374151', '#4B5563', '#065F46'],
    groundColors: ['#6B7280', '#9CA3AF', '#D1D5DB'],
    hasSnow: false,
    hasWater: false,
    specialElements: ['city_skyline'],
  },
  plains: {
    type: 'plains',
    name: 'Open Plains',
    skyGradient: { top: '#87CEEB', middle: '#B0E2FF', bottom: '#F0F8FF' },
    sunsetGradient: { top: '#2C3E50', middle: '#E74C3C', bottom: '#F39C12' },
    mountainColors: [],
    hillColors: ['#6B8E23', '#9ACD32', '#BDB76B'],
    treeTypes: ['oak'],
    treeColors: ['#556B2F', '#6B8E23', '#808000'],
    groundColors: ['#DAA520', '#F0E68C', '#FFFACD'],
    hasSnow: false,
    hasWater: false,
    specialElements: ['windmill'],
  },
  desert: {
    type: 'desert',
    name: 'Desert Landscape',
    skyGradient: { top: '#87CEEB', middle: '#F0E68C', bottom: '#FFE4B5' },
    sunsetGradient: { top: '#4A1A2C', middle: '#C0392B', bottom: '#F39C12' },
    mountainColors: ['#CD853F', '#DEB887', '#F5DEB3'],
    hillColors: ['#D2691E', '#CD853F', '#DEB887'],
    treeTypes: ['cactus'],
    treeColors: ['#228B22', '#2E8B57', '#3CB371'],
    groundColors: ['#EDC9AF', '#DEB887', '#F5DEB3'],
    hasSnow: false,
    hasWater: false,
  },
  nordic: {
    type: 'nordic',
    name: 'Nordic Landscape',
    skyGradient: { top: '#4A6572', middle: '#8DA3B0', bottom: '#C8D6DE' },
    sunsetGradient: { top: '#1E3A5F', middle: '#4A6572', bottom: '#87CEEB' },
    mountainColors: ['#5A6B7C', '#7A8B9C', '#9AABBC'],
    hillColors: ['#2F4F4F', '#3E6363', '#4D7777'],
    treeTypes: ['pine', 'birch'],
    treeColors: ['#1A3A3A', '#2D5050', '#406666'],
    groundColors: ['#4F6F6F', '#5F7F7F', '#6F8F8F'],
    hasSnow: true,
    hasWater: true,
  },
};

// Determine biome based on route stations
export function getBiomeForRoute(fromCountryCode: string, toCountryCode: string): BiomeType {
  const countries = [fromCountryCode, toCountryCode];

  // Japan
  if (countries.includes('JP')) {
    return 'cherry_blossom';
  }

  // Russia / Trans-Siberian
  if (countries.includes('RU')) {
    return 'siberian';
  }

  // India
  if (countries.includes('IN')) {
    return 'tropical';
  }

  // China
  if (countries.includes('CN')) {
    return 'urban_corridor';
  }

  // Australia
  if (countries.includes('AU')) {
    return 'coastal';
  }

  // Switzerland or Austria (Alpine)
  if (countries.includes('CH') || countries.includes('AT')) {
    return 'alpine';
  }

  // Spain or Italy
  if (countries.includes('ES') || countries.includes('IT')) {
    return 'mediterranean';
  }

  // USA
  if (countries.includes('US')) {
    return 'urban_corridor';
  }

  // UK, France, Germany, Netherlands, Belgium (Temperate)
  if (['GB', 'FR', 'DE', 'NL', 'BE'].some(c => countries.includes(c))) {
    return 'temperate_forest';
  }

  // Default
  return 'temperate_forest';
}

// Get biome config for a route
export function getBiomeConfig(fromCountryCode: string, toCountryCode: string): BiomeConfig {
  const biomeType = getBiomeForRoute(fromCountryCode, toCountryCode);
  return biomes[biomeType];
}
