import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Routing from './Components/Routing';

function App() {
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
      setUserAddress(savedAddress);
    }
  }, []);

  return (
    <div>
      {!userAddress ? (
        <Login
          setUserAddress={address => {
            setUserAddress(address);
            localStorage.setItem('userAddress', address);
          }}
        />
      ) : (
        <Routing userAddress={userAddress} />
      )}
    </div>
  );
}

export default App;
