import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CSVLink } from 'react-csv';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Papa from 'papaparse';

// Fix for Leaflet marker issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const GeographicMap = () => {
  const [mapData, setMapData] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('products');
  const [csvData, setCsvData] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState([]);
  const [warehouseCoordinates, setWarehouseCoordinates] = useState({});
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [zoomLevel, setZoomLevel] = useState(2);

  const [drillLevel, setDrillLevel] = useState('country');
  const [currentFilter, setCurrentFilter] = useState(null);

  const fetchWarehouseCoordinates = useCallback(async (warehouseName) => {
    const mockCoordinates = {
      'Warehouse A': [34.0522, -118.2437],
      'Warehouse B': [40.7128, -74.0060],
      'Warehouse C': [51.5074, 0.1278],
      'Warehouse D': [35.6895, 139.6917],
    };

    return mockCoordinates[warehouseName] || [0, 0];
  }, []);

  const parseCSVData = (csvText) => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(results.errors);
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const fetchCSVData = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/abhayhs02/Sales-Dashboard-2/refs/heads/main/src/MLDataset.csv'
      );
      const csvText = await response.text();
      const data = await parseCSVData(csvText);
      setCsvData(data);
      console.log('Fetched CSV Data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching or parsing CSV data:', error);
      return null;
    }
  };

  const getColor = (value) => {
    if (!mapData || mapData.length === 0) {
      return 'gray';
    }
    const minValue = Math.min(...mapData.map((item) => item.value));
    const maxValue = Math.max(...mapData.map((item) => item.value));

    const normalizedValue = (value - minValue) / (maxValue - minValue);

    const green = Math.round(255 * (1 - normalizedValue));
    const red = Math.round(255 * (1 - normalizedValue));
    return `rgb(${red}, ${green}, 0)`;
  };

  const aggregateData = useCallback((data, filter, drill, current) => {
    if (!data) return null;

    const aggregatedData = {};

    data.forEach((item) => {
      const region = item.RegionName || 'Unknown';
      const country = item.CountryName || 'Unknown';
      const state = item.State || 'Unknown';
      const city = item.City || 'Unknown';
      const warehouseName = item.WarehouseName || 'Unknown';
      const postalCode = item.PostalCode || 'Unknown';

      if (current && drill !== 'country' && item[current.type] !== current.name) {
        return;
      }

      let value;
      switch (filter) {
        case 'products':
          value = item.OrderItemQuantity || 0;
          break;
        case 'employees':
          value = 1;
          break;
        case 'inventory':
          value = item.ProductStandardCost || 0;
          break;
        default:
          value = 0;
      }

      let locationName;
      let locationType;

      switch (drill) {
        case 'country':
          locationName = country;
          locationType = 'country';
          break;
        case 'state':
          locationName = state;
          locationType = 'state';
          break;
        case 'city':
          locationName = city;
          locationType = 'city';
          break;
        case 'warehouse':
          locationName = warehouseName;
          locationType = 'warehouse';
          break;
        default:
          return;
      }

      if (!aggregatedData[locationName]) {
        aggregatedData[locationName] = {
          name: locationName,
          value: 0,
          type: locationType,
        };
      }
      aggregatedData[locationName].value += value;
    });

    const aggregatedArray = Object.values(aggregatedData);

    console.log('Aggregated Data:', aggregatedArray);
    setMapData(aggregatedArray);
    return aggregatedArray;
  }, []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then((response) => response.json())
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch((error) => console.error('Error fetching GeoJSON:', error));
  }, []);

  useEffect(() => {
    const fetchDataAndAggregate = async () => {
      const data = await fetchCSVData();
      if (data) {
        aggregateData(data, selectedFilter, drillLevel, currentFilter);
      }
    };

    fetchDataAndAggregate();
  }, [aggregateData, selectedFilter, drillLevel, currentFilter]);

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const mapContentStyle = {
    transform: 'scaleY(0.8) !important',
    transformOrigin: 'center center !important',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Dropdown Filter */}
      <select
        value={selectedFilter}
        onChange={handleFilterChange}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px',
          fontSize: '14px',
        }}
      >
        <option value="products">Products</option>
        <option value="employees">Employees</option>
        <option value="inventory">Inventory</option>
      </select>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{
          width: '100%',
          height: '500px',
          pointerEvents: 'none',
        }}
        zoomControl={false}
        dragging={false} // Disable dragging
        doubleClickZoom={false} // Disable double-click zoom
        scrollWheelZoom={false} // Disable scroll wheel zoom
        touchZoom={false} // Disable touch zoom
      >
        <div style={mapContentStyle}>
          <TileLayer
            url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            noWrap={true}
          />
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={(feature) => {
                const featureName = feature.properties.name;
                const dataPoint = mapData
                  ? mapData.find((item) => item.name === featureName)
                  : null;
                const value = dataPoint ? (dataPoint ? dataPoint.value : 0) : 0;
                const fillColor = getColor(value);

                return {
                  fillColor: fillColor,
                  weight: 1,
                  opacity: 1,
                  color: 'gray',
                  fillOpacity: 0.7,
                  pointerEvents: 'none',
                };
              }}
            />
          )}
        </div>
      </MapContainer>
    </div>
  );
};

export default GeographicMap;