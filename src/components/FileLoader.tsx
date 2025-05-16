
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileLoaderProps {
  onDataLoaded: (data: any[]) => void;
  onHeadersChanged?: (headers: string[]) => void; // New prop to handle header changes
}

const FileLoader: React.FC<FileLoaderProps> = ({ onDataLoaded, onHeadersChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'json') {
      parseJSON(file);
    } else {
      toast({
        title: "Unsupported File Format",
        description: "Please upload a CSV or JSON file.",
        variant: "destructive",
      });
    }

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
          const values = line.split(',').map(value => value.trim());
          const row: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            // Try to convert to number if possible
            const numValue = Number(value);
            row[header] = isNaN(numValue) ? value : numValue;
          });
          
          return row;
        });
        
        // Notify the parent component about the new headers
        if (onHeadersChanged) {
          onHeadersChanged(headers);
        }
        
        onDataLoaded(data);
        toast({
          title: "Data Loaded Successfully",
          description: `Loaded ${data.length} rows from CSV file.`,
        });
      } catch (error) {
        toast({
          title: "Error Parsing CSV",
          description: "Failed to parse the CSV file.",
          variant: "destructive",
        });
        console.error("CSV parsing error:", error);
      }
    };
    reader.readAsText(file);
  };

  const parseJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        if (Array.isArray(data) && data.length > 0) {
          // Extract headers from the first object's keys
          const headers = Object.keys(data[0]);
          
          // Notify the parent component about the new headers
          if (onHeadersChanged) {
            onHeadersChanged(headers);
          }
          
          onDataLoaded(data);
          toast({
            title: "Data Loaded Successfully",
            description: `Loaded ${data.length} rows from JSON file.`,
          });
        } else {
          toast({
            title: "Invalid JSON Format",
            description: "JSON file must contain an array of objects.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error Parsing JSON",
          description: "Failed to parse the JSON file.",
          variant: "destructive",
        });
        console.error("JSON parsing error:", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-4 items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
      >
        Import Data (CSV/JSON)
      </Button>
      <div className="text-sm text-muted-foreground">
        Supported formats: CSV, JSON
      </div>
    </div>
  );
};

export default FileLoader;
