export interface MediaFile {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'video' | 'document';
  size: number;
  createdAt: Date;
  goatId?: string;
  url?: string;
  primary?: boolean;
  filename?: string;
  uploadDate?: string | Date;
  timestamp?: string | Date;
  category?: 'birth' | 'health' | 'growth' | 'breeding' | 'general' | 'milestone' | 'weaning';
  tags?: string[];
  description?: string;
  thumbnailUrl?: string;
}

export interface MediaUploadProgress {
  fileName: string;
  progress: number;
  total: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface MediaGalleryConfig {
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export interface Goat {
  id: string;
  name: string;
  tagNumber: string;
  breed: string;
  birthDate: Date;
  birthWeight?: number;
  gender: 'male' | 'female';
  sex?: 'male' | 'female';
  castrated?: boolean;
  status: 'active' | 'sold' | 'deceased' | 'archived';
  breedingStatus: '' | 'pregnant' | 'lactating' | 'resting' | 'kid' | 'active' | 'not_breeding';
  fatherId?: string;
  motherId?: string;
  color?: string;
  markings?: string;
  hornStatus?: 'horned' | 'polled' | 'disbudded';
  currentWeight?: number;
  isFavorite?: boolean;
  notes?: string;
  tags?: string[];
  acquisitionType?: 'born' | 'bought' | 'gifted' | 'rented';
  farmId?: string;
  partition?: string;
  shedId?: string;
  partitionId?: string;
  pastureId?: string;
  imageId?: string;
  photoPath?: string;
  mediaFiles?: MediaFile[];
  genetics?: {
    coatColor?: string;
    hornStatus?: 'horned' | 'polled' | 'disbudded';
    fertilityScore?: number;
    milkYieldGenetics?: number;
    hornGenotype?: 'PP' | 'Ph' | 'hh';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightRecord {
  id: string;
  goatId: string;
  weight: number;
  date: Date;
  method: 'actual' | 'estimated';
  chestGirth?: number;
  bodyLength?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthRecord {
  id: string;
  goatId: string;
  type: 'vaccination' | 'treatment' | 'checkup' | 'medication' | 'injury' | 'illness' | 'deworming';
  description: string;
  date: Date;
  nextDueDate?: Date;
  cost?: number;
  veterinarian?: string;
  medications?: string;
  medicine?: string;
  treatment?: string;
  notes?: string;
  status: 'completed' | 'scheduled' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
}

export interface Feed {
  id: string;
  name: string;
  type: 'grass' | 'hay' | 'grain' | 'pellets' | 'supplement' | 'mineral' | 'other';
  brand?: string;
  protein?: number;
  fiber?: number;
  cost?: number;
  costPerKg?: number;
  stockKg?: number;
  expiryDate?: Date;
  unit?: string;
  supplier?: string;
  notes?: string;
  nutritionalInfo?: {
    protein: number;
    fiber: number;
    fat: number;
    calcium: number;
    phosphorus: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedPlan {
  id: string;
  name: string;
  description?: string;
  goatIds: string[];
  feeds: FeedPlanItem[];
  groupType?: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  totalCostPerDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedPlanItem {
  feedId: string;
  amount: number;
  amountPerDay?: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timesPerDay?: number;
}

export interface FeedLog {
  id: string;
  goatId: string;
  feedId: string;
  amountUsed?: number;
  unit: string;
  date: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
}

export interface KnownFarmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
