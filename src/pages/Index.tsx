
import React, { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";

// Sample data for the table
const tableData = [
  { id: 1, name: "John Doe", age: 25, gender: "Male", city: "New York", progress: 78 },
  { id: 2, name: "Jane Smith", age: 32, gender: "Female", city: "London", progress: 92 },
  { id: 3, name: "Michael Johnson", age: 41, gender: "Male", city: "Paris", progress: 64 },
  { id: 4, name: "Sarah Williams", age: 29, gender: "Female", city: "Tokyo", progress: 85 },
  { id: 5, name: "David Brown", age: 37, gender: "Male", city: "Sydney", progress: 71 },
  { id: 6, name: "Emily Davis", age: 24, gender: "Female", city: "Berlin", progress: 96 },
  { id: 7, name: "Robert Miller", age: 45, gender: "Male", city: "Toronto", progress: 58 },
  { id: 8, name: "Jennifer Wilson", age: 31, gender: "Female", city: "Madrid", progress: 82 },
];

const Index = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulator = useRef<Tabulator | null>(null);

  useEffect(() => {
    if (tableRef.current) {
      // Initialize Tabulator
      tabulator.current = new Tabulator(tableRef.current, {
        data: tableData,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 5,
        paginationSizeSelector: [5, 10, 20, 50],
        movableColumns: true,
        responsiveLayout: "collapse",
        columns: [
          { title: "ID", field: "id", sorter: "number", headerFilter: true },
          { title: "Name", field: "name", sorter: "string", headerFilter: true },
          { title: "Age", field: "age", sorter: "number", headerFilter: "number" },
          { title: "Gender", field: "gender", sorter: "string", headerFilter: true },
          { title: "City", field: "city", sorter: "string", headerFilter: true },
          {
            title: "Progress",
            field: "progress",
            sorter: "number",
            formatter: "progress",
            formatterParams: {
              color: ["#eb4034", "#f7b731", "#4CAF50"],
              legend: true
            }
          },
        ],
      });
    }

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
          <h1 className="text-3xl font-bold mb-6">Interactive Data Table</h1>
          <p className="text-gray-600 mb-6">
            This is an example of a Tabulator table with sorting, filtering, and pagination.
            Try clicking on column headers to sort, using the filter inputs, or changing the number of rows displayed.
          </p>
          <div ref={tableRef} className="mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
