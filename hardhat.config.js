require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: '0.8.30',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    // Optional: Add testnets here
  },
};
