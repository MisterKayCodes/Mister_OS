import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const { toast, hideToast } = useToast();

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        toast.isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${
        toast.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'
      } max-w-sm w-full`}>
        {toast.type === 'error' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle size={20} className="shrink-0" />}
        <p className="text-sm font-medium flex-1 whitespace-pre-wrap">{toast.message}</p>
        <button onClick={hideToast} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
