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

    // Decode the simulated proof (Edge runtime compatible)
    const proofData = decodeSimulatedProof(proofData_base64);
    if (!proofData) {
      return Response.json({
        isValid: false,
        error: "Invalid proof format - could not decode"
      });
    }

    // Verify the simulated proof structure
    if (!proofData.isValid || !proofData.proof || !proofData.publicSignals) {
      return Response.json({
        isValid: false,
        error: "Invalid proof structure"
      });
    }

    // Extract marriage details from public signals
    const proofResult = await extractMarriageDetails(userIdentifier, proofData);

    return Response.json(proofResult);

  } catch (error) {
    console.error("Marriage verification error:", error);
    return Response.json({
      isValid: false,
      error: "Marriage verification failed"
    }, { status: 500 });
  }
}

// Edge runtime compatible proof decoding
function decodeSimulatedProof(encodedProof: string): { 
  proof: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  publicSignals: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  timestamp: number; 
  isValid: boolean; 
} | null {
  try {
    const proofData = JSON.parse(Buffer.from(encodedProof, 'base64').toString());
    return proofData;
  } catch (error) {
    console.error("Error decoding proof:", error);
    return null;
  }
}

async function extractMarriageDetails(
  userIdentifier: string, 
  proofData: { proof: any; publicSignals: any; timestamp: number } // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<{
  isValid: boolean;
  error?: string;
  marriageId?: string;
  marriageDate?: number;
  spouseName?: string;
  isActive?: boolean;
}> {
  try {
    // Extract data from public signals
    // Public signals for our circuit: [marriageId, timestamp, requesterNullifier]
    const [marriageId, timestamp, requesterNullifier] = proofData.publicSignals;

    console.log("Extracted from proof:", {
      marriageId,
      timestamp,
      requesterNullifier,
      userIdentifier
    });

    // Verify that the requester matches the user
    const userHash = stringToField(userIdentifier);
    if (requesterNullifier !== userHash) {
      return {
        isValid: false,
        error: "This marriage certificate does not belong to you"
      };
    }

    // Simulate blockchain verification of marriage status
    const isMarriageActive = await verifyMarriageOnBlockchain(marriageId);
    
    if (!isMarriageActive) {
      return {
        isValid: false,
        error: "Marriage has been dissolved or is not found on blockchain"
      };
    }

    return {
      isValid: true,
      marriageId: marriageId,
      marriageDate: parseInt(timestamp) * 1000, // Convert to milliseconds
      spouseName: "Your Spouse", // In a real implementation, this would be extracted from blockchain
      isActive: true,
    };

  } catch (error) {
    console.error("Error extracting marriage details:", error);
    return {
      isValid: false,
      error: "Failed to extract marriage details"
    };
  }
}

// Helper function to convert string to field (same as in circom-proof.ts)
function stringToField(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash % 21888242871839275222246405745257275088548364400416034343698204186575808495617).toString();
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

