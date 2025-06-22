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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Celebration Animation */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-20 animate-ping"></div>
            </div>
            <div className="relative">
              <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Congratulations!
              </h1>
              <div className="text-6xl mb-4 animate-bounce">🎉💑🎉</div>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-white/80 backdrop-blur-sm border border-pink-200 rounded-3xl p-8 mb-8 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {spouse1?.firstName} & {spouse2?.firstName}
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              You are now married on the blockchain! 💍
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full font-semibold shadow-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Marriage Verified On-Chain
            </div>
          </div>
          
          {/* Marriage Certificate */}
          <div className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Zero-Knowledge Marriage Certificate</h3>
            </div>
            <p className="text-gray-600 mb-6">Your privacy-preserving proof of marriage</p>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
              <div className="font-mono text-sm text-gray-700 break-all leading-relaxed">
                {marriageProof}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              This proof can verify your marriage without revealing your identities
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setMarriageComplete(false);
                setSpouse1(null);
                setSpouse2(null);
                setSpouse1Url("");
                setSpouse2Url("");
                setMarriageProof("");
              }}
              className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                💍 Marry Another Couple
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
            </button>
            <a
              href="/verify"
              className="group px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                🔍 Verify Marriage
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="container mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            💍 Get Married Privately
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create your zero-knowledge marriage certificate. Both partners scan QR codes to prove eligibility without revealing personal data.
          </p>
        </div>
        
        {/* Wallet Connection */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Connect Wallet</h3>
            </div>
            <WalletConnect 
              onConnect={setWalletAddress} 
              onDisconnect={() => setWalletAddress("")} 
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Spouse 1 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Partner One
              </h2>
              <p className="text-gray-600">Scan with zkPassport to verify eligibility</p>
            </div>
            
            {spouse1Url && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                  <QRCode value={spouse1Url} size={220} />
                </div>
              </div>
            )}
            
            {spouse1Message && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 text-center">
                  <p className="text-gray-700 font-medium">{spouse1Message}</p>
                </div>
              </div>
            )}
            
            {spouse1 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Verified! ✅</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">{spouse1.firstName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age 18+:</span>
                      <span className={spouse1.isOver18 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {spouse1.isOver18 ? "✅ Yes" : "❌ No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-semibold">Single & Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!spouse1InProgress && !spouse1 && (
              <button
                onClick={() => createSpouseRequest(1)}
                className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  📱 Generate QR Code
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            )}

            {spouse1InProgress && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500 mr-3"></div>
                  <span className="text-gray-700 font-medium">Waiting for scan...</span>
                </div>
              </div>
            )}
          </div>

          {/* Spouse 2 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Partner Two
              </h2>
              <p className="text-gray-600">Scan with zkPassport to verify eligibility</p>
            </div>
            
            {spouse2Url && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                  <QRCode value={spouse2Url} size={220} />
                </div>
              </div>
            )}
            
            {spouse2Message && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-gray-700 font-medium">{spouse2Message}</p>
                </div>
              </div>
            )}
            
            {spouse2 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Verified! ✅</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">{spouse2.firstName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age 18+:</span>
                      <span className={spouse2.isOver18 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {spouse2.isOver18 ? "✅ Yes" : "❌ No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-semibold">Single & Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!spouse2InProgress && !spouse2 && (
              <button
                onClick={() => createSpouseRequest(2)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  📱 Generate QR Code
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            )}

            {spouse2InProgress && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-700 font-medium">Waiting for scan...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Marriage Ceremony Button */}
        {spouse1 && spouse2 && (
          <div className="mt-16 text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-200 max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-4xl">💕</div>
                  <div className="mx-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="text-4xl">💕</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready for Marriage!</h3>
                <p className="text-gray-600">
                  Both partners verified. Time to create your privacy-preserving marriage certificate.
                </p>
              </div>
              
              {!walletAddress && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-amber-700 font-medium">Please connect your wallet to proceed</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={createMarriage}
                disabled={marriageInProgress || !walletAddress}
                className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 hover:from-pink-600 hover:via-purple-700 hover:to-blue-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {marriageInProgress ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Creating Marriage Certificate...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    💒 Create Marriage Certificate
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}