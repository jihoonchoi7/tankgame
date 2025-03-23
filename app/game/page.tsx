"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the Game component with no SSR to avoid hydration issues
const Game = dynamic(() => import('../components/tank'), {
  ssr: false,
});

export default function GamePage() {
  return (
    <div className="w-full h-screen bg-black">
      <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-white">Loading...</div>}>
        <Game />
      </Suspense>
    </div>
  );
} 