import React from 'react';

const SimpleForceGraph = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded">
      <div className="text-center p-4">
        <div className="text-gray-500 mb-2">Network Graph Visualization</div>
        <div className="text-sm text-gray-400">
          Showing relationships between {new Set(data.map(d => d.ProductName)).size} products
        </div>
      </div>
    </div>
  );
};

export default SimpleForceGraph;