export const config = {
  runtime: "edge",
};

export async function POST(request: Request) {
  try {
    const {
      userIdentifier,
      marriageProof,
      domain,
    }: {
      userIdentifier: string;
      marriageProof: string;
      domain: string;
    } = await request.json();

    console.log("Marriage verification request:", {
      userIdentifier,
      marriageProofLength: marriageProof.length,
      domain,
    });

    // Validate marriage proof format
    if (!marriageProof.startsWith("zkproof_")) {
      return Response.json({
        isValid: false,
        error: "Invalid marriage proof format"
      });
    }

    // Decode and verify the proof
    const proofResult = await verifyMarriageProof(userIdentifier, marriageProof);

    return Response.json(proofResult);

  } catch (error) {
    console.error("Marriage verification error:", error);
    return Response.json({
      isValid: false,
      error: "Marriage verification failed"
    }, { status: 500 });
  }
}

async function verifyMarriageProof(
  userIdentifier: string, 
  marriageProof: string
): Promise<{
  isValid: boolean;
  error?: string;
  marriageId?: string;
  marriageDate?: number;
  spouseName?: string;
  isActive?: boolean;
}> {
  try {
    // Remove the "zkproof_" prefix and decode
    const proofData = marriageProof.replace("zkproof_", "");
    const decodedProof = JSON.parse(Buffer.from(proofData, 'base64').toString());

    console.log("Decoded marriage proof:", decodedProof);

    // In a real implementation, this would:
    // 1. Verify the ZK proof using the circom verifier
    // 2. Check that the proof corresponds to the user's identifier
    // 3. Verify the marriage is still active on the blockchain
    
    // Simulate proof verification
    if (!decodedProof.marriageId || !decodedProof.isMarried) {
      return {
        isValid: false,
        error: "Invalid proof structure"
      };
    }

    // Check if user is part of this marriage
    const userHash = hashString(userIdentifier);
    if (decodedProof.spouse1Hash !== userHash && decodedProof.spouse2Hash !== userHash) {
      return {
        isValid: false,
        error: "This marriage certificate does not belong to you"
      };
    }

    // Simulate blockchain verification of marriage status
    const isMarriageActive = await verifyMarriageOnBlockchain(decodedProof.marriageId);
    
    if (!isMarriageActive) {
      return {
        isValid: false,
        error: "Marriage has been dissolved or is not found on blockchain"
      };
    }

    // Determine spouse name (simulate)
    const spouseName = decodedProof.spouse1Hash === userHash ? "Partner B" : "Partner A";

    return {
      isValid: true,
      marriageId: decodedProof.marriageId,
      marriageDate: decodedProof.timestamp,
      spouseName,
      isActive: true,
    };

  } catch (error) {
    console.error("Proof verification error:", error);
    return {
      isValid: false,
      error: "Failed to verify proof"
    };
  }
}

async function verifyMarriageOnBlockchain(marriageId: string): Promise<boolean> {
  // In a real implementation, this would:
  // 1. Connect to the MarriageRegistry smart contract
  // 2. Call getMarriage(marriageId) to check if it exists and is active
  // 3. Return the result
  
  // For demo purposes, we'll simulate most marriages being valid
  const hash = marriageId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return hash % 20 !== 0; // 95% chance of being valid
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}