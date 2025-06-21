# ZK Marriage Registry - Deployment Guide

This guide walks you through deploying and configuring the ZK Marriage Registry smart contract for use with the application.

## Prerequisites

1. **Foundry** - Install from [getfoundry.sh](https://getfoundry.sh/)
2. **Node.js** - For the Next.js application
3. **Wallet** - MetaMask or similar with testnet ETH
4. **RPC Provider** - Infura, Alchemy, or similar

## 1. Smart Contract Deployment

### Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Deployment
PRIVATE_KEY=0x... # Your deployer private key (DO NOT commit this)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key

# Application
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_MARRIAGE_REGISTRY_ADDRESS=0x... # Will be filled after deployment
```

### Deploy the Contract

1. **Compile the contract:**
   ```bash
   forge build
   ```

2. **Run tests:**
   ```bash
   forge test
   ```

3. **Deploy to Sepolia testnet:**
   ```bash
   forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
   ```

4. **Copy the deployed contract address** from the output and update `NEXT_PUBLIC_MARRIAGE_REGISTRY_ADDRESS` in your `.env` file.

### Alternative: Deploy to Local Development

For local development, you can use Anvil (local Ethereum node):

1. **Start Anvil:**
   ```bash
   anvil
   ```

2. **Deploy locally:**
   ```bash
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

## 2. Application Configuration

### Environment Variables

Update your `.env.local` file for the Next.js application:

```bash
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_MARRIAGE_REGISTRY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Install Dependencies

```bash
npm install
```

## 3. Smart Contract Functions

The deployed contract provides these key functions:

### Creating a Marriage
```solidity
function createMarriage(
    bytes32 marriageId,
    bytes32 spouse1Nullifier,
    bytes32 spouse2Nullifier,
    bytes32 proof1Hash,
    bytes32 proof2Hash
) external
```

### Checking Marriage Status
```solidity
function getMarriageStatusByNullifier(bytes32 nullifier) 
    external view returns (bool isMarried, bytes32 marriageId, uint256 marriageDate)
```

### Getting Marriage Details
```solidity
function getMarriage(bytes32 marriageId) 
    external view returns (
        bytes32 spouse1Nullifier,
        bytes32 spouse2Nullifier,
        uint256 marriageDate,
        bool isActive,
        string memory jurisdiction
    )
```

## 4. Testing the Integration

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Visit `http://localhost:3000`
   - Click "Get Married"
   - Connect your wallet
   - Generate QR codes for both spouses
   - Scan with zkPassport mobile app
   - Complete the marriage ceremony

### Contract Interaction

The application will:
1. Verify zkPassport proofs off-chain
2. Check marriage status on the smart contract
3. Create marriage transactions via MetaMask
4. Generate ZK marriage proofs

## 5. Production Deployment

### Mainnet Deployment

**⚠️ WARNING:** This is a demo application. Do not deploy to mainnet without thorough security audits and legal compliance.

For production:
1. Use mainnet RPC URLs
2. Deploy with proper security measures
3. Implement real zkPassport verifier integration
4. Add proper access controls
5. Conduct security audits

### Vercel Deployment

Deploy the Next.js app to Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## 6. Troubleshooting

### Common Issues

1. **Transaction Failures:**
   - Check that wallet has sufficient ETH for gas
   - Verify contract address is correct
   - Ensure user is not already married

2. **RPC Issues:**
   - Verify RPC URL is accessible
   - Check API key limits
   - Try alternative RPC providers

3. **Wallet Connection:**
   - Ensure MetaMask is installed
   - Switch to correct network (Sepolia)
   - Check wallet permissions

### Contract Verification

Verify your contract on Etherscan for transparency:

```bash
forge verify-contract \
    --chain-id 11155111 \
    --num-of-optimizations 200 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address)" 0x1111111111111111111111111111111111111111) \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --compiler-version v0.8.19+commit.7dd6d404 \
    0xYOUR_CONTRACT_ADDRESS \
    src/RealMarriageRegistry.sol:RealMarriageRegistry
```

## Security Considerations

- **Private Keys:** Never commit private keys to version control
- **Testnet Only:** This is a demo - use testnets only
- **Audit Required:** Get professional security audit before any real use
- **Legal Compliance:** Ensure compliance with local marriage laws
- **Data Privacy:** Handle personal data according to privacy regulations

## Support

For issues with:
- **Smart Contract:** Check Foundry documentation
- **zkPassport SDK:** Visit zkPassport documentation
- **Deployment:** Review this guide and check environment variables