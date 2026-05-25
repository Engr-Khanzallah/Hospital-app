import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    API.get('/departments').then(({ data }) => setDepartments(data.departments || [])).catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{ departments, specialties }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
