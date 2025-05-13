
import React, { useEffect, useRef, useState } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import FileLoader from "@/components/FileLoader";
import { Button } from "@/components/ui/button";
import { Download, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

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
  const [nextId, setNextId] = useState(1000); // For generating new row IDs

  // Function to handle data loading from file
  const handleDataLoaded = (data: any[]) => {
    setTableData(data);
    // Reinitialize table with new data
    initializeTable(isTreeMode, data);
    toast.success("Data loaded successfully");
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

  // Function to add a new row
  const addRow = () => {
    if (tabulator.current) {
      const newId = nextId;
      setNextId(nextId + 1);
      
      const newRow = {
        id: newId,
        name: "New Component",
        type: "Component",
        voltage: "120V",
        manufacturer: "Generic",
        cost: 0
      };
      
      tabulator.current.addRow(newRow)
        .then(() => {
          toast.success("New component added");
        })
        .catch(error => {
          console.error("Error adding row:", error);
          toast.error("Failed to add component");
        });
    }
  };

  // Function to delete selected rows
  const deleteRow = () => {
    if (tabulator.current) {
      const selectedRows = tabulator.current.getSelectedRows();
      
      if (selectedRows.length === 0) {
        toast.warning("No components selected");
        return;
      }
      
      selectedRows.forEach(row => {
        row.delete();
      });
      
      toast.success(`${selectedRows.length} component(s) deleted`);
    }
  };

  // Function to initialize or reinitialize the table
  const initializeTable = (treeMode: boolean = true, data: any[] = tableData) => {
    if (tabulator.current) {
      tabulator.current.destroy();
    }
    
    if (tableRef.current) {
      // Configure columns based on the electrical panelboard data
      const columns = [
        {
          title: '<input type="checkbox" id="select-all-checkbox">',
          formatter: "rowSelection", 
          titleFormatter: "rowSelection",
          headerSort: false, 
          hozAlign: "center", 
          width: 70
        },
        { title: "ID", field: "id", sorter: "number", headerFilter: true, width: 80 },
        { title: "Component", field: "name", sorter: "string", headerFilter: true, width: 200, editor: "input" },
        { title: "Type", field: "type", sorter: "string", headerFilter: true, width: 120, editor: "select", editorParams: {
          values: ["Panel", "Breaker", "Bus Bar", "Component"]
        }},
        { title: "Voltage", field: "voltage", sorter: "string", headerFilter: true, width: 120, editor: "input" },
        { title: "Manufacturer", field: "manufacturer", sorter: "string", headerFilter: true, width: 150, editor: "input" },
        { 
          title: "Cost ($)", 
          field: "cost", 
          sorter: "number", 
          headerFilter: "number", 
          width: 120,
          formatter: "money",
          editor: "number",
          editorParams: {
            min: 0,
            step: 0.01
          },
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
          editor: "number",
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
          width: 120,
          editor: "input"
        }
      ];

      // Custom CSS for a more beautiful table
      const customCSS = document.createElement('style');
      customCSS.innerHTML = `
        .tabulator {
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          border: none !important;
        }
        .tabulator-header {
          background-color: #f9fafb !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        .tabulator-row.tabulator-row-even {
          background-color: #ffffff !important;
        }
        .tabulator-row.tabulator-row-odd {
          background-color: #f9fafb !important;
        }
        .tabulator-row.tabulator-selected {
          background-color: #e0f2fe !important;
        }
        .tabulator-row:hover {
          background-color: #f0f9ff !important;
        }
        .tabulator-cell {
          border-right: none !important;
          padding: 12px 8px !important;
        }
        .tabulator-footer {
          background-color: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
          padding: 8px !important;
        }
        .tabulator-footer .tabulator-paginator {
          padding: 4px 0 !important;
        }
        .tabulator-footer .tabulator-page {
          margin: 0 2px !important;
          border-radius: 4px !important;
          border: 1px solid #d1d5db !important;
          background: white !important;
        }
        .tabulator-footer .tabulator-page.active {
          background-color: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }
        .tabulator-menu {
          border-radius: 4px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
      `;
      document.head.appendChild(customCSS);

      tabulator.current = new Tabulator(tableRef.current, {
        data: data,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 50,
        paginationSizeSelector: [10, 25, 50, 100, true],
        movableColumns: true,
        responsiveLayout: "collapse",
        selectable: true,  // Enable row selection
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
        },
        // Row context menu for deleting individual rows
        rowContextMenu: [
          {
            label: "Delete Row",
            action: function(e, row) {
              row.delete();
              toast.success("Component deleted");
            }
          }
        ]
      });

      // Add event listener to the select all checkbox
      document.getElementById("select-all-checkbox")?.addEventListener("change", function(e) {
        if ((e.target as HTMLInputElement).checked) {
          tabulator.current?.selectRow();
        } else {
          tabulator.current?.deselectRow();
        }
      });
    }
  };

  // Function to export table data as CSV
  const exportCSV = () => {
    if (tabulator.current) {
      tabulator.current.download("csv", "panel_data_export.csv");
      toast.success("CSV export started");
    }
  };

  // Function to export table data as JSON
  const exportJSON = () => {
    if (tabulator.current) {
      tabulator.current.download("json", "panel_data_export.json");
      toast.success("JSON export started");
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
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Electrical Panelboard Estimation</h1>
          <p className="text-gray-600 mb-6">
            This estimation tool combines tree view for component hierarchy and grouping for analysis by categories,
            making it easy to manage and calculate costs for electrical panelboards.
          </p>
          
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Display Mode:</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleDisplayMode('tree')}
                    variant={isTreeMode ? "default" : "outline"}>
                    Tree Mode
                  </Button>
                  <Button
                    onClick={() => toggleDisplayMode('group')}
                    variant={!isTreeMode ? "default" : "outline"}>
                    Group Mode
                  </Button>
                </div>
              </div>
              
              <FileLoader onDataLoaded={handleDataLoaded} />
            </div>
            
            <div className={!isTreeMode ? 'block' : 'opacity-50 pointer-events-none'}>
              <h3 className="font-semibold mb-2 text-gray-700">Group By:</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => toggleGroupBy("type")} 
                  variant={currentGroupField === 'type' ? "default" : "outline"}>
                  Component Type
                </Button>
                <Button 
                  onClick={() => toggleGroupBy("voltage")} 
                  variant={currentGroupField === 'voltage' ? "default" : "outline"}>
                  Voltage Rating
                </Button>
                <Button 
                  onClick={() => toggleGroupBy("manufacturer")} 
                  variant={currentGroupField === 'manufacturer' ? "default" : "outline"}>
                  Manufacturer
                </Button>
                <Button 
                  onClick={() => toggleGroupBy("")} 
                  variant="secondary">
                  Clear Grouping
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <Button onClick={addRow} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200">
                <Plus className="w-4 h-4 mr-1" /> Add Component
              </Button>
              <Button onClick={deleteRow} variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200">
                <Trash className="w-4 h-4 mr-1" /> Delete Selected
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportJSON}>
                  <Download className="w-4 h-4 mr-1" /> Export JSON
                </Button>
              </div>
            </div>
          </div>
          
          <div ref={tableRef} className="my-4 border border-gray-100 rounded-lg overflow-hidden"></div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-bold mb-2 text-blue-800">Usage Instructions:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
                <span><strong>Tree Mode:</strong> Visualize the hierarchical structure of panelboards and components.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
                <span><strong>Group Mode:</strong> Analyze components by type, voltage, or manufacturer with cost summaries.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
                <span><strong>Add/Delete:</strong> Add new components or delete selected ones.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
                <span><strong>Edit:</strong> Click on a cell to edit its value directly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
                <span><strong>Select:</strong> Use checkboxes to select components for deletion or other operations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block rounded-full bg-blue-100 p-1">•</span>
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
