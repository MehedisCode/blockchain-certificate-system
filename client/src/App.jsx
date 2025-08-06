import React, { useState } from 'react';
import Login from './pages/Login';
import Routing from './Components/Routing';

function App() {
  const [userAddress, setUserAddress] = useState(null);

  return (
    <div>
      {!userAddress ? (
        <Login setUserAddress={setUserAddress} />
      ) : (
        <Routing userAddress={userAddress} />
      )}
    </div>
  );
}

export default App;
