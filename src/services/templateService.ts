import * as XLSX from 'xlsx';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
  example?: string;
  description?: string;
}

export class TemplateService {
  static readonly GOAT_TEMPLATE_FIELDS: TemplateField[] = [
    { key: 'name', label: 'Name', type: 'text', required: true, example: 'Bella', description: 'Goat name' },
    { key: 'tagNumber', label: 'Tag Number', type: 'text', required: true, example: 'G001', description: 'Unique tag number' },
    { key: 'breed', label: 'Breed', type: 'text', required: true, example: 'Boer', description: 'Goat breed' },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['male', 'female'], example: 'female' },
    { key: 'birthDate', label: 'Birth Date', type: 'date', required: false, example: '2024-01-15', description: 'YYYY-MM-DD format' },
    { key: 'birthWeight', label: 'Birth Weight (kg)', type: 'number', required: false, example: '3.5' },
    { key: 'color', label: 'Color', type: 'text', required: false, example: 'Brown and White' },
    { key: 'markings', label: 'Markings', type: 'text', required: false, example: 'White spot on forehead' },
    { key: 'hornStatus', label: 'Horn Status', type: 'select', required: false, options: ['horned', 'polled', 'disbudded'], example: 'polled' },
    { key: 'motherTag', label: 'Mother Tag', type: 'text', required: false, example: 'G999', description: 'Tag of mother goat' },
    { key: 'fatherTag', label: 'Father Tag', type: 'text', required: false, example: 'B001', description: 'Tag of father goat' },
    { key: 'status', label: 'Status', type: 'select', required: false, options: ['active', 'sold', 'deceased', 'archived'], example: 'active' },
    { key: 'notes', label: 'Notes', type: 'text', required: false, example: 'Friendly, good milk producer' }
  ];

  static readonly WEIGHT_TEMPLATE_FIELDS: TemplateField[] = [
    { key: 'goatTag', label: 'Goat Tag', type: 'text', required: true, example: 'G001', description: 'Tag number of goat' },
    { key: 'weight', label: 'Weight (kg)', type: 'number', required: true, example: '45.5' },
    { key: 'date', label: 'Date', type: 'date', required: true, example: '2024-09-13', description: 'YYYY-MM-DD format' },
    { key: 'method', label: 'Method', type: 'select', required: false, options: ['actual', 'estimated'], example: 'actual' },
    { key: 'chestGirth', label: 'Chest Girth (cm)', type: 'number', required: false, example: '85' },
    { key: 'bodyLength', label: 'Body Length (cm)', type: 'number', required: false, example: '75' },
    { key: 'notes', label: 'Notes', type: 'text', required: false, example: 'Good weight gain' }
  ];

  static readonly HEALTH_TEMPLATE_FIELDS: TemplateField[] = [
    { key: 'goatTag', label: 'Goat Tag', type: 'text', required: true, example: 'G001', description: 'Tag number of goat' },
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['vaccination', 'treatment', 'checkup', 'medication', 'injury', 'illness', 'deworming'], example: 'vaccination' },
    { key: 'description', label: 'Description', type: 'text', required: true, example: 'Annual vaccination', description: 'What was done' },
    { key: 'date', label: 'Date', type: 'date', required: true, example: '2024-09-13', description: 'YYYY-MM-DD format' },
    { key: 'nextDueDate', label: 'Next Due Date', type: 'date', required: false, example: '2025-09-13', description: 'YYYY-MM-DD format' },
    { key: 'cost', label: 'Cost ($)', type: 'number', required: false, example: '25.00' },
    { key: 'veterinarian', label: 'Veterinarian', type: 'text', required: false, example: 'Dr. Smith' },
    { key: 'medications', label: 'Medications', type: 'text', required: false, example: 'Penicillin 10ml' },
    { key: 'status', label: 'Status', type: 'select', required: false, options: ['completed', 'scheduled', 'overdue'], example: 'completed' },
    { key: 'notes', label: 'Notes', type: 'text', required: false, example: 'No adverse reactions' }
  ];

  static readonly FINANCE_TEMPLATE_FIELDS: TemplateField[] = [
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['income', 'expense'], example: 'income' },
    { key: 'amount', label: 'Amount ($)', type: 'number', required: true, example: '150.00' },
    { key: 'description', label: 'Description', type: 'text', required: true, example: 'Sale of goat G001' },
    { key: 'date', label: 'Date', type: 'date', required: true, example: '2024-09-13', description: 'YYYY-MM-DD format' },
    { key: 'category', label: 'Category', type: 'text', required: false, example: 'Sales', description: 'Feed, Veterinary, Sales, Equipment, etc.' },
    { key: 'goatTag', label: 'Goat Tag', type: 'text', required: false, example: 'G001', description: 'If related to specific goat' },
    { key: 'notes', label: 'Notes', type: 'text', required: false, example: 'Sold to local farmer' }
  ];

  static generateTemplate(type: 'goats' | 'weight' | 'health' | 'finance'): string {
    let fields: TemplateField[];
    let sheetName: string;

    switch (type) {
      case 'goats':
        fields = this.GOAT_TEMPLATE_FIELDS;
        sheetName = 'Goats';
        break;
      case 'weight':
        fields = this.WEIGHT_TEMPLATE_FIELDS;
        sheetName = 'Weight Records';
        break;
      case 'health':
        fields = this.HEALTH_TEMPLATE_FIELDS;
        sheetName = 'Health Records';
        break;
      case 'finance':
        fields = this.FINANCE_TEMPLATE_FIELDS;
        sheetName = 'Finance Records';
        break;
      default:
        throw new Error('Invalid template type');
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create header row
    const headers = fields.map(f => f.label);
    const data = [headers];

    // Add example row
    const exampleRow = fields.map(f => f.example || '');
    data.push(exampleRow);

    // Add description row (commented out for CSV compatibility)
    const descriptionRow = fields.map(f => `// ${f.description || f.label}`);
    data.push(descriptionRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = fields.map(() => ({ width: 20 }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file as base64
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const base64 = btoa(String.fromCharCode(...new Uint8Array(excelBuffer)));
    
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  }

  static generateCSVTemplate(type: 'goats' | 'weight' | 'health' | 'finance'): string {
    let fields: TemplateField[];

    switch (type) {
      case 'goats':
        fields = this.GOAT_TEMPLATE_FIELDS;
        break;
      case 'weight':
        fields = this.WEIGHT_TEMPLATE_FIELDS;
        break;
      case 'health':
        fields = this.HEALTH_TEMPLATE_FIELDS;
        break;
      case 'finance':
        fields = this.FINANCE_TEMPLATE_FIELDS;
        break;
      default:
        throw new Error('Invalid template type');
    }

    // Create CSV content
    const headers = fields.map(f => f.label).join(',');
    const examples = fields.map(f => f.example || '').join(',');
    const descriptions = fields.map(f => `"${f.description || f.label}"`).join(',');

    const csvContent = `${headers}\n${examples}\n# ${descriptions}`;
    
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  }

  static parseImportFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let parsedData: any[] = [];

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            if (lines.length < 2) {
              reject(new Error('CSV file must have at least header and one data row'));
              return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            parsedData = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                // Convert header back to key
                const field = this.getFieldKeyFromLabel(header);
                row[field] = values[index] || '';
              });
              return row;
            });
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonData.length < 2) {
              reject(new Error('Excel file must have at least header and one data row'));
              return;
            }

            const headers = jsonData[0] as string[];
            parsedData = (jsonData.slice(1) as any[][])
              .filter(row => row.some(cell => cell !== undefined && cell !== ''))
              .map(row => {
                const rowData: any = {};
                headers.forEach((header, index) => {
                  const field = this.getFieldKeyFromLabel(header);
                  rowData[field] = row[index] || '';
                });
                return rowData;
              });
          }

          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }

  private static getFieldKeyFromLabel(label: string): string {
    const allFields = [
      ...this.GOAT_TEMPLATE_FIELDS,
      ...this.WEIGHT_TEMPLATE_FIELDS,
      ...this.HEALTH_TEMPLATE_FIELDS,
      ...this.FINANCE_TEMPLATE_FIELDS
    ];

    const field = allFields.find(f => f.label.toLowerCase() === label.toLowerCase());
    return field?.key || label.toLowerCase().replace(/\s+/g, '');
  }

  static downloadTemplate(filename: string, dataUrl: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}