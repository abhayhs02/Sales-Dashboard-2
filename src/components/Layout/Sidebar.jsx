import React, { useContext } from 'react';
import { FiHome, FiPieChart, FiSettings } from 'react-icons/fi';
import { FilterContext } from '../../context/FilterContext';
import FilterSection from '../Filters/FilterSection';
import Switch from 'react-switch';
import useDarkMode from '../../hooks/useDarkMode'; // Import the custom hook

const Sidebar = ({ isOpen }) => {
  const { filters, updateFilter, filterOptions } = useContext(FilterContext);
  const [isDarkMode, toggleDarkMode] = useDarkMode(); // Use the custom hook

  const navItems = [
    { icon: <FiHome size={20} />, label: 'Dashboard', active: true },
    { icon: <FiPieChart size={20} />, label: 'Analytics', active: false },
    { icon: <FiSettings size={20} />, label: 'Settings', active: false },
  ];

  return (
    <div
      className={`transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} shadow-lg`}
      style={{ overflowX: 'hidden' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {isOpen ? (
            <h1 className={`text-xl font-bold text-indigo-700 ${isDarkMode ? 'text-indigo-400' : ''}`}>
              Sales Dashboard
            </h1>
          ) : (
            <div className="w-full flex justify-center">
              <span className={`text-2xl font-bold text-indigo-700 ${isDarkMode ? 'text-indigo-400' : ''}`}>
                SD
              </span>
            </div>
          )}
          {isOpen && (
            <Switch
              onChange={toggleDarkMode}
              checked={isDarkMode}
              onColor="#86d3ff"
              onHandleColor="#2693e6"
              handleDiameter={20}
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={28}
              width={48}
              className="react-switch"
            />
          )}
        </div>

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

        {isOpen && (
          <div className="mt-6 border-t pt-6 border-gray-200">
            <FilterSection
              title="Region"
              options={filterOptions.regions || []}
              selected={filters.regions}
              onChange={(value) => updateFilter('regions', value)}
            />

            <FilterSection
              title="Country"
              options={filterOptions.countries || []}
              selected={filters.countries}
              onChange={(value) => updateFilter('countries', value)}
            />

            <FilterSection
              title="Category"
              options={filterOptions.categories || []}
              selected={filters.categories}
              onChange={(value) => updateFilter('categories', value)}
            />

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