import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import '../App.css';

// NavBars
import NavBarLanding from './NavBarLanding';
import GenerateCert from '../pages/GenerateCertificatePage';

// Pages
import CertificatePage from './CertificatePage';
import Home from './Home';
import NavBarInstitute from './NavbarInstitute';
import ViewCertificate from './ViewCertificate';
import AddInstitutePage from '../pages/AddInstitutePage';

// Layout Wrapper
const DynamicLayoutRoute = ({ children }) => {
  return (
    <>
      <NavBarLanding />
      {children}
    </>
  );
};

const Routing = ({ institutionContract, userAddress }) => {
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
            path="/certificate"
            element={
              <DynamicLayoutRoute layout="CERTIFICATE">
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
          <Route
            path="/add-institute"
            element={
              <DynamicLayoutRoute layout="LANDING">
                <AddInstitutePage
                  institutionContract={institutionContract}
                  userAddress={userAddress}
                />
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
