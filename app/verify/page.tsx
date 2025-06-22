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
      .in("issuing_country", [...EU_COUNTRIES, "Zero Knowledge Republic", "Ukraine"])
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

        let firstName = result?.firstname?.disclose?.result || "";
        let uniqueIdentifier1 = uniqueIdentifier + firstName || "";

        setPassportVerified(true);
        setUserIdentifier(uniqueIdentifier1 || "");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="container mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🔍 Verify Marriage Certificate
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Verify the authenticity of a zero-knowledge marriage certificate while maintaining complete privacy.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Identity Verification */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-blue-100 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Verify Your Identity</h2>
                <p className="text-gray-600">Scan with zkPassport to prove you can access this certificate</p>
              </div>
            </div>
            
            {queryUrl && !passportVerified && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <QRCode value={queryUrl} size={240} />
                </div>
              </div>
            )}
            
            {message && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-gray-700 font-medium">{message}</p>
                </div>
              </div>
            )}
            
            {!passportVerified && !requestInProgress && (
              <button
                onClick={verifyPassport}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  📱 Generate Identity QR Code
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            )}

            {requestInProgress && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-700 font-medium">Waiting for scan...</span>
                </div>
              </div>
            )}
            
            {passportVerified && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Identity Verified! ✅</h3>
                    <p className="text-gray-600">You can now verify marriage certificates</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Marriage Proof Input */}
          {passportVerified && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-purple-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Enter Marriage Proof</h2>
                  <p className="text-gray-600">Paste the zero-knowledge marriage certificate to verify</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marriage Certificate (ZK Proof)
                </label>
                <textarea
                  value={marriageProof}
                  onChange={(e) => setMarriageProof(e.target.value)}
                  placeholder="Paste your marriage proof here (starts with 'zkproof_')..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-xl font-mono text-sm bg-gray-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
              </div>
              
              <button
                onClick={verifyMarriage}
                disabled={!marriageProof}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                <span className="flex items-center justify-center">
                  🔍 Verify Marriage Certificate
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </button>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200 mb-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Verification Result</h2>
              </div>
              
              {verificationResult.isValid ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">
                      ✅ Certificate Valid!
                    </h3>
                    <p className="text-green-700">This marriage certificate is cryptographically valid</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Marriage ID</div>
                      <div className="font-mono text-sm text-gray-800 break-all">
                        {verificationResult.marriageId}
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className="font-semibold text-green-600">
                        {verificationResult.isActive ? "💚 Active Marriage" : "💔 Dissolved"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-red-800 mb-2">
                      ❌ Invalid Certificate
                    </h3>
                    <p className="text-red-700">{verificationResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="group px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                🔄 Verify Another Certificate
                <svg className="w-5 h-5 ml-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
            </button>
            
            <a
              href="/marriage"
              className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                💍 Get Married
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}