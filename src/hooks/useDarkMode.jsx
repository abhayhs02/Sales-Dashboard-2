import { useState, useEffect } from 'react';

function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Get the stored theme from local storage
    const storedTheme = localStorage.getItem('theme');
    // Return true if the stored theme is 'dark', false otherwise
    return storedTheme === 'dark';
  });

  useEffect(() => {
    // Update the theme in local storage whenever isDarkMode changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Add or remove the 'dark' class from the document element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevIsDarkMode) => !prevIsDarkMode);
  };

  return [isDarkMode, toggleDarkMode];
}

export default useDarkMode;