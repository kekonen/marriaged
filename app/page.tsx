"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-16">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Privacy Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8 border border-purple-100">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Zero-Knowledge Verified</span>
            <svg className="w-4 h-4 ml-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 bg-clip-text text-transparent leading-tight">
            Love in the
            <br />
            <span className="text-5xl md:text-6xl">Zero-Knowledge Era</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get married on-chain with complete privacy. Prove your eligibility without revealing your identity. 
            <br />
            <span className="text-purple-600 font-semibold">Your love story, cryptographically secured.</span>
          </p>

          {/* Flow Diagram */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
              {/* Prover */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-xl mb-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Prover</h3>
                <p className="text-sm text-gray-600">You with zkPassport</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center">
                <div className="h-px w-16 bg-gradient-to-r from-pink-300 to-purple-300"></div>
                <svg className="w-6 h-6 text-purple-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="h-px w-16 bg-gradient-to-r from-purple-300 to-blue-300"></div>
              </div>

              {/* ZK Protocol */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-xl mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">ZK Protocol</h3>
                <p className="text-sm text-gray-600">Circom + Groth16</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center">
                <div className="h-px w-16 bg-gradient-to-r from-purple-300 to-blue-300"></div>
                <svg className="w-6 h-6 text-blue-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="h-px w-16 bg-gradient-to-r from-blue-300 to-green-300"></div>
              </div>

              {/* Verifier */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Verifier</h3>
                <p className="text-sm text-gray-600">Smart Contract</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link 
              href="/marriage"
              className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                💍 Get Married Privately
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            
            <Link 
              href="/verify"
              className="group px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                🔍 Verify Certificate
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Why Choose ZK Marriage?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Complete Privacy</h3>
              <p className="text-gray-600">Your personal details never leave your device. Only cryptographic proofs are shared.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Cryptographically Secure</h3>
              <p className="text-gray-600">Built on battle-tested zk-SNARK technology with Groth16 proofs on Ethereum.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Instant Verification</h3>
              <p className="text-gray-600">Prove your marriage status instantly without revealing any personal information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">What Couples Say</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-pink-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  A
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Alice & Bob</h4>
                  <p className="text-sm text-gray-600">Privacy Advocates</p>
                </div>
              </div>
              <p className="text-gray-700 italic">&quot;Finally, we can prove our marriage without sharing our personal documents with third parties. The ZK proofs give us complete peace of mind.&quot;</p>
              <div className="flex mt-4 text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  C
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Carol & Dave</h4>
                  <p className="text-sm text-gray-600">Web3 Builders</p>
                </div>
              </div>
              <p className="text-gray-700 italic">&quot;The future of marriage certificates! Love how we can verify our status on-chain while keeping our data private. Brilliant technology.&quot;</p>
              <div className="flex mt-4 text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">ZK Marriage Registry</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Bringing privacy-preserving marriage verification to the blockchain. 
              Built with ❤️ for the decentralized future.
            </p>
          </div>
          
          <div className="flex justify-center space-x-6 mb-8">
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm">🔒 Zero-Knowledge</span>
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm">⛓️ On-Chain</span>
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm">🛡️ Private</span>
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm">⚡ Instant</span>
          </div>
          
          <p className="text-gray-500 text-sm">
            © 2035 Marriaged. Built for privacy, powered by love.
          </p>
        </div>
      </footer>
    </div>
  );
}
