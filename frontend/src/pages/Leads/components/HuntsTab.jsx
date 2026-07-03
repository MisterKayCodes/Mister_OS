import React, { useState, useEffect } from 'react';
import { Crosshair, Users, Send, AlertTriangle } from 'lucide-react';
import { fetchHuntsApi, updateAdminLeadApi } from '../../../utils/huntsApi';

export default function HuntsTab({ token }) {
  const [channels, setChannels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('admins'); // admins | channels

  useEffect(() => {
    fetchHuntsApi(token)
      .then(data => { setChannels(data.channels || []); setAdmins(data.admins || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const handleStatusChange = async (admin, newStatus) => {
    try {
      const updated = await updateAdminLeadApi(admin.id, { status: newStatus }, token);
      setAdmins(admins.map(a => a.id === admin.id ? updated : a));
    } catch (e) { alert(e.message); }
  };

  const freshAdmins  = admins.filter(a => a.status === 'fresh');
  const manualAdmins = admins.filter(a => a.status === 'manual_review');
  const sentAdmins   = admins.filter(a => a.status === 'outreach_sent');

  if (loading) return <div className="text-gray-400 text-sm text-center pt-16">Loading hunt data...</div>;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Sub tab */}
      <div className="flex gap-3 border-b border-gray-100 pb-0">
        {[['admins', 'Admin Usernames'], ['channels', 'Scraped Channels']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium border-b-2 transition ${tab === key ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'admins' && (
        <>
          {/* Fresh Admins */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Crosshair size={14} className="text-red-500" /> Fresh Admins ({freshAdmins.length})
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {freshAdmins.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center">No fresh admin leads. Run the Hunt worker to populate.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <tr><th className="p-3 text-left">Username</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Actions</th></tr>
                  </thead>
                  <tbody>
                    {freshAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">@{admin.username}</td>
                        <td className="p-3 text-gray-500 text-xs capitalize">{admin.source}</td>
                        <td className="p-3">
                          <button onClick={() => handleStatusChange(admin, 'dead')}
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">Mark Dead</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Outreach Sent */}
          {sentAdmins.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Send size={14} className="text-blue-400" /> Outreach Sent ({sentAdmins.length})
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <tr><th className="p-3 text-left">Username</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Contacted</th></tr>
                  </thead>
                  <tbody>
                    {sentAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-gray-100">
                        <td className="p-3 text-gray-700">@{admin.username}</td>
                        <td className="p-3 text-gray-500 text-xs capitalize">{admin.source}</td>
                        <td className="p-3 text-gray-400 text-xs">{admin.contacted_at ? new Date(admin.contacted_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manual Review */}
          {manualAdmins.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Manual Review ({manualAdmins.length})
              </h3>
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-100 text-xs text-amber-700 font-medium">
                    <tr><th className="p-3 text-left">Channel</th><th className="p-3 text-left">Actions</th></tr>
                  </thead>
                  <tbody>
                    {manualAdmins.map(admin => (
                      <tr key={admin.id} className="border-t border-amber-100">
                        <td className="p-3 text-amber-900 font-medium">{admin.username.replace('MANUAL:', '')}</td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => handleStatusChange(admin, 'dead')}
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Dead</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'channels' && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={14} className="text-blue-500" /> Scraped Channels ({channels.length})
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {channels.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 text-center">No channels scraped yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                  <tr><th className="p-3 text-left">Channel</th><th className="p-3 text-left">Members</th><th className="p-3 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {channels.map(ch => (
                    <tr key={ch.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">@{ch.username || ch.tg_id}</td>
                      <td className="p-3 text-gray-500 text-xs">{ch.members_count?.toLocaleString() || '—'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.status === 'scanned' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ch.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
