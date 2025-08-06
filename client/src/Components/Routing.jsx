import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import '../App.css';

// Nav
import NavBarLanding from './NavBarLanding';
import GenerateCert from './InstitutePage';

// Pages
import CertificatePage from './CertificatePage';
import Home from './Home';
import NavBarInstitute from './NavbarInstitute';
import ViewCertificate from './ViewCertificate';

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

const Routing = ({ userAddress }) => {
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
                <GenerateCert userAddress={userAddress} />
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
          <Route
            path="/view-certificate"
            element={
              <DynamicLayoutRoute layout="LANDING">
                <ViewCertificate />
              </DynamicLayoutRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default Routing;
