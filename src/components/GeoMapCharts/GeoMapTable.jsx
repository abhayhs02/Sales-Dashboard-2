import React, { useState } from 'react';
import unknownImageUrl from './unknow_image.jpg';
import GeoMapTableGalaryView from './GeoMapTableGalaryView';

const GeoMapTable = ({ data }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleClosePopup = () => {
    setSelectedEmployee(null);
  };

  return (
    <div style={containerStyle}>
      {data.map((employee, index) => (
        <div
          key={index}
          style={{ ...employeeCardStyle, cursor: 'pointer' }}
          onClick={() => handleEmployeeClick(employee)}
        >
          <img
            src={unknownImageUrl}
            alt={employee.EmployeeName}
            style={imageStyle}
          />
          <div style={nameStyle}>{employee.EmployeeName}</div>
        </div>
      ))}

      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
            backdropFilter: 'blur(5px)', // Apply blur effect
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <GeoMapTableGalaryView employee={selectedEmployee} onClose={handleClosePopup} />
          
        </div>
      )}
    </div>
  );
};

export default GeoMapTable;