import { createContext } from 'react';

// Create a context for data with default values
export const DataContext = createContext({
  data: [],
  allData: []
});