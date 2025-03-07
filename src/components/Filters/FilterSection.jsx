import React, { useState } from 'react';
import { FiFilter } from 'react-icons/fi';

const FilterSection = ({ title, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <FiFilter className="mr-2 text-indigo-500" />
          <h3 className="font-medium text-gray-700">{title}</h3>
        </div>
        <span className="text-xs text-gray-500">
          {selected.length ? `${selected.length} selected` : 'All'}
        </span>
      </div>
      
      {isOpen && (
        <div className="space-y-1 ml-5 max-h-40 overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-sm text-gray-500">No options available</div>
          ) : (
            options.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${title}-${option}`}
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, option]);
                    } else {
                      onChange(selected.filter(item => item !== option));
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor={`${title}-${option}`} className="ml-2 text-sm text-gray-600">
                  {option}
                </label>
              </div>
            ))
          )}
          {selected.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;