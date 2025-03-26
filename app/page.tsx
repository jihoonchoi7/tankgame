import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to 3D Tank Game</h1>
      <p className="text-xl mb-8 max-w-3xl">
        Control a powerful tank in a 3D world. Use WASD to move around and SPACE to shoot lasers!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mb-12">
        <Link 
          href="/game"
          className="group flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <h2 className="text-2xl font-semibold mb-3">
            Play Now{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </h2>
          <p className="text-gray-600">
            Jump into the action and start controlling your tank right away!
          </p>
        </Link>
        
        <div className="flex flex-col items-center p-6 border border-gray-300 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3">Controls</h2>
          <ul className="text-left text-gray-600">
            <li><strong>W</strong> - Move forward</li>
            <li><strong>S</strong> - Move backward</li>
            <li><strong>A</strong> - Turn left</li>
            <li><strong>D</strong> - Turn right</li>
            <li><strong>Q/E</strong> - Rotate turret</li>
            <li><strong>F</strong> - Switch weapon (Main Gun/Machine Gun)</li>
            <li><strong>SPACE</strong> - Fire weapon</li>
          </ul>
        </div>
      </div>
      
      <div className="w-full max-w-4xl bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">About the Game</h2>
        <p className="text-gray-700">
          This game is built with Three.js and React. It features a detailed 3D tank model with realistic
          movement controls, a laser shooting mechanism, and an interactive environment. Explore the virtual
          world and test your tank's capabilities!
        </p>
      </div>
    </div>
  );
}
