import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';

// Nav
import NavBarLanding from './Components/NavBarLanding';

// Pages
import Home from './Components/Home';

// Layout Wrapper
const DynamicLayoutRoute = ({ layout, children }) => {
  switch (layout) {
    default:
      return (
        <>
          <NavBarLanding />
          {children}
        </>
      );
  }
};

const App = () => {
  return (
    <div className="App" style={{ backgroundColor: '#fafafa' }}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <DynamicLayoutRoute layout="LANDING">
                <Home />
              </DynamicLayoutRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
