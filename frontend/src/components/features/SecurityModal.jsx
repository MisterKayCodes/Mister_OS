// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { X, Shield, Smartphone, Laptop, Trash2, Globe } from 'lucide-react';
import { getSessionsApi, deleteSessionApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function SecurityModal({ token, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessionsApi(token);
      setSessions(data);
    } catch (err) {
      showToast("Error loading devices: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBoot = async (id) => {
    try {
      await deleteSessionApi(id, token);
      setSessions(sessions.filter(s => s.id !== id));
      showToast("Device booted successfully", "success");
    } catch (err) {
      showToast("Failed to boot device: " + err.message, "error");
    }
  };

  const getDeviceIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('android') || lower.includes('ios')) return <Smartphone className="text-blue-500" />;
    if (lower.includes('pc') || lower.includes('mac') || lower.includes('windows')) return <Laptop className="text-gray-600" />;
    return <Globe className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
            <Shield className="text-red-500" size={20} />
            God Mode: Device Manager
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-6">
            These are all the devices currently holding an active session. If you don't recognize a device, boot it immediately.
          </p>

          {loading ? (
            <div className="text-center text-sm text-gray-400 py-4">Scanning active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-4">No active sessions found.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map(session => {
                const isCurrent = session.token === token;
                return (
                  <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCurrent ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {getDeviceIcon(session.device_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                          {session.device_name}
                          {isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">This Device</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {session.ip_address || "Unknown"} • Active: {new Date(session.last_active).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {!isCurrent && (
                      <button
                        onClick={() => handleBoot(session.id)}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} /> Boot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
