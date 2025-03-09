import React, { useState, useContext, useRef, useEffect } from 'react';
import { FiMenu, FiCalendar, FiUser, FiBell, FiSearch, FiDownload, FiChevronDown } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FilterContext } from '../../context/FilterContext';
import { addMonths, subMonths, subYears, subWeeks, startOfYear, endOfMonth, format } from 'date-fns';

const Header = ({ onToggleSidebar }) => {
  const { filters, updateFilter } = useContext(FilterContext);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const datePickerRef = useRef(null);
  const dateDropdownRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setDatePickerOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setDateDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    
    // Only update if both dates are selected
    if (start && end) {
      updateFilter('dateRange', { startDate: start, endDate: end });
      setDatePickerOpen(false);
    }
  };

  const formatDateRange = () => {
    const { startDate, endDate } = filters.dateRange;
    const startStr = format(startDate, 'MMM d, yyyy');
    const endStr = format(endDate, 'MMM d, yyyy');
    return `${startStr} - ${endStr}`;
  };

  const toggleDatePicker = () => {
    setDatePickerOpen(!datePickerOpen);
    setDateDropdownOpen(false);
  };
  
  const toggleDateDropdown = () => {
    setDateDropdownOpen(!dateDropdownOpen);
    setDatePickerOpen(false);
  };

  const handleExport = () => {
    alert('Exporting dashboard data...');
    // Implement export functionality
  };
  
  // Preset date ranges adjusted for dataset with dates up to 2017
  const dateRanges = [
    { 
      label: 'All Data', 
      range: () => ({
        startDate: new Date('2013-01-01'),
        endDate: new Date('2017-12-31')
      })
    },
    { 
      label: 'Year 2016', 
      range: () => ({
        startDate: new Date('2016-01-01'),
        endDate: new Date('2016-12-31')
      })
    },
    { 
      label: 'Year 2017', 
      range: () => ({
        startDate: new Date('2017-01-01'),
        endDate: new Date('2017-12-31')
      })
    },
    { 
      label: 'Last 6 Months of 2017', 
      range: () => ({
        startDate: new Date('2017-07-01'),
        endDate: new Date('2017-12-31')
      })
    },
    { 
      label: 'Q1 2017', 
      range: () => ({
        startDate: new Date('2017-01-01'),
        endDate: new Date('2017-03-31')
      })
    },
    { 
      label: 'Q2 2017', 
      range: () => ({
        startDate: new Date('2017-04-01'),
        endDate: new Date('2017-06-30')
      })
    },
    { 
      label: 'Q3 2017', 
      range: () => ({
        startDate: new Date('2017-07-01'),
        endDate: new Date('2017-09-30')
      })
    },
    { 
      label: 'Q4 2017', 
      range: () => ({
        startDate: new Date('2017-10-01'),
        endDate: new Date('2017-12-31')
      })
    },
  ];
  
  const applyDateRange = (rangeFn) => {
    updateFilter('dateRange', rangeFn());
    setDateDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
          
          <div className="ml-6 relative">
            <div className="flex items-center text-gray-700 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <FiSearch className="ml-3 mr-1 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="py-2 pl-1 pr-3 w-64 rounded-md focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Enhanced Date Range Controls */}
          <div className="flex space-x-2">
            {/* Preset Ranges Button */}
            <div className="relative" ref={dateDropdownRef}>
              <button
                className="flex items-center bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-2 cursor-pointer"
                onClick={toggleDateDropdown}
              >
                <span className="text-sm text-gray-700">Quick Select</span>
                <FiChevronDown className="ml-2 text-gray-500" />
              </button>
              
              {dateDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48">
                  <ul className="py-1">
                    {dateRanges.map((range, idx) => (
                      <li key={idx}>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => applyDateRange(range.range)}
                        >
                          {range.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Date Range Picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                className="flex items-center bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md px-3 py-2 cursor-pointer"
                onClick={toggleDatePicker}
              >
                <FiCalendar className="mr-2 text-indigo-600" />
                <span className="text-sm text-gray-700">{formatDateRange()}</span>
              </button>
              
              {datePickerOpen && (
                <div className="absolute right-0 mt-2 z-10">
                  <DatePicker
                    selected={filters.dateRange.startDate}
                    onChange={handleDateChange}
                    startDate={filters.dateRange.startDate}
                    endDate={filters.dateRange.endDate}
                    selectsRange
                    inline
                    calendarClassName="bg-white shadow-lg rounded-lg border border-gray-200"
                    minDate={new Date('2013-01-01')}
                    maxDate={new Date('2017-12-31')}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Export Button */}
          <button 
            onClick={handleExport}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            <FiDownload className="mr-2" />
            <span>Export</span>
          </button>
          
          {/* Notification */}
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <FiBell size={20} />
          </button>
          
          {/* User Profile */}
          <button className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <FiUser size={18} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;