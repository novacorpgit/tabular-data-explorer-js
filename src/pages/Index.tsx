
import React, { useEffect, useRef, useState } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import FileLoader from "@/components/FileLoader";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Sample data for electrical panelboard estimation with tree structure
const panelboardData = [
  { 
    id: 1, 
    name: "Main Distribution Panel", 
    type: "Panel", 
    voltage: "480V", 
    cost: 1200, 
    manufacturer: "Siemens",
    _children: [
      { id: 101, name: "Main Breaker", type: "Breaker", voltage: "480V", ampRating: 400, cost: 350, manufacturer: "Siemens" },
      { id: 102, name: "Copper Bus Bar", type: "Bus Bar", voltage: "480V", rating: "600A", cost: 180, manufacturer: "Generic" },
      { id: 103, name: "Feed Breaker", type: "Breaker", voltage: "480V", ampRating: 100, cost: 120, manufacturer: "Siemens" },
      { id: 104, name: "Feed Breaker", type: "Breaker", voltage: "480V", ampRating: 60, cost: 85, manufacturer: "Siemens" }
    ]
  },
  {
    id: 2,
    name: "Lighting Panel LP-1", 
    type: "Panel", 
    voltage: "208V", 
    cost: 850, 
    manufacturer: "Square D",
    _children: [
      { id: 201, name: "Main Breaker", type: "Breaker", voltage: "208V", ampRating: 225, cost: 250, manufacturer: "Square D" },
      { id: 202, name: "Aluminum Bus Bar", type: "Bus Bar", voltage: "208V", rating: "225A", cost: 120, manufacturer: "Generic" },
      { id: 203, name: "Branch Circuit", type: "Breaker", voltage: "120V", ampRating: 20, cost: 25, manufacturer: "Square D" },
      { id: 204, name: "Branch Circuit", type: "Breaker", voltage: "120V", ampRating: 20, cost: 25, manufacturer: "Square D" }
    ]
  },
  {
    id: 3,
    name: "Power Panel PP-1", 
    type: "Panel", 
    voltage: "208V", 
    cost: 920, 
    manufacturer: "Eaton",
    _children: [
      { id: 301, name: "Main Breaker", type: "Breaker", voltage: "208V", ampRating: 200, cost: 230, manufacturer: "Eaton" },
      { id: 302, name: "Copper Bus Bar", type: "Bus Bar", voltage: "208V", rating: "250A", cost: 150, manufacturer: "Generic" },
      { id: 303, name: "Feed Breaker", type: "Breaker", voltage: "208V", ampRating: 50, cost: 65, manufacturer: "Eaton" },
      { id: 304, name: "Feed Breaker", type: "Breaker", voltage: "208V", ampRating: 30, cost: 45, manufacturer: "Eaton" }
    ]
  }
];

const Index = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulator = useRef<Tabulator | null>(null);
  const [isTreeMode, setIsTreeMode] = useState(true);
  const [currentGroupField, setCurrentGroupField] = useState<string>("type");
  const [tableData, setTableData] = useState(panelboardData);

  // Function to handle data loading from file
  const handleDataLoaded = (data: any[]) => {
    setTableData(data);
    // Reinitialize table with new data
    initializeTable(isTreeMode, data);
  };

  // Function to handle group toggle event
  const toggleGroupBy = (field: string) => {
    if (tabulator.current) {
      // If table is already grouped by this field, remove grouping
      const currentGroups = tabulator.current.getGroups();
      if (currentGroups.length > 0 && currentGroups[0].getField() === field) {
        tabulator.current.setGroupBy("");
        setCurrentGroupField("");
      } else {
        // Otherwise, set grouping by the selected field
        tabulator.current.setGroupBy(field);
        setCurrentGroupField(field);
      }
    }
  };

  // Function to calculate group totals for cost
  const calculatedCostTotal = (values: number[]) => {
    let total = 0;
    values.forEach((value) => {
      total += value;
    });
    return total.toFixed(2);
  };

  // Function to toggle display mode (tree or group)
  const toggleDisplayMode = (mode: 'tree' | 'group') => {
    setIsTreeMode(mode === 'tree');
    initializeTable(mode === 'tree', tableData);
  };

  // Function to initialize or reinitialize the table
  const initializeTable = (treeMode: boolean = true, data: any[] = tableData) => {
    if (tabulator.current) {
      tabulator.current.destroy();
    }
    
    if (tableRef.current) {
      // Configure columns based on the electrical panelboard data
      const columns = [
        { title: "ID", field: "id", sorter: "number", headerFilter: true, width: 80 },
        { title: "Component", field: "name", sorter: "string", headerFilter: true, width: 200 },
        { title: "Type", field: "type", sorter: "string", headerFilter: true, width: 120 },
        { title: "Voltage", field: "voltage", sorter: "string", headerFilter: true, width: 120 },
        { title: "Manufacturer", field: "manufacturer", sorter: "string", headerFilter: true, width: 150 },
        { 
          title: "Cost ($)", 
          field: "cost", 
          sorter: "number", 
          headerFilter: "number", 
          width: 120,
          formatter: "money",
          formatterParams: {
            precision: 2,
            symbol: "$"
          }
        }
      ];

      // Add additional columns based on equipment type
      const ampColumns = [
        { 
          title: "Amp Rating", 
          field: "ampRating", 
          sorter: "number", 
          headerFilter: true, 
          width: 120,
          formatter: function(cell: any) {
            const value = cell.getValue();
            return value ? value + "A" : "";
          }
        },
        {
          title: "Rating",
          field: "rating",
          sorter: "string",
          headerFilter: true,
          width: 120
        }
      ];

      tabulator.current = new Tabulator(tableRef.current, {
        data: data,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 20, 50],
        movableColumns: true,
        responsiveLayout: "collapse",
        // Group configuration (only when tree mode is off)
        groupBy: !treeMode ? currentGroupField : "",
        groupHeader: function(value, count, data) {
          // Calculate total cost for the group
          let totalCost = 0;
          data.forEach((item) => {
            totalCost += item.cost || 0;
          });
          return value + " <span class='text-gray-500'>(" + count + " items, Total: $" + totalCost.toFixed(2) + ")</span>";
        },
        groupToggleElement: "header",
        groupStartOpen: true,
        // Tree configuration (only when tree mode is on)
        dataTree: treeMode,
        dataTreeStartExpanded: true,
        dataTreeChildIndent: 15,
        dataTreeBranchElement: "<span class='text-blue-500'>▶</span>",
        // Column configuration
        columns: [...columns, ...ampColumns],
        // Summary calculation for cost
        columnCalcs: {
          cost: {
            type: "sum",
            precision: 2
          }
        }
      });
    }
  };

  // Function to export table data as CSV
  const exportCSV = () => {
    if (tabulator.current) {
      tabulator.current.download("csv", "panel_data_export.csv");
    }
  };

  // Function to export table data as JSON
  const exportJSON = () => {
    if (tabulator.current) {
      tabulator.current.download("json", "panel_data_export.json");
    }
  };

  useEffect(() => {
    // Initialize table when component mounts
    initializeTable(isTreeMode, tableData);

    // Clean up when component unmounts
    return () => {
      if (tabulator.current) {
        tabulator.current.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Electrical Panelboard Estimation</h1>
          <p className="text-gray-600 mb-4">
            This example demonstrates using Tabulator for electrical panelboard estimation, combining tree view for component hierarchy 
            and grouping for cost analysis by different categories.
          </p>
          
          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Display Mode:</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleDisplayMode('tree')}
                    className={`px-3 py-1 ${isTreeMode ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded hover:bg-blue-600 transition-colors`}>
                    Tree Mode (Hierarchy)
                  </button>
                  <button
                    onClick={() => toggleDisplayMode('group')}
                    className={`px-3 py-1 ${!isTreeMode ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded hover:bg-blue-600 transition-colors`}>
                    Group Mode (Analysis)
                  </button>
                </div>
              </div>
              
              <FileLoader onDataLoaded={handleDataLoaded} />
            </div>
            
            <div className={!isTreeMode ? 'block' : 'opacity-50 pointer-events-none'}>
              <h3 className="font-semibold mb-1">Group By:</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => toggleGroupBy("type")} 
                  className={`px-3 py-1 ${currentGroupField === 'type' ? 'bg-purple-600' : 'bg-purple-500'} text-white rounded hover:bg-purple-600`}>
                  Component Type
                </button>
                <button 
                  onClick={() => toggleGroupBy("voltage")} 
                  className={`px-3 py-1 ${currentGroupField === 'voltage' ? 'bg-purple-600' : 'bg-purple-500'} text-white rounded hover:bg-purple-600`}>
                  Voltage Rating
                </button>
                <button 
                  onClick={() => toggleGroupBy("manufacturer")} 
                  className={`px-3 py-1 ${currentGroupField === 'manufacturer' ? 'bg-purple-600' : 'bg-purple-500'} text-white rounded hover:bg-purple-600`}>
                  Manufacturer
                </button>
                <button 
                  onClick={() => toggleGroupBy("")} 
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Clear Grouping
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <Download className="w-4 h-4 mr-1" /> Export JSON
              </Button>
            </div>
          </div>
          
          <div ref={tableRef} className="mt-4"></div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Usage Instructions:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Tree Mode:</strong> Visualize the hierarchical structure of panelboards and their components.</li>
              <li><strong>Group Mode:</strong> Analyze components grouped by type, voltage, or manufacturer with cost summaries.</li>
              <li><strong>Import Data:</strong> Load data from CSV or JSON files.</li>
              <li><strong>Export Data:</strong> Download current table data as CSV or JSON.</li>
              <li>Click column headers to sort, or use the filters above each column to narrow down results.</li>
              <li>Use pagination controls below the table to navigate through the data.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
