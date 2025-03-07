import React, { useState, useContext, useRef } from 'react';
import { FiMenu, FiCalendar, FiUser, FiBell, FiSearch, FiDownload } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FilterContext } from '../../context/FilterContext';

const Header = ({ onToggleSidebar }) => {
  const { filters, updateFilter } = useContext(FilterContext);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

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
    const startStr = startDate.toLocaleDateString();
    const endStr = endDate.toLocaleDateString();
    return `${startStr} - ${endStr}`;
  };

  const toggleDatePicker = () => {
    setDatePickerOpen(!datePickerOpen);
  };

  const handleExport = () => {
    alert('Exporting dashboard data...');
    // Implement export functionality
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
          {/* Date Range Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 cursor-pointer"
              onClick={toggleDatePicker}
            >
              <FiCalendar className="mr-2 text-gray-500" />
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
                />
              </div>
            )}
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