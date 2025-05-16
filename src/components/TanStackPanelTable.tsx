import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  ColumnDef,
  RowSelectionState,
  flexRender,
  Row,
  Cell,
  createColumnHelper,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Plus, Download, Filter, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

// Define interface for table data
export interface PanelItem {
  id: string;
  name: string;
  type: string;
  voltage: string;
  cost: number;
  quantity: number;
  total: number;
  manufacturer?: string;
  ampRating?: number;
  rating?: string;
  isHeader?: boolean;
  isEmpty?: boolean;
  _children?: PanelItem[];
  _original_quantity?: number;
  subRows?: PanelItem[];
}

type TanStackPanelTableProps = {
  initialData: PanelItem[];
  onDataChange?: (data: PanelItem[]) => void;
};

const columnHelper = createColumnHelper<PanelItem>();

const TanStackPanelTable: React.FC<TanStackPanelTableProps> = ({ initialData, onDataChange }) => {
  const [data, setData] = useState<PanelItem[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isTreeMode, setIsTreeMode] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [nextId, setNextId] = useState<number>(1000); // For new rows

  // Process initialData to prepare for TanStack Table
  useEffect(() => {
    // Convert tree structure to TanStack Table format with subRows
    const processData = (items: PanelItem[]): PanelItem[] => {
      return items.map(item => {
        const newItem = { ...item };
        
        // If item has children, add as subRows for TanStack Table
        if (item._children && Array.isArray(item._children)) {
          newItem.subRows = processData(item._children);
          delete newItem._children; // Remove the original _children property
        }
        
        return newItem;
      });
    };

    setData(processData(initialData));
  }, [initialData]);

  // Get unique types from data
  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    
    // Function to process items and their subrows recursively
    const processItem = (item: PanelItem) => {
      if (item.type) {
        types.add(item.type);
      }
      
      if (item.subRows) {
        item.subRows.forEach(subItem => processItem(subItem));
      }
    };
    
    data.forEach(item => processItem(item));
    
    return ["All", ...Array.from(types)];
  }, [data]);

  // Update the parent's total when a child's quantity changes
  const recalculateParentTotal = (row: Row<PanelItem>) => {
    if (!row.getParentRow()) return;
    
    const parentRow = row.getParentRow() as Row<PanelItem>;
    const parentData = parentRow.original;
    let newParentTotal = 0;
    
    // Sum totals of all children
    parentRow.getLeafRows().forEach(childRow => {
      newParentTotal += (childRow.original.cost || 0) * (childRow.original.quantity || 0);
    });
    
    // Update parent data
    const updatedParent = {
      ...parentData,
      total: newParentTotal
    };
    
    // Update the data state
    setData(prev => {
      const newData = [...prev];
      const parentIndex = newData.findIndex(item => item.id === parentData.id);
      if (parentIndex >= 0) {
        newData[parentIndex] = updatedParent;
      }
      return newData;
    });
    
    // If parent has a parent, recursively update up the chain
    if (parentRow.getParentRow()) {
      recalculateParentTotal(parentRow);
    }
  };

  // Update totals when cost or quantity changes
  const updateTotal = (row: Row<PanelItem>) => {
    const original = row.original;
    const cost = parseFloat(original.cost.toString()) || 0;
    const quantity = parseInt(original.quantity.toString()) || 0;
    const total = cost * quantity;
    
    // Update the row
    setData(prev => {
      return prev.map(item => {
        if (item.id === original.id) {
          return { ...item, total };
        }
        if (item.subRows) {
          return {
            ...item,
            subRows: item.subRows.map(subItem => 
              subItem.id === original.id ? { ...subItem, total } : subItem
            )
          };
        }
        return item;
      });
    });
    
    // Update parent row totals if this is a child row
    if (row.getParentRow()) {
      recalculateParentTotal(row);
    }
  };

  // Update children quantities when parent quantity changes
  const updateChildQuantities = (row: Row<PanelItem>, newQuantity: number) => {
    const original = row.original;
    const oldQuantity = original._original_quantity || original.quantity || 1;
    const multiplier = newQuantity / oldQuantity;
    
    if (multiplier === 1) return;
    
    // Store the new quantity as the original for future updates
    const updatedRow = { ...original, _original_quantity: newQuantity };
    
    // Update all child rows
    if (row.getLeafRows().length > 0) {
      const childUpdates: Record<string, number> = {};
      
      row.getLeafRows().forEach(childRow => {
        const childData = childRow.original;
        const newChildQuantity = Math.max(1, Math.round(childData.quantity * multiplier));
        childUpdates[childData.id] = newChildQuantity;
      });
      
      // Update data state with all child updates
      setData(prev => {
        const updateNestedRows = (items: PanelItem[]): PanelItem[] => {
          return items.map(item => {
            if (childUpdates[item.id]) {
              return { ...item, quantity: childUpdates[item.id], total: item.cost * childUpdates[item.id] };
            }
            
            if (item.id === original.id) {
              return updatedRow;
            }
            
            if (item.subRows) {
              return { ...item, subRows: updateNestedRows(item.subRows) };
            }
            
            return item;
          });
        };
        
        return updateNestedRows(prev);
      });
      
      toast.info(`Updated quantities for ${Object.keys(childUpdates).length} child components`);
    }
  };

  // Add empty separator rows above headers
  const addEmptySeparators = () => {
    let headerIds = new Set<string>();
    
    // Find all header IDs
    data.forEach(row => {
      if (row.isHeader) {
        headerIds.add(row.id);
      }
    });
    
    if (headerIds.size === 0) {
      toast.warning("No header rows found to add separators");
      return;
    }
    
    // Check for existing separators and create new ones if needed
    const existingSeparators = data.filter(row => row.isEmpty).map(row => row.id);
    const newData: PanelItem[] = [];
    let separatorsAdded = 0;
    
    data.forEach(row => {
      // If this is a header row and doesn't have a separator before it
      if (row.isHeader && headerIds.has(row.id)) {
        const separatorId = `sep-${row.id}`;
        if (!existingSeparators.includes(separatorId)) {
          // Add separator before header
          newData.push({
            id: separatorId,
            name: "",
            type: "",
            voltage: "",
            cost: 0,
            quantity: 0,
            total: 0,
            isEmpty: true,
          });
          separatorsAdded++;
        }
      }
      // Add the regular row
      newData.push(row);
    });
    
    // Update data with new separators
    if (separatorsAdded > 0) {
      setData(newData);
      toast.success(`Added ${separatorsAdded} separator rows`);
    } else {
      toast.info("All headers already have separator rows");
    }
  };

  // Add a new row
  const addRow = () => {
    const newId = nextId;
    setNextId(prev => prev + 1);
    
    const newRow: PanelItem = {
      id: newId.toString(),
      name: "New Component",
      type: "Component",
      voltage: "120V",
      manufacturer: "Generic",
      cost: 0,
      quantity: 1,
      total: 0,
    };
    
    setData(prev => [...prev, newRow]);
    toast.success("New component added");
  };

  // Delete selected rows
  const deleteSelectedRows = () => {
    const selectedIds = Object.keys(rowSelection);
    
    if (selectedIds.length === 0) {
      toast.warning("No components selected");
      return;
    }
    
    // Remove selected rows
    setData(prev => {
      const removeSelectedIds = (items: PanelItem[]): PanelItem[] => {
        return items
          .filter(item => !selectedIds.includes(item.id))
          .map(item => {
            if (item.subRows) {
              return { ...item, subRows: removeSelectedIds(item.subRows) };
            }
            return item;
          });
      };
      
      return removeSelectedIds(prev);
    });
    
    // Clear selection
    setRowSelection({});
    toast.success(`${selectedIds.length} component(s) deleted`);
  };

  // Export data as CSV
  const exportCSV = () => {
    // Get all data including nested rows
    const flattenData = (items: PanelItem[]): PanelItem[] => {
      return items.reduce((acc: PanelItem[], item) => {
        acc.push(item);
        if (item.subRows) {
          acc.push(...flattenData(item.subRows));
        }
        return acc;
      }, []);
    };
    
    const flatData = flattenData(data);
    
    // Create CSV content
    const headers = Object.keys(flatData[0] || {})
      .filter(key => !key.startsWith('_') && key !== 'subRows' && key !== 'isEmpty')
      .join(',');
    
    const rows = flatData.map(item => 
      Object.entries(item)
        .filter(([key]) => !key.startsWith('_') && key !== 'subRows' && key !== 'isEmpty')
        .map(([_, value]) => typeof value === 'string' ? `"${value}"` : value)
        .join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'panel_data_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("CSV export started");
  };

  // Export data as JSON
  const exportJSON = () => {
    // Create JSON content - need to clean up internal properties
    const cleanData = (items: PanelItem[]): any[] => {
      return items.map(item => {
        const cleanItem: any = { ...item };
        
        // Remove internal properties
        delete cleanItem._original_quantity;
        delete cleanItem.isEmpty;
        
        // Convert subRows back to _children for compatibility
        if (cleanItem.subRows) {
          cleanItem._children = cleanData(cleanItem.subRows);
          delete cleanItem.subRows;
        }
        
        return cleanItem;
      });
    };
    
    const json = JSON.stringify(cleanData(data), null, 2);
    
    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'panel_data_export.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("JSON export started");
  };

  // Filter by component type
  const filterByType = (type: string) => {
    setSelectedType(type);
    if (type === "All") {
      table.resetColumnFilters();
    } else {
      table.setColumnFilters([
        {
          id: 'type',
          value: type,
        },
      ]);
    }
  };

  // Define columns
  const columns = useMemo<ColumnDef<PanelItem>[]>(() => [
    // Row selection column
    {
      id: 'select',
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() ? true : false)
            }
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    // ID Column
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
      enableColumnFilter: true,
    }),
    // Component name column
    columnHelper.accessor('name', {
      header: 'Component',
      cell: info => {
        const row = info.row;
        const indent = row.depth * 20; // For tree view indentation
        
        return (
          <div style={{ paddingLeft: `${indent}px` }} className="flex items-center">
            {row.getCanExpand() && (
              <button
                onClick={row.getToggleExpandedHandler()}
                className="mr-1.5"
              >
                {row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {/* Make the item editable */}
            <input
              type="text"
              value={info.getValue() || ''}
              onChange={e => {
                const newValue = e.target.value;
                setData(prev => {
                  return prev.map(item => {
                    if (item.id === row.original.id) {
                      return { ...item, name: newValue };
                    }
                    if (item.subRows) {
                      return {
                        ...item,
                        subRows: item.subRows.map(subItem => 
                          subItem.id === row.original.id ? { ...subItem, name: newValue } : subItem
                        )
                      };
                    }
                    return item;
                  });
                });
              }}
              className="bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5 w-full"
            />
          </div>
        );
      },
      enableColumnFilter: true,
    }),
    // Type column
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => {
        const options = ['Panel', 'Breaker', 'Bus Bar', 'Component'];
        return (
          <select
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              const row = info.row;
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, type: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, type: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
            }}
            className="bg-transparent border border-gray-300 rounded px-2 py-1 w-full"
          >
            {options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      },
      enableColumnFilter: true,
    }),
    // Voltage column
    columnHelper.accessor('voltage', {
      header: 'Voltage',
      cell: info => {
        const row = info.row;
        return (
          <input
            type="text"
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, voltage: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, voltage: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
            }}
            className="bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5 w-full"
          />
        );
      },
      enableColumnFilter: true,
    }),
    // Manufacturer column
    columnHelper.accessor('manufacturer', {
      header: 'Manufacturer',
      cell: info => {
        const row = info.row;
        return (
          <input
            type="text"
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, manufacturer: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, manufacturer: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
            }}
            className="bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5 w-full"
          />
        );
      },
      enableColumnFilter: true,
    }),
    // Cost column
    columnHelper.accessor('cost', {
      header: 'Cost ($)',
      cell: info => {
        const row = info.row;
        return (
          <input
            type="number"
            min="0"
            step="0.01"
            value={info.getValue() || 0}
            onChange={e => {
              const newValue = parseFloat(e.target.value) || 0;
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, cost: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, cost: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
              updateTotal(row);
            }}
            className="bg-transparent border border-gray-300 rounded px-2 py-1 w-full text-right"
          />
        );
      },
      enableColumnFilter: true,
      cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
    }),
    // Quantity column
    columnHelper.accessor('quantity', {
      header: 'Quantity',
      cell: info => {
        const row = info.row;
        const isHeader = row.original.isHeader;
        
        return (
          <input
            type="number"
            min="1"
            step="1"
            value={info.getValue() || 1}
            onChange={e => {
              const newValue = parseInt(e.target.value) || 1;
              
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, quantity: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, quantity: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
              
              // Update total for this row
              updateTotal(row);
              
              // If this is a header row, update all children
              if (isHeader && row.getCanExpand() && row.subRows?.length > 0) {
                updateChildQuantities(row, newValue);
              }
            }}
            className={`bg-transparent border border-gray-300 rounded px-2 py-1 w-full text-right ${
              isHeader ? 'font-semibold' : ''
            }`}
          />
        );
      },
      enableColumnFilter: true,
    }),
    // Total column
    columnHelper.accessor('total', {
      header: 'Total ($)',
      cell: info => `$${info.getValue().toFixed(2)}`,
      enableColumnFilter: true,
    }),
    // Amp Rating column
    columnHelper.accessor('ampRating', {
      header: 'Amp Rating',
      cell: info => {
        const row = info.row;
        return (
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              step="1"
              value={info.getValue() || ''}
              onChange={e => {
                const newValue = parseInt(e.target.value) || 0;
                setData(prev => {
                  return prev.map(item => {
                    if (item.id === row.original.id) {
                      return { ...item, ampRating: newValue };
                    }
                    if (item.subRows) {
                      return {
                        ...item,
                        subRows: item.subRows.map(subItem => 
                          subItem.id === row.original.id ? { ...subItem, ampRating: newValue } : subItem
                        )
                      };
                    }
                    return item;
                  });
                });
              }}
              className="bg-transparent border border-gray-300 rounded px-2 py-1 w-full text-right"
            />
            <span className="ml-1">A</span>
          </div>
        );
      },
      enableColumnFilter: true,
    }),
    // Rating column
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => {
        const row = info.row;
        return (
          <input
            type="text"
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              setData(prev => {
                return prev.map(item => {
                  if (item.id === row.original.id) {
                    return { ...item, rating: newValue };
                  }
                  if (item.subRows) {
                    return {
                      ...item,
                      subRows: item.subRows.map(subItem => 
                        subItem.id === row.original.id ? { ...subItem, rating: newValue } : subItem
                      )
                    };
                  }
                  return item;
                });
              });
            }}
            className="bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5 w-full"
          />
        );
      },
      enableColumnFilter: true,
    }),
  ], []);

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      expanded: isTreeMode ? {} : undefined, // In tree mode, start with expanded rows
      grouping: !isTreeMode && groupBy ? [groupBy] : [],
    },
    getRowCanExpand: row => isTreeMode && !!row.original.subRows?.length,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(data);
    }
  }, [data, onDataChange]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2 text-card-foreground">Display Mode:</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsTreeMode(true)}
                variant={isTreeMode ? "default" : "outline"}>
                Tree Mode
              </Button>
              <Button
                onClick={() => setIsTreeMode(false)}
                variant={!isTreeMode ? "default" : "outline"}>
                Group Mode
              </Button>
            </div>
          </div>
        </div>
        
        {/* Panel Type Filter Dropdown */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2 text-card-foreground">Filter by Component Type:</h3>
          <div className="flex items-center gap-2">
            <div className="w-60">
              <Select value={selectedType} onValueChange={filterByType}>
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
            <Button onClick={() => filterByType('All')} variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" /> Clear Filters
            </Button>
          </div>
        </div>
        
        <div className={!isTreeMode ? 'block' : 'opacity-50 pointer-events-none'}>
          <h3 className="font-semibold mb-2 text-card-foreground">Group By:</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setGroupBy("type")} 
              variant={groupBy === 'type' ? "default" : "outline"}>
              Component Type
            </Button>
            <Button 
              onClick={() => setGroupBy("voltage")} 
              variant={groupBy === 'voltage' ? "default" : "outline"}>
              Voltage Rating
            </Button>
            <Button 
              onClick={() => setGroupBy("manufacturer")} 
              variant={groupBy === 'manufacturer' ? "default" : "outline"}>
              Manufacturer
            </Button>
            <Button 
              onClick={() => setGroupBy("")} 
              variant="secondary">
              Clear Grouping
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={addRow} variant="default" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" /> Add Component
          </Button>
          <Button onClick={deleteSelectedRows} variant="destructive">
            <Trash className="w-4 h-4 mr-1" /> Delete Selected
          </Button>
          <Button 
            onClick={addEmptySeparators} 
            variant="outline" 
            className="bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-800">
            <Plus className="w-4 h-4 mr-1" /> Add Separator Rows
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
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                // Skip rendering empty separator rows in tree mode
                if (isTreeMode && row.original.isEmpty) {
                  return null;
                }
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={
                      row.original.isEmpty
                        ? "h-4 bg-gray-50 empty-separator"
                        : row.original.isHeader
                        ? "bg-blue-100 font-semibold"
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell 
                        key={cell.id}
                        className={
                          row.original.isEmpty
                            ? "py-0 h-4"
                            : undefined
                        }
                      >
                        {row.original.isEmpty
                          ? null
                          : flexRender(cell.column.columnDef.cell, cell.getContext())
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TanStackPanelTable;
