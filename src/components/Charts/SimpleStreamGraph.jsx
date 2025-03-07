import React from 'react';

const SimpleStreamGraph = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded">
      <div className="text-center p-4">
        <div className="text-gray-500 mb-2">Time-Series Analysis</div>
        <div className="text-sm text-gray-400">
          Showing trends for {new Set(data.map(d => d.CategoryName)).size} categories over time
        </div>
      </div>
    </div>
  );
};

export default SimpleStreamGraph;