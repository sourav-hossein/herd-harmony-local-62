import { Goat, WeightRecord, HealthRecord } from '@herd-harmony/shared-types/goat';
import { FinanceRecord } from '@herd-harmony/shared-types/finance';
import { v4 as uuidv4 } from 'uuid';

export interface BulkValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface BulkValidationResult {
  valid: boolean;
  errors: BulkValidationError[];
  warnings: BulkValidationError[];
}

export interface BulkImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: BulkValidationError[];
  data: any[];
}

export class BulkService {
  static validateGoatData(data: any[], existingGoats: Goat[]): BulkValidationResult {
    const errors: BulkValidationError[] = [];
    const warnings: BulkValidationError[] = [];
    const existingTags = new Set(existingGoats.map(g => g.tagNumber.toLowerCase()));

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.name?.trim()) {
        errors.push({ row: rowNum, field: 'name', value: row.name, message: 'Name is required' });
      }
      if (!row.tagNumber?.trim()) {
        errors.push({ row: rowNum, field: 'tagNumber', value: row.tagNumber, message: 'Tag number is required' });
      } else if (existingTags.has(row.tagNumber.toLowerCase())) {
        errors.push({ row: rowNum, field: 'tagNumber', value: row.tagNumber, message: 'Tag number already exists' });
      }
      if (!row.breed?.trim()) {
        errors.push({ row: rowNum, field: 'breed', value: row.breed, message: 'Breed is required' });
      }
      if (!row.gender || !['male', 'female'].includes(row.gender.toLowerCase())) {
        errors.push({ row: rowNum, field: 'gender', value: row.gender, message: 'Gender must be "male" or "female"' });
      }

      // Date validation
      if (row.birthDate) {
        const date = new Date(row.birthDate);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNum, field: 'birthDate', value: row.birthDate, message: 'Invalid birth date' });
        } else if (date > new Date()) {
          errors.push({ row: rowNum, field: 'birthDate', value: row.birthDate, message: 'Birth date cannot be in the future' });
        }
      }

      // Weight validation
      if (row.birthWeight && (isNaN(Number(row.birthWeight)) || Number(row.birthWeight) <= 0)) {
        errors.push({ row: rowNum, field: 'birthWeight', value: row.birthWeight, message: 'Birth weight must be a positive number' });
      }

      // Status validation
      if (row.status && !['active', 'sold', 'deceased', 'archived'].includes(row.status)) {
        warnings.push({ row: rowNum, field: 'status', value: row.status, message: 'Invalid status, will default to "active"' });
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  static validateWeightData(data: any[], existingGoats: Goat[]): BulkValidationResult {
    const errors: BulkValidationError[] = [];
    const warnings: BulkValidationError[] = [];
    const goatTags = new Set(existingGoats.map(g => g.tagNumber.toLowerCase()));

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.goatTag?.trim()) {
        errors.push({ row: rowNum, field: 'goatTag', value: row.goatTag, message: 'Goat tag is required' });
      } else if (!goatTags.has(row.goatTag.toLowerCase())) {
        errors.push({ row: rowNum, field: 'goatTag', value: row.goatTag, message: 'Goat tag not found' });
      }

      if (!row.weight || isNaN(Number(row.weight)) || Number(row.weight) <= 0) {
        errors.push({ row: rowNum, field: 'weight', value: row.weight, message: 'Weight must be a positive number' });
      }

      // Date validation
      if (!row.date) {
        errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Date is required' });
      } else {
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Invalid date' });
        } else if (date > new Date()) {
          errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Date cannot be in the future' });
        }
      }

      // Method validation
      if (row.method && !['actual', 'estimated'].includes(row.method)) {
        warnings.push({ row: rowNum, field: 'method', value: row.method, message: 'Invalid method, will default to "actual"' });
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  static validateHealthData(data: any[], existingGoats: Goat[]): BulkValidationResult {
    const errors: BulkValidationError[] = [];
    const warnings: BulkValidationError[] = [];
    const goatTags = new Set(existingGoats.map(g => g.tagNumber.toLowerCase()));

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.goatTag?.trim()) {
        errors.push({ row: rowNum, field: 'goatTag', value: row.goatTag, message: 'Goat tag is required' });
      } else if (!goatTags.has(row.goatTag.toLowerCase())) {
        errors.push({ row: rowNum, field: 'goatTag', value: row.goatTag, message: 'Goat tag not found' });
      }

      if (!row.type || !['vaccination', 'treatment', 'checkup', 'medication', 'injury', 'illness', 'deworming'].includes(row.type)) {
        errors.push({ row: rowNum, field: 'type', value: row.type, message: 'Invalid health record type' });
      }

      if (!row.description?.trim()) {
        errors.push({ row: rowNum, field: 'description', value: row.description, message: 'Description is required' });
      }

      // Date validation
      if (!row.date) {
        errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Date is required' });
      } else {
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Invalid date' });
        }
      }

      // Cost validation
      if (row.cost && (isNaN(Number(row.cost)) || Number(row.cost) < 0)) {
        errors.push({ row: rowNum, field: 'cost', value: row.cost, message: 'Cost must be a non-negative number' });
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  static validateFinanceData(data: any[]): BulkValidationResult {
    const errors: BulkValidationError[] = [];
    const warnings: BulkValidationError[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.type || !['income', 'expense'].includes(row.type.toLowerCase())) {
        errors.push({ row: rowNum, field: 'type', value: row.type, message: 'Type must be "income" or "expense"' });
      }

      if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
        errors.push({ row: rowNum, field: 'amount', value: row.amount, message: 'Amount must be a positive number' });
      }

      if (!row.description?.trim()) {
        errors.push({ row: rowNum, field: 'description', value: row.description, message: 'Description is required' });
      }

      // Date validation
      if (!row.date) {
        errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Date is required' });
      } else {
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNum, field: 'date', value: row.date, message: 'Invalid date' });
        }
      }

      if (!row.category?.trim()) {
        warnings.push({ row: rowNum, field: 'category', value: row.category, message: 'Category not specified, will use "General"' });
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  static transformGoatData(data: any[], farmId: string): Goat[] {
    return data.map(row => ({
      id: uuidv4(),
      name: row.name?.trim(),
      tagNumber: row.tagNumber?.trim(),
      breed: row.breed?.trim(),
      birthDate: row.birthDate ? new Date(row.birthDate) : new Date(),
      birthWeight: row.birthWeight ? Number(row.birthWeight) : undefined,
      gender: row.gender?.toLowerCase() as 'male' | 'female',
      status: row.status || 'active',
      breedingStatus: row.breedingStatus || '',
      fatherId: row.fatherTag ? undefined : undefined, // Would need lookup
      motherId: row.motherTag ? undefined : undefined, // Would need lookup
      color: row.color?.trim(),
      markings: row.markings?.trim(),
      hornStatus: row.hornStatus as 'horned' | 'polled' | 'disbudded',
      notes: row.notes?.trim(),
      farmId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  static transformWeightData(data: any[], existingGoats: Goat[]): WeightRecord[] {
    const goatMap = new Map(existingGoats.map(g => [g.tagNumber.toLowerCase(), g.id]));
    
    return data.map(row => ({
      id: uuidv4(),
      goatId: goatMap.get(row.goatTag.toLowerCase()) || '',
      weight: Number(row.weight),
      date: new Date(row.date),
      method: row.method || 'actual' as 'actual' | 'estimated',
      chestGirth: row.chestGirth ? Number(row.chestGirth) : undefined,
      bodyLength: row.bodyLength ? Number(row.bodyLength) : undefined,
      notes: row.notes?.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  static transformHealthData(data: any[], existingGoats: Goat[]): HealthRecord[] {
    const goatMap = new Map(existingGoats.map(g => [g.tagNumber.toLowerCase(), g.id]));
    
    return data.map(row => ({
      id: uuidv4(),
      goatId: goatMap.get(row.goatTag.toLowerCase()) || '',
      type: row.type as 'vaccination' | 'treatment' | 'checkup' | 'medication' | 'injury' | 'illness' | 'deworming',
      description: row.description?.trim(),
      date: new Date(row.date),
      nextDueDate: row.nextDueDate ? new Date(row.nextDueDate) : undefined,
      cost: row.cost ? Number(row.cost) : undefined,
      veterinarian: row.veterinarian?.trim(),
      medications: row.medications?.trim(),
      notes: row.notes?.trim(),
      status: row.status || 'completed' as 'completed' | 'scheduled' | 'overdue',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  static transformFinanceData(data: any[], farmId: string): FinanceRecord[] {
    return data.map(row => ({
      id: uuidv4(),
      type: row.type?.toLowerCase() as 'income' | 'expense',
      amount: Number(row.amount),
      description: row.description?.trim(),
      date: new Date(row.date),
      category: row.category?.trim() || 'General',
      goatId: row.goatTag ? undefined : undefined, // Would need lookup
      farmId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }
}