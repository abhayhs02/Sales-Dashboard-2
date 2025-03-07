import React from 'react';

const SimpleGeoMap = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded">
      <div className="text-center p-4">
        <div className="text-gray-500 mb-2">Geographic Map Visualization</div>
        <div className="text-sm text-gray-400">
          Data available for {new Set(data.map(d => d.CountryName)).size} countries
        </div>
      </div>
    </div>
  );
};

export default SimpleGeoMap;