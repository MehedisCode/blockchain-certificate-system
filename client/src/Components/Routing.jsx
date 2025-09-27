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
import ModifyInstitutePage from '../pages/ModifyInstitutePage';

// Layout Wrapper
const DynamicLayoutRoute = ({ children, userRole }) => {
  return (
    <>
      <NavBarLanding userRole={userRole} />
      {children}
    </>
  );
};

const Routing = ({ institutionContract, userAddress, userRole }) => {
  return (
    <div className="App" style={{ backgroundColor: '#fafafa' }}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="LANDING">
                <Home />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/certificate"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="CERTIFICATE">
                <GenerateCert userAddress={userAddress} />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/certificate/:id"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="VIEWCERTBYID">
                <CertificatePage />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/view-certificate"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="VIEWCERT">
                <ViewCertificate />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/add-institute"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="ADDINSTITUTE">
                <AddInstitutePage
                  institutionContract={institutionContract}
                  userAddress={userAddress}
                />
              </DynamicLayoutRoute>
            }
          />
          <Route
            path="/modify-institute"
            element={
              <DynamicLayoutRoute userRole={userRole} layout="MODIFY">
                <ModifyInstitutePage />
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
