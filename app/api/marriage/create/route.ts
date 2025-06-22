import { QueryResult, ZKPassport, ProofResult } from "@zkpassport/sdk";
import { stringToBytes32, generateMarriageId } from "../../../../lib/web3";

interface SpouseData {
  uniqueIdentifier: string;
  proofs: ProofResult[];
  queryResult: QueryResult;
}

export const config = {
  runtime: "edge",
};

export async function POST(request: Request) {
  try {
    const {
      spouse1,
      spouse2,
      walletAddress, // eslint-disable-line @typescript-eslint/no-unused-vars
      domain,
    }: {
      spouse1: SpouseData;
      spouse2: SpouseData;
      walletAddress?: string;
      domain: string;
    } = await request.json();

    const zkpassport = new ZKPassport(domain);

    // Verify both spouses
    const spouse1Verification = await zkpassport.verify({
      proofs: spouse1.proofs,
      queryResult: spouse1.queryResult,
      devMode: true,
    });

    const spouse2Verification = await zkpassport.verify({
      proofs: spouse2.proofs,
      queryResult: spouse2.queryResult,
      devMode: true,
    });

    if (!spouse1Verification.verified || !spouse2Verification.verified) {
      return Response.json({ 
        success: false,
        error: "Spouse verification failed"
      }, { status: 400 });
    }

    let spouse1IdentifierLOLUseThis = spouse1.uniqueIdentifier;// spouse1Verification.uniqueIdentifier;
    let spouse2IdentifierLOLUseThis = spouse2.uniqueIdentifier;// spouse2Verification.uniqueIdentifier;

    console.log("Creating marriage for:", {
      spouse1: spouse1IdentifierLOLUseThis,
      spouse2: spouse2IdentifierLOLUseThis,
    });


    // Create marriage on blockchain using real smart contract
    const spouse1Nullifier = stringToBytes32(spouse1IdentifierLOLUseThis!);
    const spouse2Nullifier = stringToBytes32(spouse2IdentifierLOLUseThis!);
    const marriageId = generateMarriageId(spouse1IdentifierLOLUseThis!, spouse2IdentifierLOLUseThis!);
    const proof1Hash = stringToBytes32(JSON.stringify(spouse1.proofs));
    const proof2Hash = stringToBytes32(JSON.stringify(spouse2.proofs));

    // Note: For Edge Runtime, we can't directly call the smart contract
    // The actual blockchain transaction should be done from the frontend
    // For now, we'll prepare the transaction data
    const marriageResult = {
      success: true,
      marriageId: marriageId,
      spouse1Nullifier,
      spouse2Nullifier,
      proof1Hash,
      proof2Hash,
      requiresWalletTransaction: true
    };

    if (!marriageResult.success) {
      return Response.json({ 
        success: false,
        error: marriageResult.error
      }, { status: 400 });
    }

    // const spouse1UniqueIdentifier = await hashWithSalt(
    //   spouse1Verification.uniqueIdentifier!, "spouse1");

    // const spouse2UniqueIdentifier = await hashWithSalt(
    //   spouse2Verification.uniqueIdentifier!, "spouse1");

    // Generate marriage proof - Edge runtime compatible version
    // Note: Real circom proof generation would happen in a separate service
    // due to Edge runtime limitations with heavy cryptographic libraries
    const marriageProof = await generateSimulatedMarriageProof(
      spouse1IdentifierLOLUseThis!, // spouse1Verification.uniqueIdentifier!,
      spouse2IdentifierLOLUseThis!, // spouse2Verification.uniqueIdentifier!,
      marriageResult.marriageId as string
    );

    return Response.json({ 
      success: true,
      marriageId: marriageResult.marriageId,
      marriageProof,
      spouse1Id: spouse1IdentifierLOLUseThis,
      spouse2Id: spouse2IdentifierLOLUseThis,
      contractData: {
        spouse1Nullifier: marriageResult.spouse1Nullifier,
        spouse2Nullifier: marriageResult.spouse2Nullifier,
        proof1Hash: marriageResult.proof1Hash,
        proof2Hash: marriageResult.proof2Hash
      },
      requiresWalletTransaction: marriageResult.requiresWalletTransaction
    });

  } catch (error) {
    console.error("Marriage creation error:", error);
    return Response.json({ 
      success: false,
      error: "Marriage creation failed"
    }, { status: 500 });
  }
}

// Hashes a value with a salt using SHA-256 and returns a hex string
export async function hashWithSalt(value: string | undefined, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value || "" + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // Convert buffer to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Edge runtime compatible marriage proof generation
// In production, this would be replaced with actual circom proof generation
async function generateSimulatedMarriageProof(
  spouse1Id: string,
  spouse2Id: string,
  marriageId: string
): Promise<string> {

  console.log("Generating simulated marriage proof for:", spouse1Id, stringToField(spouse1Id));
  // Simulate circom proof structure for compatibility
  const proofData = {
    proof: {
      pi_a: ["simulated_a1", "simulated_a2", "1"],
      pi_b: [["simulated_b1", "simulated_b2"], ["simulated_b3", "simulated_b4"], ["1", "0"]],
      pi_c: ["simulated_c1", "simulated_c2", "1"],
      protocol: "groth16",
      curve: "bn128"
    },
    publicSignals: [
      stringToField(marriageId),
      Math.floor(Date.now() / 1000).toString(),
      stringToField(spouse1Id)
    ],
    isValid: true,
    timestamp: Date.now()
  };

  const encoded = Buffer.from(JSON.stringify(proofData)).toString('base64');
  return `zkproof_${encoded}`;
}

// Simple field conversion for consistency with circom
function stringToField(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash % 21888242871839275222246405745257275088548364400416034343698204186575808495617).toString();
}