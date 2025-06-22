import * as snarkjs from "snarkjs";
import path from "path";
import fs from "fs";

// Utility to convert string to field element for circom
export function stringToField(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive and within field size
  return Math.abs(hash % 21888242871839275222246405745257275088548364400416034343698204186575808495617).toString();
}

// Generate a marriage secret based on both spouse identifiers
export function generateMarriageSecret(spouse1Id: string, spouse2Id: string): string {
  const combined = [spouse1Id, spouse2Id].sort().join("_");
  return stringToField(combined + "_marriage_secret");
}

// Generate marriage proof using circom circuit
export async function generateMarriageProof(
  spouse1Id: string,
  spouse2Id: string,
  marriageId: string,
  requesterNullifier: string
): Promise<{
  proof: any;
  publicSignals: any;
  isValid: boolean;
  error?: string;
}> {
  try {
    const circuitsPath = path.join(process.cwd(), 'circuits');
    const wasmPath = path.join(circuitsPath, 'simple_marriage_proof_js', 'simple_marriage_proof.wasm');
    const zkeyPath = path.join(circuitsPath, 'marriage_proof_0001.zkey');
    
    // Check if files exist
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
      return {
        proof: null,
        publicSignals: null,
        isValid: false,
        error: "Circuit files not found. Please compile the circuit first."
      };
    }

    // Convert inputs to field elements
    const spouse1Nullifier = stringToField(spouse1Id);
    const spouse2Nullifier = stringToField(spouse2Id);
    const marriageSecret = generateMarriageSecret(spouse1Id, spouse2Id);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Prepare circuit inputs
    const input = {
      spouse1Nullifier,
      spouse2Nullifier,
      marriageSecret,
      marriageId: stringToField(marriageId),
      timestamp,
      requesterNullifier: stringToField(requesterNullifier)
    };

    console.log("Generating proof with inputs:", {
      ...input,
      marriageSecret: "[HIDDEN]" // Don't log the secret
    });

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    // Verify the proof
    const vkeyPath = path.join(circuitsPath, 'verification_key.json');
    const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return {
      proof,
      publicSignals,
      isValid
    };

  } catch (error) {
    console.error("Error generating marriage proof:", error);
    return {
      proof: null,
      publicSignals: null,
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Verify a marriage proof
export async function verifyMarriageProof(
  proof: any,
  publicSignals: any
): Promise<boolean> {
  try {
    const circuitsPath = path.join(process.cwd(), 'circuits');
    const vkeyPath = path.join(circuitsPath, 'verification_key.json');
    
    if (!fs.existsSync(vkeyPath)) {
      console.error("Verification key not found");
      return false;
    }

    const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
  } catch (error) {
    console.error("Error verifying marriage proof:", error);
    return false;
  }
}

// Encode proof for storage/transmission
export function encodeProof(proof: any, publicSignals: any): string {
  const proofData = {
    proof,
    publicSignals,
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(proofData)).toString('base64');
}

// Decode proof from storage/transmission
export function decodeProof(encodedProof: string): { proof: any; publicSignals: any; timestamp: number } | null {
  try {
    const proofData = JSON.parse(Buffer.from(encodedProof, 'base64').toString());
    return proofData;
  } catch (error) {
    console.error("Error decoding proof:", error);
    return null;
  }
}