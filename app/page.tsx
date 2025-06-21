"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full h-full flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        💑 ZK Marriage Registry
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Get married in zero-knowledge! Prove you&apos;re both 18+ and single without revealing your identity.
        Create a privacy-preserving marriage certificate on the blockchain.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/marriage"
          className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg text-center transition-colors"
        >
          💍 Get Married
        </Link>
        
        <Link 
          href="/verify"
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-center transition-colors"
        >
          🔍 Verify Marriage
        </Link>
      </div>
    </main>
  );
}
