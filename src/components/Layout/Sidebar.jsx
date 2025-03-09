import React, { useContext } from 'react';
import { FiHome, FiPieChart, FiBarChart2, FiMap, FiBox, FiUsers, FiSettings } from 'react-icons/fi';
import { FilterContext } from '../../context/FilterContext';
import FilterSection from '../Filters/FilterSection';

const Sidebar = ({ isOpen }) => {
  const { filters, updateFilter, filterOptions } = useContext(FilterContext);
  
  const navItems = [
    { icon: <FiHome size={20} />, label: 'Dashboard', active: true },
    { icon: <FiPieChart size={20} />, label: 'Analytics', active: false },
    { icon: <FiSettings size={20} />, label: 'Settings', active: false },
  ];

  return (
    <div 
      className={`bg-white shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
      style={{ overflowX: 'hidden' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {isOpen ? (
            <h1 className="text-xl font-bold text-indigo-700">Sales Dashboard</h1>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-2xl font-bold text-indigo-700">SD</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mb-8">
          <ul>
            {navItems.map((item, index) => (
              <li key={index} className="mb-2">
                <a
                  href="#"
                  className={`flex items-center py-2 px-3 rounded-md ${
                    item.active 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {isOpen && <span>{item.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Filters - Only show when sidebar is expanded */}
        {isOpen && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Filters
            </h2>
            
            {/* Region Filter */}
            <FilterSection
              title="Region"
              options={filterOptions.regions || []}
              selected={filters.regions}
              onChange={(value) => updateFilter('regions', value)}
            />
            
            {/* Country Filter */}
            <FilterSection
              title="Country"
              options={filterOptions.countries || []}
              selected={filters.countries}
              onChange={(value) => updateFilter('countries', value)}
            />
            
            {/* Category Filter */}
            <FilterSection
              title="Category"
              options={filterOptions.categories || []}
              selected={filters.categories}
              onChange={(value) => updateFilter('categories', value)}
            />
            
            {/* Status Filter */}
            <FilterSection
              title="Order Status"
              options={filterOptions.statuses || []}
              selected={filters.statuses}
              onChange={(value) => updateFilter('statuses', value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;