# 🎓 Blockchain Certificate System

A decentralized web application (dApp) that allows educational institutions to register on-chain and issue tamper-proof certificates using blockchain technology.

## 🛠️ Features

- 🏫 Add and manage institute information
- 📜 Store course and certificate data securely
- 🔐 Uses Ethereum smart contracts (Solidity)
- 🌐 Frontend built with React + Vite
- 🔗 Deployment on Sepolia testnet via Infura

## 📦 Tech Stack

- **Smart Contracts:** Solidity + Hardhat
- **Frontend:** React (Vite) + Ethers.js
- **Network:** Ethereum Sepolia Testnet
- **Wallet:** MetaMask

## ⚙️ Requirements

- Node.js v22.17.0
- MetaMask wallet
- Infura project ID (for Sepolia)

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/blockchain-certificate-system.git
cd blockchain-certificate-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Compile Contracts

```bash
node scripts/copyAbis.js
```

### 5. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 6. Update .env

```bash
VITE_INSTITUTION_ADDRESS=0xYourNewContractAddress
```

### 7. Start the Frontend

```bash
npm run dev
```
