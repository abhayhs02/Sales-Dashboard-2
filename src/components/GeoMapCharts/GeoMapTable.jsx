import React from 'react';
import unknownImageUrl from './unknow_image.jpg'; // Import the image

const GeoMapTable = ({ data, onClose }) => {
  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap', // Enable wrapping to create a grid
    overflowY: 'auto',     // Enable vertical scrolling
    justifyContent: 'center', // Align items to the center
    alignItems: 'flex-start',   // Align items to the top
    gap: '20px',
    padding: '20px',
    width: '100%', // Fill the width
    height: '400px',  // set a fixed height for the container
    backgroundColor: '#f0f0f0', // Optional background color
  };

  const employeeCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '200px', // Fixed width for each card
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
        <div key={index} style={employeeCardStyle}>
          <img
            src={unknownImageUrl} // Use the imported image
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