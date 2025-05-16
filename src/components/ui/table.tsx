
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { 
    isHeader?: boolean;
    isEmpty?: boolean;
  }
>(({ className, isHeader, isEmpty, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors",
      isHeader 
        ? "bg-primary-100 hover:bg-primary-200 font-semibold" 
        : isEmpty 
          ? "h-4 bg-gray-50"
          : "hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Modified TableQuantityCell with parent relationship functionality
const TableQuantityCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { 
    value?: number; 
    onChange?: (value: number) => void;
    min?: number;
    isHeader?: boolean;
    parentId?: string;
    childItems?: Array<{id: string, quantity: number}>;
    onChildrenUpdate?: (parentId: string, multiplier: number) => void;
  }
>(({ 
  className, 
  value = 1, 
  onChange, 
  min = 1, 
  isHeader = false,
  parentId,
  childItems,
  onChildrenUpdate,
  ...props 
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    
    // Calculate multiplier for children if this is a header
    if (isHeader && childItems && onChildrenUpdate) {
      const multiplier = newValue / (value || 1);
      onChildrenUpdate(props['data-id'] as string, multiplier);
    }
    
    if (onChange) onChange(newValue);
  };
  
  return (
    <td
      ref={ref}
      className={cn(
        "p-2 align-middle", 
        isHeader && "bg-primary-100",
        className
      )}
      {...props}
    >
      <div className={cn("flex items-center", isHeader ? "justify-center" : "justify-center")}>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          className={cn(
            "w-16 text-center p-1 border rounded",
            isHeader && "font-semibold border-primary-300"
          )}
        />
      </div>
    </td>
  );
})
TableQuantityCell.displayName = "TableQuantityCell"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableQuantityCell
}
