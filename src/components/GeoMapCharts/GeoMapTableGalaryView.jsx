import React from 'react';
import unknownImageUrl from './unknow_image.jpg'; // Import the image

const GeoMapTableGalaryView = ({ employee, onClose }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9f7f0', // Light background color
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '300px',
  };

  const imageStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '10px',
  };

  const sectionStyle = {
    backgroundColor: '#f2e9e4', // Light segment background
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    marginRight: '5px',
  };

  const closeButtonStyle = {
    backgroundColor: '#e76f51', // A more prominent color
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    alignSelf: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <img src={unknownImageUrl} alt={employee.EmployeeName} style={imageStyle} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{employee.EmployeeName}</div>
          <div>{employee.JobTitle}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Email:</span>
        <span>{employee.EmployeeEmail}</span>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Phone:</span>
        <span>{employee.PhoneNo}</span>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Country:</span>
        <span>{employee.Country}</span>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>State:</span>
        <span>{employee.State}</span>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>City:</span>
        <span>{employee.City}</span>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Warehouse Address:</span>
        <span>{employee.WarehouseAddress}</span>
      </div>
      <button style={closeButtonStyle} onClick={onClose}>Close</button>
    </div>
  );
};

export default GeoMapTableGalaryView;