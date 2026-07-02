// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function AuthScreen({ onLogin }) {
  const [tokenInput, setTokenInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(tokenInput);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-4 text-black"><LogIn size={32} /></div>
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Mister OS</h2>
        <input 
          type="password" 
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-black" 
          placeholder="Master Token"
        />
        <button type="submit" className="w-full bg-black text-white p-2 rounded font-medium hover:bg-gray-800 transition">
          Access
        </button>
      </form>
    </div>
  );
}
