import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import MainLayout from './components/Layout/MainLayout';
import DashboardView from './components/DashboardView';
import { DataContext } from './context/DataContext';
import { FilterContext } from './context/FilterContext';

// Initial filter state
const initialFilters = {
  dateRange: {
    startDate: new Date('2013-01-01'),
    endDate: new Date('2018-01-01')
  },
  regions: [],
  countries: [],
  categories: [],
  statuses: []
};

function App() {
  // Main data state
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState(initialFilters);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch real data
        try {
          const response = await fetch('/MLDataset.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Process the data
              const processedData = results.data.map(row => ({
                ...row,
                OrderDate: row.OrderDate ? new Date(row.OrderDate) : null,
                EmployeeHireDate: row.EmployeeHireDate ? new Date(row.EmployeeHireDate) : null,
                // Calculate total amount for convenience
                TotalAmount: (row.OrderItemQuantity || 0) * (row.PerUnitPrice || 0)
              }));
              
              setData(processedData);
              setIsLoading(false);
            },
            error: (error) => {
              console.error("CSV parsing error:", error);
              throw new Error('Failed to parse CSV data');
            }
          });
        } catch (fileError) {
          console.warn('Could not load CSV file, using mock data:', fileError);
          
          // Use mock data as fallback
          setData(getMockData());
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Data fetching error:', error);
        setError("Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoized filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    return data.filter(row => {
      // Date range filter
      const orderDate = row.OrderDate;
      const inDateRange = !orderDate || 
        (orderDate >= filters.dateRange.startDate && 
         orderDate <= filters.dateRange.endDate);
      
      // Region filter
      const inRegion = !filters.regions.length || 
        filters.regions.includes(row.RegionName);
      
      // Country filter
      const inCountry = !filters.countries.length || 
        filters.countries.includes(row.CountryName);
      
      // Category filter
      const inCategory = !filters.categories.length || 
        filters.categories.includes(row.CategoryName);
      
      // Status filter
      const inStatus = !filters.statuses.length || 
        filters.statuses.includes(row.Status);
      
      return inDateRange && inRegion && inCountry && inCategory && inStatus;
    });
  }, [data, filters]);

  // Memoized filter options to prevent recalculation on every render
  const filterOptions = useMemo(() => {
    if (!data.length) return {};
    
    return {
      regions: [...new Set(data.map(row => row.RegionName))].filter(Boolean),
      countries: [...new Set(data.map(row => row.CountryName))].filter(Boolean),
      categories: [...new Set(data.map(row => row.CategoryName))].filter(Boolean),
      statuses: [...new Set(data.map(row => row.Status))].filter(Boolean)
    };
  }, [data]);

  // Filter update handler
  const updateFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Mock data for fallback
  function getMockData() {
    return [
      {
        RegionName: "North America",
        CountryName: "United States",
        CategoryName: "Electronics",
        ProductName: "Laptop",
        OrderDate: new Date("2016-05-15"),
        OrderItemQuantity: 5,
        PerUnitPrice: 1200,
        Profit: 1500,
        Status: "Shipped"
      },
      {
        RegionName: "Europe",
        CountryName: "Germany",
        CategoryName: "Furniture",
        ProductName: "Office Chair",
        OrderDate: new Date("2016-06-22"),
        OrderItemQuantity: 10,
        PerUnitPrice: 120,
        Profit: 300,
        Status: "Delivered"
      },
      {
        RegionName: "Asia",
        CountryName: "Japan",
        CategoryName: "Electronics",
        ProductName: "Smartphone",
        OrderDate: new Date("2016-07-10"),
        OrderItemQuantity: 20,
        PerUnitPrice: 600,
        Profit: 2000,
        Status: "Processing"
      }
    ];
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading dashboard data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-6">
        <div className="text-xl font-semibold text-red-600 mb-4">Error: {error}</div>
        <div className="text-gray-600 max-w-lg text-center">
          <p className="mb-2">Make sure you have placed the MLDataset.csv file in the public folder of your project.</p>
          <p>Alternatively, click below to continue with sample data.</p>
        </div>
        <button 
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => { setData(getMockData()); setError(null); }}
        >
          Use Sample Data
        </button>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ data: filteredData, allData: data }}>
      <FilterContext.Provider value={{ 
        filters, 
        updateFilter, 
        resetFilters, 
        filterOptions 
      }}>
        <MainLayout 
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        >
          <DashboardView />
        </MainLayout>
      </FilterContext.Provider>
    </DataContext.Provider>
  );
}

export default App;