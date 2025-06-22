"use client";
import { useEffect, useRef, useState } from "react";
import { ZKPassport, ProofResult, EU_COUNTRIES } from "@zkpassport/sdk";
import QRCode from "react-qr-code";
import WalletConnect from "../../components/WalletConnect";
import { MarriageRegistryContract } from "../../lib/web3";

interface SpouseData {
  firstName: string;
  isOver18: boolean;
  uniqueIdentifier: string;
  verified: boolean;
  proofs: ProofResult[];
  queryResult: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function MarriagePage() {
  const [spouse1, setSpouse1] = useState<SpouseData | null>(null);
  const [spouse2, setSpouse2] = useState<SpouseData | null>(null);
  const [spouse1Url, setSpouse1Url] = useState("");
  const [spouse2Url, setSpouse2Url] = useState("");
  const [spouse1Message, setSpouse1Message] = useState("");
  const [spouse2Message, setSpouse2Message] = useState("");
  const [spouse1InProgress, setSpouse1InProgress] = useState(false);
  const [spouse2InProgress, setSpouse2InProgress] = useState(false);
  const [marriageInProgress, setMarriageInProgress] = useState(false);
  const [marriageComplete, setMarriageComplete] = useState(false);
  const [marriageProof, setMarriageProof] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const zkPassportRef = useRef<ZKPassport | null>(null);

  useEffect(() => {
    if (!zkPassportRef.current) {
      zkPassportRef.current = new ZKPassport(window.location.hostname);
    }
  }, []);

  const createSpouseRequest = async (spouseNumber: 1 | 2) => {
    if (!zkPassportRef.current) return;

    const setMessage = spouseNumber === 1 ? setSpouse1Message : setSpouse2Message;
    const setUrl = spouseNumber === 1 ? setSpouse1Url : setSpouse2Url;
    const setInProgress = spouseNumber === 1 ? setSpouse1InProgress : setSpouse2InProgress;
    const setSpouse = spouseNumber === 1 ? setSpouse1 : setSpouse2;

    setMessage("");
    setUrl("");
    setInProgress(true);

    const queryBuilder = await zkPassportRef.current.request({
      name: "ZK Marriage Registry",
      logo: "https://zkpassport.id/favicon.png",
      purpose: `Marriage verification for Spouse ${spouseNumber}`,
      scope: "marriage-verification",
      mode: "fast",
      devMode: true,
    });

    const {
      url,
      onRequestReceived,
      onGeneratingProof,
      onProofGenerated,
      onResult,
      onReject,
      onError,
    } = queryBuilder
      .in("issuing_country", [...EU_COUNTRIES, "Zero Knowledge Republic", "Ukraine"])
      .disclose("firstname")
      .gte("age", 18)
      .done();

    setUrl(url);

    onRequestReceived(() => {
      setMessage("QR code scanned! Generating proof...");
    });

    onGeneratingProof(() => {
      setMessage("Generating proof...");
    });

    const proofs: ProofResult[] = [];

    onProofGenerated((result: ProofResult) => {
      proofs.push(result);
      setMessage("Proof generated! Verifying...");
    });

    onResult(async ({ result, uniqueIdentifier, verified, queryResultErrors }) => {
      if (queryResultErrors && queryResultErrors.length > 0) {
        setMessage("Verification failed: " + queryResultErrors.join(", "));
        setInProgress(false);
        return;
      }

      let firstName = result?.firstname?.disclose?.result || "";

      const spouseData: SpouseData = {
        firstName: firstName,
        isOver18: result?.age?.gte?.result || false,
        uniqueIdentifier: uniqueIdentifier + firstName || "",
        verified,
        proofs,
        queryResult: result,
      };

      // todo: move check to frontend
      // Check marriage status with backend
      const marriageCheckRes = await fetch("/api/marriage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueIdentifier: spouseData.uniqueIdentifier,
          proofs,
          queryResult: result,
          domain: window.location.hostname,
        }),
      });

      const marriageStatus = await marriageCheckRes.json();
      
      if (marriageStatus.isMarried) {
        setMessage(`❌ ${spouseData.firstName} is already married!`);
      } else if (spouseData.isOver18 && spouseData.verified) {
        setSpouse(spouseData);
        setMessage(`✅ ${spouseData.firstName} verified and single!`);
      } else {
        setMessage(`❌ Verification failed for ${spouseData.firstName}`);
      }
      
      setInProgress(false);
    });

    onReject(() => {
      setMessage("Request rejected");
      setInProgress(false);
    });

    onError((error: unknown) => {
      console.error("Error", error);
      setMessage("An error occurred");
      setInProgress(false);
    });
  };

  const createMarriage = async () => {
    if (!spouse1 || !spouse2) return;
    
    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }
    
    setMarriageInProgress(true);
    
    try {
      // Create marriage on blockchain
      const marriageRes = await fetch("/api/marriage/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spouse1: {
            uniqueIdentifier: spouse1.uniqueIdentifier,
            proofs: spouse1.proofs,
            queryResult: spouse1.queryResult,
          },
          spouse2: {
            uniqueIdentifier: spouse2.uniqueIdentifier,
            proofs: spouse2.proofs,
            queryResult: spouse2.queryResult,
          },
          walletAddress,
          domain: window.location.hostname,
        }),
      });

      const marriageResult = await marriageRes.json();
      
      if (marriageResult.success && marriageResult.requiresWalletTransaction) {
        // Execute the actual blockchain transaction
        try {
          const blockchainResult = await MarriageRegistryContract.createMarriage(
            marriageResult.marriageId,
            marriageResult.contractData.spouse1Nullifier,
            marriageResult.contractData.spouse2Nullifier,
            marriageResult.contractData.proof1Hash,
            marriageResult.contractData.proof2Hash
          );
          
          if (blockchainResult.success) {
            setMarriageProof(marriageResult.marriageProof);
            setMarriageComplete(true);
            console.log("Marriage created on blockchain:", blockchainResult.transactionHash);
          } else {
            alert("Blockchain transaction failed: " + blockchainResult.error);
          }
        } catch (blockchainError) {
          console.error("Blockchain error:", blockchainError);
          alert("Failed to create marriage on blockchain: " + (blockchainError as Error).message);
        }
      } else if (marriageResult.success) {
        setMarriageProof(marriageResult.marriageProof);
        setMarriageComplete(true);
      } else {
        alert("Marriage creation failed: " + marriageResult.error);
      }
    } catch (error) {
      console.error("Marriage creation error:", error);
      alert("Marriage creation failed");
    }
    
    setMarriageInProgress(false);
  };

  if (marriageComplete) {
    return (
      <main className="w-full h-full flex flex-col items-center p-10">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎉 Congratulations!
        </h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
          <p className="text-xl font-semibold">
            {spouse1?.firstName} & {spouse2?.firstName} are now married! 💑
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Marriage Certificate (ZK Proof)</h3>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all">
            {marriageProof}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              setMarriageComplete(false);
              setSpouse1(null);
              setSpouse2(null);
              setSpouse1Url("");
              setSpouse2Url("");
              setMarriageProof("");
            }}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg"
          >
            💍 Marry Another Couple
          </button>
          <a
            href="/verify"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
          >
            🔍 Verify Marriage
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-full flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        💍 Get Married in Zero Knowledge
      </h1>
      
      <div className="mb-6">
        <WalletConnect 
          onConnect={setWalletAddress} 
          onDisconnect={() => setWalletAddress("")} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Spouse 1 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            👰 Spouse 1
          </h2>
          
          {spouse1Url && (
            <div className="flex justify-center mb-4">
              <QRCode value={spouse1Url} size={200} />
            </div>
          )}
          
          {spouse1Message && (
            <p className="text-center mb-4 p-3 bg-gray-100 rounded">
              {spouse1Message}
            </p>
          )}
          
          {spouse1 && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <p><strong>Name:</strong> {spouse1.firstName}</p>
              <p><strong>Age 18+:</strong> {spouse1.isOver18 ? "✅" : "❌"}</p>
              <p><strong>Verified:</strong> {spouse1.verified ? "✅" : "❌"}</p>
            </div>
          )}
          
          {!spouse1InProgress && !spouse1 && (
            <button
              onClick={() => createSpouseRequest(1)}
              className="w-full px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg"
            >
              Generate QR Code
            </button>
          )}
        </div>

        {/* Spouse 2 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            🤵 Spouse 2
          </h2>
          
          {spouse2Url && (
            <div className="flex justify-center mb-4">
              <QRCode value={spouse2Url} size={200} />
            </div>
          )}
          
          {spouse2Message && (
            <p className="text-center mb-4 p-3 bg-gray-100 rounded">
              {spouse2Message}
            </p>
          )}
          
          {spouse2 && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <p><strong>Name:</strong> {spouse2.firstName}</p>
              <p><strong>Age 18+:</strong> {spouse2.isOver18 ? "✅" : "❌"}</p>
              <p><strong>Verified:</strong> {spouse2.verified ? "✅" : "❌"}</p>
            </div>
          )}
          
          {!spouse2InProgress && !spouse2 && (
            <button
              onClick={() => createSpouseRequest(2)}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
            >
              Generate QR Code
            </button>
          )}
        </div>
      </div>

      {/* Marriage Button */}
      {spouse1 && spouse2 && (
        <div className="mt-8 text-center">
          <p className="text-lg mb-4">
            Both spouses verified! Ready to create your ZK marriage certificate.
          </p>
          {!walletAddress && (
            <p className="text-red-600 mb-4">
              ⚠️ Please connect your wallet to proceed with the marriage ceremony.
            </p>
          )}
          <button
            onClick={createMarriage}
            disabled={marriageInProgress || !walletAddress}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xl rounded-lg disabled:opacity-50"
          >
            {marriageInProgress ? "Creating Marriage..." : "💒 Create Marriage Certificate"}
          </button>
        </div>
      )}
    </main>
  );
}