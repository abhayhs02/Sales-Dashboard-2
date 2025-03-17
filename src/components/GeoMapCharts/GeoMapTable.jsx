// Updated GeoMapTable.jsx
import React, { useContext } from 'react';
import unknownImageUrl from './unknow_image.jpg';
import './GeoMapTable.css'; // Import CSS
import { DataContext } from '../../context/DataContext'; // Import DataContext

const GeoMapTable = ({ data, onEmployeeClick }) => {
  const { isDarkMode } = useContext(DataContext); // Access isDarkMode from DataContext

  return (
    <div className={`employee-table-container ${isDarkMode ? 'dark' : ''}`}>
      {data.map((employee, index) => (
        <div
          key={index}
          className={`employee-card ${isDarkMode ? 'dark' : ''}`}
          onClick={() => onEmployeeClick(employee)} // Call onEmployeeClick
        >
          <img
            src={unknownImageUrl}
            alt={employee.EmployeeName}
            className="employee-image"
          />
          <div className="employee-name">{employee.EmployeeName}</div>
        </div>
      ))}
    </div>
  );
};

export default GeoMapTable;