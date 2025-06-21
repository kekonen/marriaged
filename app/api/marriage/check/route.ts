import { QueryResult, ZKPassport, ProofResult } from "@zkpassport/sdk";
import { MarriageRegistryContract, stringToBytes32 } from "../../../../lib/web3";

export const config = {
  runtime: "edge",
};

export async function POST(request: Request) {
  try {
    const {
      uniqueIdentifier,
      proofs,
      queryResult,
      domain,
    }: {
      uniqueIdentifier: string;
      proofs: ProofResult[];
      queryResult: QueryResult;
      domain: string;
    } = await request.json();

    const zkpassport = new ZKPassport(domain);

    const { verified } = await zkpassport.verify({
      proofs,
      queryResult,
      devMode: true,
    });

    console.log("Marriage status check - Verified:", verified);
    console.log("Unique identifier:", uniqueIdentifier);

    // Check marriage status on blockchain using the uniqueIdentifier
    const nullifierHash = stringToBytes32(uniqueIdentifier);
    
    // Check if this nullifier is already married on blockchain
    const marriageStatus = await MarriageRegistryContract.getMarriageStatus(nullifierHash);
    const isMarried = marriageStatus.isMarried;

    return Response.json({ 
      verified,
      isMarried,
      uniqueIdentifier,
    });
  } catch (error) {
    console.error("Marriage check error:", error);
    return Response.json({ 
      error: "Marriage status check failed",
      verified: false,
      isMarried: false,
    }, { status: 500 });
  }
}