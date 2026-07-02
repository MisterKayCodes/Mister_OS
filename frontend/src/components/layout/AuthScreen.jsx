// Rule: Max 200 lines per file — split if exceeded
import React, { useState } from 'react';
import { LogIn, Loader } from 'lucide-react';
import { loginApi } from '../../utils/api';

export default function AuthScreen({ onLogin }) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android Device";
    if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Device";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Mac OS/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux PC";
    return "Unknown Device";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginApi(tokenInput, getDeviceName());
      onLogin(data.token); // The token is the UUID session key
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-4 text-black"><LogIn size={32} /></div>
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Mister OS</h2>
        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        <input 
          type="password" 
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-black" 
          placeholder="Master Password"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2">
          {loading ? <Loader size={18} className="animate-spin" /> : "Access"}
        </button>
      </form>
    </div>
  );
}
