import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia } from 'viem/chains';

// Contract ABI for MarriageRegistry (simplified)
export const MARRIAGE_REGISTRY_ABI = [
  {
    "inputs": [
      {"name": "marriageId", "type": "bytes32"},
      {"name": "spouse1Nullifier", "type": "bytes32"},
      {"name": "spouse2Nullifier", "type": "bytes32"},
      {"name": "proof1Hash", "type": "bytes32"},
      {"name": "proof2Hash", "type": "bytes32"}
    ],
    "name": "createMarriage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "nullifier", "type": "bytes32"}],
    "name": "getMarriageStatusByNullifier",
    "outputs": [
      {"name": "isMarried", "type": "bool"},
      {"name": "marriageId", "type": "bytes32"},
      {"name": "marriageDate", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "marriageId", "type": "bytes32"}],
    "name": "getMarriage",
    "outputs": [
      {"name": "spouse1Nullifier", "type": "bytes32"},
      {"name": "spouse2Nullifier", "type": "bytes32"},
      {"name": "marriageDate", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "jurisdiction", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "nullifier", "type": "bytes32"}],
    "name": "isNullifierUsed",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address from environment variables
export const MARRIAGE_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_MARRIAGE_REGISTRY_ADDRESS || '0x1234567890123456789012345678901234567890') as `0x${string}`;

// RPC URL from environment variables
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';

// Create public client for reading from blockchain
export const publicClient = createPublicClient({
  chain: sepolia, // Use Sepolia testnet for development
  transport: http(RPC_URL)
});

// Create wallet client for writing to blockchain (requires browser wallet)
export function createWalletClientFromBrowser() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    });
  }
  return null;
}

// Contract interaction helpers
export class MarriageRegistryContract {
  
  static async getMarriageStatus(nullifier: `0x${string}`) {
    try {
      const result = await publicClient.readContract({
        address: MARRIAGE_REGISTRY_ADDRESS,
        abi: MARRIAGE_REGISTRY_ABI,
        functionName: 'getMarriageStatusByNullifier',
        args: [nullifier]
      });
      
      return {
        isMarried: result[0],
        marriageId: result[1],
        marriageDate: result[2]
      };
    } catch (error) {
      console.error('Error checking marriage status:', error);
      return { isMarried: false, marriageId: '0x0', marriageDate: 0n };
    }
  }

  static async getMarriage(marriageId: `0x${string}`) {
    try {
      const result = await publicClient.readContract({
        address: MARRIAGE_REGISTRY_ADDRESS,
        abi: MARRIAGE_REGISTRY_ABI,
        functionName: 'getMarriage',
        args: [marriageId]
      });
      
      return {
        spouse1Nullifier: result[0],
        spouse2Nullifier: result[1],
        marriageDate: result[2],
        isActive: result[3],
        jurisdiction: result[4]
      };
    } catch (error) {
      console.error('Error getting marriage details:', error);
      return null;
    }
  }

  static async createMarriage(
    marriageId: `0x${string}`,
    spouse1Nullifier: `0x${string}`,
    spouse2Nullifier: `0x${string}`,
    proof1Hash: `0x${string}`,
    proof2Hash: `0x${string}`
  ) {
    const walletClient = createWalletClientFromBrowser();
    if (!walletClient) {
      throw new Error('No wallet connection available');
    }

    const [account] = await walletClient.getAddresses();
    
    try {
      const hash = await walletClient.writeContract({
        address: MARRIAGE_REGISTRY_ADDRESS,
        abi: MARRIAGE_REGISTRY_ABI,
        functionName: 'createMarriage',
        args: [marriageId, spouse1Nullifier, spouse2Nullifier, proof1Hash, proof2Hash],
        account
      });

      // Wait for transaction confirmation
      const transaction = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        success: true,
        transactionHash: hash,
        blockNumber: transaction.blockNumber
      };
    } catch (error) {
      console.error('Error creating marriage on blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Utility functions
export function stringToBytes32(str: string): `0x${string}` {
  // Simple hash function to convert string to bytes32
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 bytes
  const hex = Math.abs(hash).toString(16);
  return `0x${'0'.repeat(64 - hex.length)}${hex}` as `0x${string}`;
}

export function generateMarriageId(spouse1Id: string, spouse2Id: string): `0x${string}` {
  const combined = [spouse1Id, spouse2Id].sort().join('_') + Date.now();
  return stringToBytes32(combined);
}