# Circom Proof Generation Setup

This document explains how the circom circuit integration works and how to set up real circom proof generation.

## Current Implementation

### Edge Runtime Compatibility
Due to Next.js Edge Runtime limitations, the current implementation uses **simulated proofs** that maintain the same structure as real circom proofs. This allows the application to work out-of-the-box while being ready for real circom integration.

### Circuit Files
- `circuits/simple_marriage_proof.circom` - The actual circom circuit for marriage proofs
- `circuits/marriage_proof_0001.zkey` - Proving key (generated)
- `circuits/verification_key.json` - Verification key (generated)

## Real Circom Integration

### Option 1: Separate Proof Service
For production, create a separate Node.js service for proof generation:

```javascript
// proof-service/generate-proof.js
const snarkjs = require("snarkjs");
const path = require("path");

async function generateRealMarriageProof(spouse1Id, spouse2Id, marriageId, requesterNullifier) {
  const input = {
    spouse1Nullifier: stringToField(spouse1Id),
    spouse2Nullifier: stringToField(spouse2Id),
    marriageSecret: generateMarriageSecret(spouse1Id, spouse2Id),
    marriageId: stringToField(marriageId),
    timestamp: Math.floor(Date.now() / 1000).toString(),
    requesterNullifier: stringToField(requesterNullifier)
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    path.join(__dirname, "../circuits/simple_marriage_proof_js/simple_marriage_proof.wasm"),
    path.join(__dirname, "../circuits/marriage_proof_0001.zkey")
  );

  return { proof, publicSignals };
}
```

### Option 2: Browser-Side Generation
Use `snarkjs` in the browser for client-side proof generation:

```javascript
// In the browser
import * as snarkjs from "snarkjs";

async function generateProofInBrowser(inputs) {
  const wasmResponse = await fetch("/circuits/simple_marriage_proof.wasm");
  const wasmBuffer = await wasmResponse.arrayBuffer();
  
  const zkeyResponse = await fetch("/circuits/marriage_proof_0001.zkey");
  const zkeyBuffer = await zkeyResponse.arrayBuffer();
  
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    { type: "mem", data: new Uint8Array(wasmBuffer) },
    { type: "mem", data: new Uint8Array(zkeyBuffer) }
  );
  
  return { proof, publicSignals };
}
```

### Option 3: Node.js Runtime API
Switch API routes to Node.js runtime instead of Edge:

```javascript
// Remove this line from route.ts files:
// export const config = { runtime: "edge" };

// Use the circom-proof.ts functions directly
import { generateMarriageProof } from "../../../../lib/circom-proof";

const result = await generateMarriageProof(spouse1Id, spouse2Id, marriageId, requesterNullifier);
```

## Circuit Compilation

### Prerequisites
```bash
# Install circom
npm install -g circom

# Install snarkjs
npm install snarkjs
```

### Compilation Steps
```bash
cd circuits

# Compile circuit
circom simple_marriage_proof.circom --r1cs --wasm --sym -l ../node_modules

# Generate powers of tau
npx snarkjs powersoftau new bn128 10 pot10_0000.ptau
echo "entropy" | npx snarkjs powersoftau contribute pot10_0000.ptau pot10_0001.ptau --name="First contribution"
npx snarkjs powersoftau prepare phase2 pot10_0001.ptau pot10_final.ptau

# Setup circuit
npx snarkjs groth16 setup simple_marriage_proof.r1cs pot10_final.ptau marriage_proof_0000.zkey
echo "entropy" | npx snarkjs zkey contribute marriage_proof_0000.zkey marriage_proof_0001.zkey --name="Marriage contribution"

# Export verification key
npx snarkjs zkey export verificationkey marriage_proof_0001.zkey verification_key.json
```

## Circuit Logic

The `SimpleMarriageProof` circuit proves:

1. **Identity Verification**: The requester is one of the married spouses
2. **Marriage Validity**: The marriage ID corresponds to the hash of both spouses' nullifiers
3. **Privacy**: Spouse identities remain private (only nullifiers are revealed)

### Inputs
- **Private**: `spouse1Nullifier`, `spouse2Nullifier`, `marriageSecret`
- **Public**: `marriageId`, `timestamp`, `requesterNullifier`

### Outputs
- `isMarried`: Boolean indicating valid marriage
- `proofHash`: Hash of the marriage data

## Security Considerations

### Production Deployment
1. **Trusted Setup**: Use a proper powers-of-tau ceremony for production
2. **Key Management**: Securely store proving keys
3. **Circuit Auditing**: Audit the circuit logic for security vulnerabilities
4. **Proof Verification**: Always verify proofs before accepting them

### Privacy Guarantees
- Spouse identities are never revealed in proofs
- Only nullifiers (one-way hashes) are used
- Marriage secret prevents forgery
- Zero-knowledge: no information leaked beyond validity

## Integration with Smart Contract

The marriage registry smart contract should:

1. Store marriage records with nullifiers
2. Verify proof validity on-chain (optional)
3. Check nullifier uniqueness to prevent double-spending
4. Emit events for marriage creation/dissolution

```solidity
function verifyMarriageProof(
    uint256[2] memory _pA,
    uint256[2][2] memory _pB,
    uint256[2] memory _pC,
    uint256[3] memory _publicSignals
) public view returns (bool) {
    return verifier.verifyProof(_pA, _pB, _pC, _publicSignals);
}
```

## Testing

Test the circuit with sample inputs:

```bash
# Create test input
echo '{
  "spouse1Nullifier": "123456",
  "spouse2Nullifier": "789012", 
  "marriageSecret": "secret123",
  "marriageId": "999999",
  "timestamp": "1640995200",
  "requesterNullifier": "123456"
}' > input.json

# Generate proof
npx snarkjs groth16 prove marriage_proof_0001.zkey input.json proof.json public.json

# Verify proof
npx snarkjs groth16 verify verification_key.json public.json proof.json
```

## Migration Path

1. **Phase 1**: Use simulated proofs (current)
2. **Phase 2**: Deploy proof generation service
3. **Phase 3**: Integrate real circom proofs
4. **Phase 4**: Add on-chain verification

This allows for gradual migration while maintaining functionality throughout the process.