
import { Goat, WeightRecord, HealthRecord } from '@/types/goat';

export const sampleGoats: Goat[] = [
  {
    id: 'goat-1',
    name: 'Luna',
    breed: 'Boer',
    tagNumber: 'B001',
  gender: 'female',
  sex: 'female',
    birthDate: new Date('2022-03-15'),
    color: 'White with brown head',
    status: 'active',
    hornStatus: 'disbudded',
    acquisitionType: 'born',
    breedingStatus: 'active',
    tags: ['Top Breeder'],
    isFavorite: true,
    notes: 'Excellent breeding doe with strong mothering instincts.',
    mediaFiles: [],
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date()
  },
  {
    id: 'goat-2',
    name: 'Thor',
    breed: 'Boer',
    tagNumber: 'B002',
  gender: 'male',
  sex: 'male',
    birthDate: new Date('2022-01-10'),
    color: 'Red with white markings',
    status: 'active',
    hornStatus: 'horned',
    acquisitionType: 'bought',
    breedingStatus: 'active',
    tags: ['Prime Buck'],
    isFavorite: false,
    notes: 'Strong breeding buck with excellent conformation.',
    mediaFiles: [],
    createdAt: new Date('2022-01-10'),
    updatedAt: new Date()
  },
  {
    id: 'goat-3',
    name: 'Bella',
    breed: 'Nubian',
    tagNumber: 'N001',
  gender: 'female',
  sex: 'female',
    birthDate: new Date('2023-05-20'),
    color: 'Brown and tan',
    status: 'active',
    hornStatus: 'disbudded',
    acquisitionType: 'born',
    breedingStatus: 'kid',
    tags: [],
    isFavorite: false,
    notes: 'Young doe showing good growth potential.',
    mediaFiles: [],
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date()
  }
];

export const sampleWeightRecords: WeightRecord[] = [
  {
    id: 'weight-1',
    goatId: 'goat-1',
    date: new Date('2024-01-15'),
    weight: 45.5,
    method: 'actual',
    notes: 'Good weight gain',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'weight-2',
    goatId: 'goat-2',
    date: new Date('2024-01-15'),
    weight: 85.2,
    method: 'actual',
    notes: 'Maintaining good breeding weight',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  }
];

export const sampleHealthRecords: HealthRecord[] = [
  {
    id: 'health-1',
    goatId: 'goat-1',
    date: new Date('2024-01-10'),
    type: 'vaccination',
    description: 'CDT vaccination',
    veterinarian: 'Dr. Smith',
    status: 'completed',
    nextDueDate: new Date('2025-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  },
  {
    id: 'health-2',
    goatId: 'goat-2',
    date: new Date('2024-01-12'),
    type: 'deworming',
    description: 'Routine deworming',
    medicine: 'Ivermectin',
    status: 'completed',
    nextDueDate: new Date('2024-04-12'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date()
  }
];
