"use client";
import { useEffect, useRef, useState } from "react";
import { ZKPassport, ProofResult, EU_COUNTRIES } from "@zkpassport/sdk";
import QRCode from "react-qr-code";

export default function VerifyPage() {
  const [passportVerified, setPassportVerified] = useState(false);
  const [marriageProof, setMarriageProof] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [queryUrl, setQueryUrl] = useState("");
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState("");
  const zkPassportRef = useRef<ZKPassport | null>(null);

  useEffect(() => {
    if (!zkPassportRef.current) {
      zkPassportRef.current = new ZKPassport(window.location.hostname);
    }
  }, []);

  const verifyPassport = async () => {
    if (!zkPassportRef.current) return;

    setMessage("");
    setQueryUrl("");
    setRequestInProgress(true);

    const queryBuilder = await zkPassportRef.current.request({
      name: "ZK Marriage Verification",
      logo: "https://zkpassport.id/favicon.png",
      purpose: "Verify your identity for marriage certificate verification",
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
      .in("issuing_country", [...EU_COUNTRIES, "Zero Knowledge Republic"])
      .disclose("firstname")
      .gte("age", 18)
      .done();

    setQueryUrl(url);

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

    onResult(async ({ result, uniqueIdentifier, verified }) => {
      if (verified) {
        setPassportVerified(true);
        setUserIdentifier(uniqueIdentifier || "");
        setMessage("✅ Passport verified! Now enter your marriage proof.");
      } else {
        setMessage("❌ Passport verification failed");
      }
      setRequestInProgress(false);
    });

    onReject(() => {
      setMessage("Request rejected");
      setRequestInProgress(false);
    });

    onError((error: unknown) => {
      console.error("Error", error);
      setMessage("An error occurred");
      setRequestInProgress(false);
    });
  };

  const verifyMarriage = async () => {
    if (!passportVerified || !marriageProof || !userIdentifier) {
      setMessage("Please verify your passport first and enter a marriage proof");
      return;
    }

    try {
      const response = await fetch("/api/marriage/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdentifier,
          marriageProof,
          domain: window.location.hostname,
        }),
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.isValid) {
        setMessage("🎉 Marriage certificate verified!");
      } else {
        setMessage("❌ Marriage certificate verification failed: " + result.error);
      }
    } catch (error) {
      console.error("Marriage verification error:", error);
      setMessage("Marriage verification failed");
    }
  };

  const reset = () => {
    setPassportVerified(false);
    setMarriageProof("");
    setVerificationResult(null);
    setMessage("");
    setQueryUrl("");
    setUserIdentifier("");
  };

  return (
    <main className="w-full h-full flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        🔍 Verify Marriage Certificate
      </h1>
      
      <div className="w-full max-w-2xl">
        {/* Step 1: Passport Verification */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Step 1: Verify Your Identity
          </h2>
          
          {queryUrl && !passportVerified && (
            <div className="flex justify-center mb-4">
              <QRCode value={queryUrl} size={200} />
            </div>
          )}
          
          {message && (
            <p className="text-center mb-4 p-3 bg-gray-100 rounded">
              {message}
            </p>
          )}
          
          {!passportVerified && !requestInProgress && (
            <button
              onClick={verifyPassport}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
            >
              Generate Identity Verification QR Code
            </button>
          )}
          
          {passportVerified && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-700 font-semibold">✅ Identity Verified</p>
            </div>
          )}
        </div>

        {/* Step 2: Marriage Proof Input */}
        {passportVerified && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Step 2: Enter Marriage Proof
            </h2>
            
            <textarea
              value={marriageProof}
              onChange={(e) => setMarriageProof(e.target.value)}
              placeholder="Paste your marriage proof here (starts with 'zkproof_')"
              className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-sm"
            />
            
            <button
              onClick={verifyMarriage}
              disabled={!marriageProof}
              className="w-full mt-4 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              🔍 Verify Marriage Certificate
            </button>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Verification Result
            </h2>
            
            {verificationResult.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="text-green-800 font-bold text-lg mb-2">
                  ✅ Marriage Certificate Valid!
                </h3>
                <div className="text-green-700">
                  <p><strong>Marriage ID:</strong> {verificationResult.marriageId}</p>
                  <p><strong>Marriage Date:</strong> {new Date(verificationResult.marriageDate).toLocaleDateString()}</p>
                  <p><strong>Spouse Name:</strong> {verificationResult.spouseName}</p>
                  <p><strong>Status:</strong> {verificationResult.isActive ? "Active" : "Dissolved"}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="text-red-800 font-bold text-lg mb-2">
                  ❌ Invalid Marriage Certificate
                </h3>
                <p className="text-red-700">{verificationResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg"
          >
            🔄 Verify Another Certificate
          </button>
          
          <a
            href="/marriage"
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg text-center"
          >
            💍 Get Married
          </a>
        </div>
      </div>
    </main>
  );
}