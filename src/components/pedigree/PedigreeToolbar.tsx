import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, ZoomIn, ZoomOut, Download, FileImage, FileText } from 'lucide-react';

interface PedigreeToolbarProps {
  onSearch: (query: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

const PedigreeToolbar: React.FC<PedigreeToolbarProps> = ({ 
  onSearch,
  onZoomIn,
  onZoomOut,
  onExportPNG,
  onExportPDF
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-border">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goat..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 w-48 h-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onZoomIn} aria-label="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomOut} aria-label="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Export">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPNG}>
              <FileImage className="mr-2 h-4 w-4" />
              <span>Export as PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Export as PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default PedigreeToolbar;