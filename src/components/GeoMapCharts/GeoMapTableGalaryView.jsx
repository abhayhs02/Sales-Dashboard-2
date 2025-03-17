import React, { useContext } from 'react';
import unknownImageUrl from './unknow_image.jpg'; // Import the image
import './GeoMapTableGalaryView.css'; // Import CSS
import { DataContext } from '../../context/DataContext'; // Import DataContext

const GeoMapTableGalaryView = ({ employee, onClose }) => {
  const { isDarkMode } = useContext(DataContext);

  return (
    <div className={`employee-gallery-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="employee-gallery-header">
        <img src={unknownImageUrl} alt={employee.EmployeeName} className="employee-gallery-image" />
        <div>
          <div className="employee-gallery-name">{employee.EmployeeName}</div>
          <div className="employee-gallery-job-title">{employee.EmployeeJobTitle}</div>
        </div>
      </div>

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">Email:</span>
        <span>{employee.EmployeeName}</span> {/* Corrected Email Field */}
      </div>

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">Phone:</span>
        <span>{employee.EmployeePhone}</span> {/* Corrected Phone Field */}
      </div>

      {employee.EmployeeHireDate && (
        <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
          <span className="employee-gallery-label">Hire Date:</span>
          <span>{employee.EmployeeHireDate}</span>
        </div>
      )}

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">Country:</span>
        <span>{employee.CountryName}</span> {/* Corrected Country Field */}
      </div>

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">State:</span>
        <span>{employee.State}</span> {/* Corrected State Field */}
      </div>

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">City:</span>
        <span>{employee.City}</span> {/* Corrected City Field */}
      </div>

      <div className={`employee-gallery-section ${isDarkMode ? 'dark' : ''}`}>
        <span className="employee-gallery-label">Warehouse Address:</span>
        <span>{employee.WarehouseAddress}</span> {/* Corrected Warehouse Address Field */}
      </div>
      <button className={`employee-gallery-close-button ${isDarkMode ? 'dark' : ''}`} onClick={onClose}>Close</button>
    </div>
  );
};

export default GeoMapTableGalaryView;