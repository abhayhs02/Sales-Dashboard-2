import React from 'react';

const SimpleSunburstChart = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded">
      <div className="text-center p-4">
        <div className="text-gray-500 mb-2">Hierarchical View</div>
        <div className="text-sm text-gray-400">
          Region {'>'} Country {'>'} Category {'>'} Product
        </div>
      </div>
    </div>
  );
};

export default SimpleSunburstChart;