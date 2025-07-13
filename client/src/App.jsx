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
import GenerateCert from './Components/GenerateCert';

// Pages
import CertificatePage from './Components/CertificatePage';
import Home from './Components/Home';
import NavBarInstitute from './Components/NavbarInstitute';

// Layout Wrapper
const DynamicLayoutRoute = ({ layout, children }) => {
  switch (layout) {
    case 'INSTITUTE': {
      return (
        <>
          <NavBarInstitute />
          {children}
        </>
      );
    }
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
          <Route
            path="/institute"
            element={
              <DynamicLayoutRoute layout="INSTITUTE">
                <GenerateCert />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/certificate/:id"
            element={
              <DynamicLayoutRoute layout="LANDING">
                <CertificatePage />
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
