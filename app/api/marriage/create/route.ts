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

    console.log("Creating marriage for:", {
      spouse1: spouse1Verification.uniqueIdentifier,
      spouse2: spouse2Verification.uniqueIdentifier,
    });

    // Create marriage on blockchain using real smart contract
    const spouse1Nullifier = stringToBytes32(spouse1Verification.uniqueIdentifier!);
    const spouse2Nullifier = stringToBytes32(spouse2Verification.uniqueIdentifier!);
    const marriageId = generateMarriageId(spouse1Verification.uniqueIdentifier!, spouse2Verification.uniqueIdentifier!);
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

    // Generate marriage proof (ZK proof)
    const marriageProof = await generateMarriageProof(
      spouse1Verification.uniqueIdentifier!,
      spouse2Verification.uniqueIdentifier!,
      marriageResult.marriageId as string
    );

    return Response.json({ 
      success: true,
      marriageId: marriageResult.marriageId,
      marriageProof,
      spouse1Id: spouse1Verification.uniqueIdentifier,
      spouse2Id: spouse2Verification.uniqueIdentifier,
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

// Generate marriage proof using circom circuit
async function generateMarriageProof(
  spouse1Id: string,
  spouse2Id: string, 
  marriageId: string
): Promise<string> {
  // In a real implementation, this would:
  // 1. Use the circom circuit from modifications/marriage_proof.circom
  // 2. Generate a ZK proof that proves the marriage without revealing identities
  // 3. Return the proof as a hex string or JSON
  
  // For now, we'll generate a simulated proof
  const proofData = {
    marriageId,
    timestamp: Date.now(),
    spouse1Hash: hashString(spouse1Id),
    spouse2Hash: hashString(spouse2Id),
    isMarried: true,
  };
  
  // Simulate ZK proof generation
  const proof = Buffer.from(JSON.stringify(proofData)).toString('base64');
  return `zkproof_${proof}`;
}

