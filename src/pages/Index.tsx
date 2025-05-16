
import React from "react";
import { Layout } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import FileLoader from "@/components/FileLoader";
import { Button } from "@/components/ui/button";
import TanStackPanelTable from "@/components/TanStackPanelTable";

// Sample data for electrical panelboard estimation with tree structure
const panelboardData = [
  { 
    id: "H1", 
    name: "Main Distribution Panel", 
    type: "Panel", 
    voltage: "480V", 
    cost: 1200,
    quantity: 1,
    total: 1200, 
    manufacturer: "Siemens",
    isHeader: true,
    _children: [
      { id: "H1-101", name: "Main Breaker", type: "Breaker", voltage: "480V", ampRating: 400, cost: 350, quantity: 1, total: 350, manufacturer: "Siemens" },
      { id: "H1-102", name: "Copper Bus Bar", type: "Bus Bar", voltage: "480V", rating: "600A", cost: 180, quantity: 1, total: 180, manufacturer: "Generic" },
      { id: "H1-103", name: "Feed Breaker", type: "Breaker", voltage: "480V", ampRating: 100, cost: 120, quantity: 1, total: 120, manufacturer: "Siemens" },
      { id: "H1-104", name: "Feed Breaker", type: "Breaker", voltage: "480V", ampRating: 60, cost: 85, quantity: 1, total: 85, manufacturer: "Siemens" }
    ]
  },
  {
    id: "H2",
    name: "Lighting Panel LP-1", 
    type: "Panel", 
    voltage: "208V", 
    cost: 850,
    quantity: 1,
    total: 850, 
    manufacturer: "Square D",
    isHeader: true,
    _children: [
      { id: "H2-201", name: "Main Breaker", type: "Breaker", voltage: "208V", ampRating: 225, cost: 250, quantity: 1, total: 250, manufacturer: "Square D" },
      { id: "H2-202", name: "Aluminum Bus Bar", type: "Bus Bar", voltage: "208V", rating: "225A", cost: 120, quantity: 1, total: 120, manufacturer: "Generic" },
      { id: "H2-203", name: "Branch Circuit", type: "Breaker", voltage: "120V", ampRating: 20, cost: 25, quantity: 1, total: 25, manufacturer: "Square D" },
      { id: "H2-204", name: "Branch Circuit", type: "Breaker", voltage: "120V", ampRating: 20, cost: 25, quantity: 1, total: 25, manufacturer: "Square D" }
    ]
  },
  {
    id: "H3",
    name: "Power Panel PP-1", 
    type: "Panel", 
    voltage: "208V", 
    cost: 920,
    quantity: 1,
    total: 920, 
    manufacturer: "Eaton",
    isHeader: true,
    _children: [
      { id: "H3-301", name: "Main Breaker", type: "Breaker", voltage: "208V", ampRating: 200, cost: 230, quantity: 1, total: 230, manufacturer: "Eaton" },
      { id: "H3-302", name: "Copper Bus Bar", type: "Bus Bar", voltage: "208V", rating: "250A", cost: 150, quantity: 1, total: 150, manufacturer: "Generic" },
      { id: "H3-303", name: "Feed Breaker", type: "Breaker", voltage: "208V", ampRating: 50, cost: 65, quantity: 1, total: 65, manufacturer: "Eaton" },
      { id: "H3-304", name: "Feed Breaker", type: "Breaker", voltage: "208V", ampRating: 30, cost: 45, quantity: 1, total: 45, manufacturer: "Eaton" }
    ]
  },
  // Add new items without children
  {
    id: "H4",
    name: "Emergency Panel EP-1", 
    type: "Panel", 
    voltage: "480V", 
    cost: 1050,
    quantity: 1,
    total: 1050, 
    manufacturer: "Schneider",
    isHeader: true,
  },
  {
    id: "H5",
    name: "UPS Distribution Panel", 
    type: "Panel", 
    voltage: "208V", 
    cost: 1200,
    quantity: 1,
    total: 1200, 
    manufacturer: "ABB",
    isHeader: true,
  },
  {
    id: "H6",
    name: "Motor Control Center", 
    type: "Panel", 
    voltage: "480V", 
    cost: 3500,
    quantity: 1,
    total: 3500, 
    manufacturer: "General Electric",
    isHeader: true,
  }
];

const Index = () => {
  // Function to handle data loading from file
  const handleDataLoaded = (data: any[]) => {
    // Add quantity and total fields if they don't exist
    const processedData = data.map(item => {
      const processItem = (item: any) => {
        // If item doesn't have quantity, add it with default value 1
        if (!item.hasOwnProperty('quantity')) {
          item.quantity = 1;
        }
        
        // Calculate total based on cost and quantity
        if (item.hasOwnProperty('cost')) {
          item.total = item.cost * item.quantity;
        }
        
        // Process children recursively
        if (item._children && Array.isArray(item._children)) {
          item._children = item._children.map(child => processItem(child));
        }
        
        return item;
      };
      
      return processItem({...item});
    });
    
    // Would update table data here - in the TanStackPanelTable component
    toast.success("Data loaded successfully");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-card rounded-lg shadow-sm p-6 border">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-card-foreground">Electrical Panelboard Estimation</h1>
            <Button asChild variant="outline">
              <Link to="/designer">
                <Layout className="w-4 h-4 mr-1" /> Panel Designer
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mb-6">
            This estimation tool combines tree view for component hierarchy and grouping for analysis by categories,
            making it easy to manage and calculate costs for electrical panelboards.
          </p>
          
          <div className="mb-6">
            <FileLoader onDataLoaded={handleDataLoaded} />
          </div>
          
          <TanStackPanelTable initialData={panelboardData} />
          
          <div className="mt-6 p-4 bg-accent rounded-lg border">
            <h3 className="font-bold mb-2 text-accent-foreground">Usage Instructions:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-accent-foreground/80">
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Tree Mode:</strong> Visualize the hierarchical structure of panelboards and components.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Group Mode:</strong> Analyze components by type, voltage, or manufacturer with cost summaries.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Filtering:</strong> Use the dropdown to filter by component type.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Add/Delete:</strong> Add new components or delete selected ones.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Separator Rows:</strong> Click "Add Separator Rows" to insert visual spacing above all headers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Edit:</strong> Click on a cell to edit its value directly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Select:</strong> Use checkboxes to select components for deletion or other operations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-accent-foreground/10 p-1">•</span>
                <span><strong>Import/Export:</strong> Load or download data in CSV/JSON formats.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
