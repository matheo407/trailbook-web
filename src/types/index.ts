export type Difficulty = 'facile' | 'moyen' | 'difficile';
export type HikeStatus = 'faite' | 'planifiée';
export type StopType = 'repas' | 'repos' | 'bivouac' | 'point_de_vue' | 'autre';
export type GearCategory = 'vêtements' | 'nourriture' | 'équipement' | 'sécurité' | 'navigation' | 'autre';

export interface Coordinate {
  lat: number;
  lng: number;
  ele?: number;
}

export interface Companion {
  id: string;
  name: string;
  photo?: string;
  createdAt: string;
}

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  photo?: string;
  notes?: string;
  weight?: number;
  createdAt: string;
}

export interface HikeGearItem {
  gearId: string;
  packed: boolean;
}

export interface Stop {
  id: string;
  hikeId: string;
  name: string;
  type: StopType;
  notes?: string;
  coordinate?: Coordinate;
  order: number;
  mealDetails?: string;
  journal?: string;
}

export interface NamedLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface Hike {
  id: string;
  name: string;
  description?: string;
  status: HikeStatus;
  date?: string;
  duration?: number;
  distance?: number;
  elevation?: number;
  difficulty?: Difficulty;
  photos: string[];
  companionIds: string[];
  route: Coordinate[];
  comments?: string;
  rating?: number;
  region?: string;
  gear: HikeGearItem[];
  departureLocation?: NamedLocation;
  arrivalLocation?: NamedLocation;
  tags: string[];
  createdAt: string;
}
