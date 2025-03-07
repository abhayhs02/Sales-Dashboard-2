import React, { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp, FiFilter, FiSearch, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const DataTable = ({ data }) => {
  const [sortColumn, setSortColumn] = useState('OrderDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Column definitions
  const columns = [
    { id: 'OrderDate', label: 'Order Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { id: 'CustomerName', label: 'Customer' },
    { id: 'ProductName', label: 'Product' },
    { id: 'CategoryName', label: 'Category' },
    { id: 'OrderItemQuantity', label: 'Quantity', format: (value) => value?.toLocaleString() },
    { id: 'PerUnitPrice', label: 'Unit Price', format: (value) => value ? `$${value.toLocaleString()}` : '' },
    { id: 'TotalAmount', label: 'Total Amount', format: (value) => `$${value.toLocaleString()}` },
    { id: 'Profit', label: 'Profit', format: (value) => value ? `$${value.toLocaleString()}` : '' },
    { id: 'Status', label: 'Status', format: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
        {value}
      </span>
    )}
  ];
  
  // Helper function for status colors
  const getStatusColor = (status) => {
    const statusColors = {
      'Shipped': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Canceled': 'bg-red-100 text-red-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-purple-100 text-purple-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Calculate total amount for each row
  const processedData = useMemo(() => {
    return data.map(row => ({
      ...row,
      TotalAmount: (row.OrderItemQuantity || 0) * (row.PerUnitPrice || 0)
    }));
  }, [data]);
  
  // Filter, sort, and paginate data
  const displayData = useMemo(() => {
    // Apply search filter
    let filteredData = processedData;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = processedData.filter(row => {
        return Object.keys(row).some(key => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(query);
        });
      });
    }
    
    // Apply sorting
    const sortedData = [...filteredData].sort((a, b) => {
      let valueA = a[sortColumn];
      let valueB = b[sortColumn];
      
      // Handle null values
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      // Handle dates
      if (sortColumn === 'OrderDate') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }
      
      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Handle numeric comparison
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    // Apply pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);
    
    return {
      data: paginatedData,
      totalRows: filteredData.length,
      totalPages: Math.ceil(filteredData.length / rowsPerPage)
    };
  }, [processedData, searchQuery, sortColumn, sortDirection, currentPage, rowsPerPage]);
  
  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 block w-full sm:w-64 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-600 text-sm mr-2">Rows per page:</span>
          <select 
            className="border border-gray-300 rounded p-1 text-sm"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {sortColumn === column.id && (
                      sortDirection === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              displayData.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map(column => (
                    <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {column.format ? column.format(row[column.id]) : row[column.id]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="px-4 py-3 flex items-center justify-between border-t">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(currentPage < displayData.totalPages ? currentPage + 1 : displayData.totalPages)}
            disabled={currentPage === displayData.totalPages}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * rowsPerPage + 1, displayData.totalRows)}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * rowsPerPage, displayData.totalRows)}</span> of{' '}
              <span className="font-medium">{displayData.totalRows}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage === 1}
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, displayData.totalPages) }, (_, i) => {
                // Calculate page numbers to display
                let pageNum;
                if (displayData.totalPages <= 5) {
                  // Show all pages if 5 or fewer
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  // Show first 5 pages
                  pageNum = i + 1;
                } else if (currentPage >= displayData.totalPages - 2) {
                  // Show last 5 pages
                  pageNum = displayData.totalPages - 4 + i;
                } else {
                  // Show current page and surrounding pages
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(currentPage < displayData.totalPages ? currentPage + 1 : displayData.totalPages)}
                disabled={currentPage === displayData.totalPages}
              >
                <FiArrowRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;