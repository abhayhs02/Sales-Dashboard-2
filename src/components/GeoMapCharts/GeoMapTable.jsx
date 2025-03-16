// Updated GeoMapTable.jsx
import React from 'react';
import unknownImageUrl from './unknow_image.jpg';

const GeoMapTable = ({ data, onEmployeeClick }) => { // Add onEmployeeClick prop
  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    overflowY: 'auto',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '20px',
    width: '100%',
    height: '400px',
    backgroundColor: '#f0f0f0',
  };

  const employeeCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '200px',
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const imageStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '10px',
  };

  const nameStyle = {
    fontSize: '1.2em',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      {data.map((employee, index) => (
        <div
          key={index}
          style={{ ...employeeCardStyle, cursor: 'pointer' }}
          onClick={() => onEmployeeClick(employee)} // Call onEmployeeClick
        >
          <img
            src={unknownImageUrl}
            alt={employee.EmployeeName}
            style={imageStyle}
          />
          <div style={nameStyle}>{employee.EmployeeName}</div>
        </div>
      ))}
    </div>
  );
};

export default GeoMapTable;