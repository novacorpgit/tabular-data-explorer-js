import React, { useEffect, useRef, useState } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import FileLoader from "@/components/FileLoader";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus, Trash, Layout } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Extract unique panel types from data for the dropdown
const getUniqueTypes = (data: any[]): string[] => {
  const types = new Set<string>();
  
  // Function to recursively process items and their children
  const processItem = (item: any) => {
    if (item.type) {
      types.add(item.type);
    }
    
    // Process children if they exist
    if (item._children && Array.isArray(item._children)) {
      item._children.forEach((child: any) => processItem(child));
    }
  };
  
  // Process all top-level items
  data.forEach(item => processItem(item));
  
  return ["All", ...Array.from(types)];
};

const Index = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulator = useRef<Tabulator | null>(null);
  const [isTreeMode, setIsTreeMode] = useState(true);
  const [currentGroupField, setCurrentGroupField] = useState<string>("type");
  const [tableData, setTableData] = useState(panelboardData);
  const [nextId, setNextId] = useState(1000); // For generating new row IDs
  const [selectedType, setSelectedType] = useState<string>("All");
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const typeOptions = getUniqueTypes(tableData);
  
  // Function to generate table columns based on data structure
  const generateColumns = (headers: string[] | null = null) => {
    // Start with selection column
    const baseColumns = [
      {
        title: '<input type="checkbox" id="select-all-checkbox">',
        formatter: "rowSelection", 
        titleFormatter: "rowSelection",
        headerSort: false, 
        hozAlign: "center", 
        width: 70
      }
    ];
    
    // If headers are provided from CSV/JSON import, use them
    if (headers && headers.length > 0) {
      const dynamicColumns = headers.map(header => {
        // Check if the header might be numeric
        const isNumeric = tableData.length > 0 && typeof tableData[0][header] === 'number';
        
        return {
          title: header,
          field: header,
          sorter: isNumeric ? "number" : "string",
          headerFilter: true,
          editor: isNumeric ? "number" : "input",
          width: 120,
          // Special handling for cost and quantity columns
          ...(header.toLowerCase().includes('cost') && {
            formatter: "money",
            formatterParams: {
              precision: 2,
              symbol: "$"
            },
            cellEdited: function(cell: any) {
              updateTotal(cell.getRow());
            }
          }),
          ...(header.toLowerCase().includes('quantity') && {
            editor: "number",
            editorParams: {
              min: 1,
              step: 1
            },
            cellEdited: function(cell: any) {
              updateTotal(cell.getRow());
            }
          }),
          ...(header.toLowerCase().includes('total') && {
            formatter: "money",
            formatterParams: {
              precision: 2,
              symbol: "$"
            }
          })
        };
      });
      
      return [...baseColumns, ...dynamicColumns];
    }
    
    // Default electrical panelboard columns
    const defaultColumns = [
      { title: "ID", field: "id", sorter: "number", headerFilter: true, width: 80 },
      { title: "Component", field: "name", sorter: "string", headerFilter: true, width: 200, editor: "input" },
      { title: "Type", field: "type", sorter: "string", headerFilter: true, width: 120, editor: "list", editorParams: {
        values: ["Panel", "Breaker", "Bus Bar", "Component"]
      }},
      { title: "Voltage", field: "voltage", sorter: "string", headerFilter: true, width: 120, editor: "input" },
      { title: "Manufacturer", field: "manufacturer", sorter: "string", headerFilter: true, width: 150, editor: "input" },
      { 
        title: "Cost ($)", 
        field: "cost", 
        sorter: "number", 
        headerFilter: "number", 
        width: 100,
        formatter: "money",
        editor: "number",
        editorParams: {
          min: 0,
          step: 0.01
        },
        formatterParams: {
          precision: 2,
          symbol: "$"
        },
        cellEdited: function(cell: any) {
          updateTotal(cell.getRow());
        }
      },
      {
        title: "Quantity", 
        field: "quantity", 
        sorter: "number", 
        headerFilter: "number", 
        width: 80,
        editor: "number",
        editorParams: {
          min: 1,
          step: 1
        },
        cellEdited: function(cell: any) {
          const row = cell.getRow();
          const rowData = row.getData();
          updateTotal(row);
          
          // Check if this is a header row, update children if so
          if (rowData.isHeader && isTreeMode && rowData._children) {
            const newQuantity = parseInt(cell.getValue()) || 1;
            const oldQuantity = rowData._original_quantity || 1;
            const multiplier = newQuantity / oldQuantity;
            
            // Update all children quantities
            if (multiplier !== 1) {
              rowData._original_quantity = newQuantity;
              
              // Update children rows
              const children = row.getTreeChildren();
              if (children && children.length > 0) {
                children.forEach((childRow: any) => {
                  const childData = childRow.getData();
                  const newChildQuantity = Math.max(1, Math.round(childData.quantity * multiplier));
                  childRow.update({quantity: newChildQuantity});
                  updateTotal(childRow);
                });
                
                // Notify user
                if (children.length > 0) {
                  toast.info(`Updated quantities for ${children.length} child components`);
                }
              }
            }
          }
        }
      },
      { 
        title: "Total ($)", 
        field: "total", 
        sorter: "number", 
        headerFilter: "number", 
        width: 120,
        formatter: "money",
        formatterParams: {
          precision: 2,
          symbol: "$"
        }
      },
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
    
    return [...baseColumns, ...defaultColumns];
  };
  
  // Initialize columns
  useEffect(() => {
    setTableColumns(generateColumns());
  }, []);
  
  // Filter data based on selected type
  const filterDataByType = (type: string) => {
    if (!tabulator.current) return;
    
    if (type === "All") {
      tabulator.current.clearFilter();
    } else {
      // Apply filter correctly using the Tabulator API
      // Use a custom filter function to handle nested data
      tabulator.current.setFilter(function(data: any) {
        // Check if this row matches the filter directly
        if (data.type === type) return true;
        
        // For parent rows in tree mode, check if any children match
        if (data._children) {
          // Recursively check if any child matches the filter
          const checkChildren = (children: any[]): boolean => {
            for (const child of children) {
              if (child.type === type) return true;
              if (child._children && checkChildren(child._children)) return true;
            }
            return false;
          };
          
          return checkChildren(data._children);
        }
        
        return false;
      });
    }
  };
  
  // Handle type selection change
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    
    // Apply filter after tabulator is ready
    if (tabulator.current) {
      filterDataByType(value);
    }
  };

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
    
    setTableData(processedData);
    // Reinitialize table with new data
    initializeTable(isTreeMode, processedData);
    toast.success("Data loaded successfully");
  };

  // Handle headers changed from the imported CSV/JSON
  const handleHeadersChanged = (headers: string[]) => {
    console.log("Headers changed:", headers);
    const newColumns = generateColumns(headers);
    setTableColumns(newColumns);
    
    // Reinitialize table with the new columns
    if (tabulator.current && tableData.length > 0) {
      tabulator.current.setColumns(newColumns);
      toast.success("Table headers updated to match imported data");
    }
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
    
    // Reapply filter after mode change with a short delay to ensure table is ready
    setTimeout(() => {
      if (tabulator.current && selectedType !== 'All') {
        filterDataByType(selectedType);
      }
    }, 100);
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
        cost: 0,
        quantity: 1,
        total: 0
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

  // Function to clear all filters
  const clearFilters = () => {
    if (tabulator.current) {
      tabulator.current.clearFilter();
      setSelectedType("All");
      toast.info("All filters cleared");
    }
  };

  // Function to update total when cost or quantity changes
  const updateTotal = (row: any) => {
    const cost = parseFloat(row.getData().cost) || 0;
    const quantity = parseInt(row.getData().quantity) || 0;
    const total = cost * quantity;
    
    row.update({total: total});
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
        { title: "Type", field: "type", sorter: "string", headerFilter: true, width: 120, editor: "list", editorParams: {
          values: ["Panel", "Breaker", "Bus Bar", "Component"]
        }},
        { title: "Voltage", field: "voltage", sorter: "string", headerFilter: true, width: 120, editor: "input" },
        { title: "Manufacturer", field: "manufacturer", sorter: "string", headerFilter: true, width: 150, editor: "input" },
        { 
          title: "Cost ($)", 
          field: "cost", 
          sorter: "number", 
          headerFilter: "number", 
          width: 100,
          formatter: "money",
          editor: "number",
          editorParams: {
            min: 0,
            step: 0.01
          },
          formatterParams: {
            precision: 2,
            symbol: "$"
          },
          cellEdited: function(cell: any) {
            updateTotal(cell.getRow());
          }
        },
        {
          title: "Quantity", 
          field: "quantity", 
          sorter: "number", 
          headerFilter: "number", 
          width: 80,
          editor: "number",
          editorParams: {
            min: 1,
            step: 1
          },
          cellEdited: function(cell: any) {
            const row = cell.getRow();
            const rowData = row.getData();
            updateTotal(row);
            
            // Check if this is a header row, update children if so
            if (rowData.isHeader && isTreeMode && rowData._children) {
              const newQuantity = parseInt(cell.getValue()) || 1;
              const oldQuantity = rowData._original_quantity || 1;
              const multiplier = newQuantity / oldQuantity;
              
              // Update all children quantities
              if (multiplier !== 1) {
                rowData._original_quantity = newQuantity;
                
                // Update children rows
                const children = row.getTreeChildren();
                if (children && children.length > 0) {
                  children.forEach((childRow: any) => {
                    const childData = childRow.getData();
                    const newChildQuantity = Math.max(1, Math.round(childData.quantity * multiplier));
                    childRow.update({quantity: newChildQuantity});
                    updateTotal(childRow);
                  });
                  
                  // Notify user
                  if (children.length > 0) {
                    toast.info(`Updated quantities for ${children.length} child components`);
                  }
                }
              }
            }
          }
        },
        { 
          title: "Total ($)", 
          field: "total", 
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

      // Process data to add empty rows for visual separation before headers
      let processedData = [...data];
      if (treeMode) {
        // Keep the tree structure but ensure headers are marked properly
        processedData = data.map(item => {
          // Mark header status via data attribute for CSS targeting
          if (item.id && !item.id.includes('-')) {
            return { 
              ...item, 
              isHeader: true,
              "_attributes": {
                "data-is-header": "true" // Add data attribute for CSS targeting
              }
            };
          }
          return item;
        });
      } else {
        // For flat/group mode, insert empty rows before headers
        const newData: any[] = [];
        data.forEach(item => {
          // Add empty separator row before header rows
          if (item.id && !item.id.includes('-') && item.isHeader) {
            newData.push({ 
              id: `sep-${item.id}`, 
              isEmpty: true, 
              name: "", 
              type: "", 
              cost: 0,
              quantity: 0, 
              total: 0,
              "_attributes": {
                "class": "empty-separator" // Add class for CSS targeting
              }
            });
          }
          
          // Add the actual row with header flag if appropriate
          const isHeader = !item.id?.includes('-');
          newData.push({
            ...item,
            isHeader,
            "_attributes": isHeader ? {
              "data-is-header": "true",
              "class": "bg-blue-100" // Add class for CSS targeting
            } : {}
          });
        });
        processedData = newData;
      }

      tabulator.current = new Tabulator(tableRef.current, {
        data: processedData,
        layout: "fitData",
        columns: [...columns, ...ampColumns],
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
            totalCost += item.total || 0;
          });
          return value + " <span class='text-gray-500'>(" + count + " items, Total: $" + totalCost.toFixed(2) + ")</span>";
        },
        groupToggleElement: "header",
        groupStartOpen: true,
        // Tree configuration (only when tree mode is on)
        dataTree: treeMode,
        dataTreeStartExpanded: true,
        dataTreeChildIndent: 15,
        dataTreeBranchElement: "<span class='text-primary'>▶</span>",
        // Summary calculation for cost and total
        columnCalcs: {
          cost: {
            type: "sum",
            precision: 2
          },
          quantity: {
            type: "sum"
          },
          total: {
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
        ],
        // Apply fit to width functionality
        layoutColumnsOnNewData: true,
        responsiveLayoutCollapseStartOpen: false,
        autoResize: true,
        // Enhance row formatting based on data properties
        rowFormatter: function(row) {
          const rowData = row.getData();
          
          // Apply styling for header rows
          if (rowData.isHeader) {
            row.getElement().classList.add("bg-blue-100");
            row.getElement().classList.add("font-semibold");
            row.getElement().setAttribute("data-is-header", "true");
          }
          
          // Apply styling for empty separator rows
          if (rowData.isEmpty) {
            row.getElement().classList.add("empty-separator");
            row.getElement().style.height = "16px";
          }
        },
        // Improved table theme and appearance
        theme: "tabulator"  // Using default tabulator theme for a cleaner look
      });

      // Make table fit to container width
      const resizeTable = () => {
        if (tabulator.current) {
          tabulator.current.redraw(true);
        }
      };

      // Add window resize handler to ensure table always fits width
      window.addEventListener('resize', resizeTable);

      // Custom CSS for a modern table appearance
      const tableElement = tableRef.current;
      if (tableElement) {
        tableElement.classList.add("border", "rounded-lg", "shadow-md", "overflow-hidden");
      }

      // Add event listener to the select all checkbox
      document.getElementById("select-all-checkbox")?.addEventListener("change", function(e) {
        if ((e.target as HTMLInputElement).checked) {
          tabulator.current?.selectRow();
        } else {
          tabulator.current?.deselectRow();
        }
      });
      
      // Apply initial type filter if one is selected
      if (selectedType !== 'All') {
        filterDataByType(selectedType);
      }
      
      // Important: Apply the current filter after table is initialized
      tabulator.current.on("tableBuilt", function() {
        if (selectedType !== 'All') {
          filterDataByType(selectedType);
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
      // Remove the resize event listener when component unmounts
      window.removeEventListener('resize', () => {});
    };
  }, [tableColumns]); // Added tableColumns as a dependency

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
          
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2 text-card-foreground">Display Mode:</h3>
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
              
              <FileLoader onDataLoaded={handleDataLoaded} onHeadersChanged={handleHeadersChanged} />
            </div>
            
            {/* Panel Type Filter Dropdown */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-card-foreground">Filter by Component Type:</h3>
              <div className="flex items-center gap-2">
                <div className="w-60">
                  <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select component type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleTypeChange('All')} variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" /> Clear Filters
                </Button>
              </div>
            </div>
            
            <div className={!isTreeMode ? 'block' : 'opacity-50 pointer-events-none'}>
              <h3 className="font-semibold mb-2 text-card-foreground">Group By:</h3>
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

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button onClick={addRow} variant="default" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1" /> Add Component
              </Button>
              <Button onClick={deleteRow} variant="destructive">
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
          
          <div ref={tableRef} className="my-4 overflow-hidden rounded-lg border"></div>
          
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
