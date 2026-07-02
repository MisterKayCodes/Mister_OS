// Rule: Max 200 lines per file — split if exceeded
import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, TrendingDown, Minus, Plus, Loader } from 'lucide-react';
import { getPriceDbApi, createVendorApi, createProductApi, createPriceLogApi } from '../../utils/financeApi';
import { useToast } from '../../context/ToastContext';

export default function PriceDbTab({ token, formatNGN }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productName: '', vendorName: '', price: '' });
  const { showToast } = useToast();

  useEffect(() => { fetchDb(); }, []);

  const fetchDb = async () => {
    setLoading(true);
    try {
      const data = await getPriceDbApi(token);
      setItems(data);
    } catch (err) {
      showToast('Error loading Price DB: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogPrice = async (e) => {
    e.preventDefault();
    if (!form.productName || !form.vendorName || !form.price) return;
    try {
      // Create or find vendor
      const vendor = await createVendorApi({ name: form.vendorName.trim() }, token);
      // Create or find product
      const product = await createProductApi({ name: form.productName.trim(), category: 'uncategorized' }, token);
      // Log price
      await createPriceLogApi({ product_id: product.id, vendor_id: vendor.id, price: parseInt(form.price) }, token);
      
      showToast('Price logged successfully!', 'success');
      setForm({ productName: '', vendorName: '', price: '' });
      setShowForm(false);
      fetchDb(); // Refresh to get inflation data
    } catch (err) {
      showToast('Error logging price: ' + err.message, 'error');
    }
  };

  const renderInflationBadge = (item) => {
    if (!item.previous_price) return <span className="text-gray-400 text-xs flex items-center gap-1"><Minus size={12} /> Baseline</span>;
    
    const diff = item.latest_price - item.previous_price;
    const pct = Math.abs(Math.round((diff / item.previous_price) * 100));
    
    if (diff > 0) {
      return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-medium"><TrendingUp size={12} /> +{pct}%</span>;
    } else if (diff < 0) {
      return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-medium"><TrendingDown size={12} /> -{pct}%</span>;
    }
    return <span className="text-gray-400 text-xs flex items-center gap-1"><Minus size={12} /> No Change</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Autonomous Price Database</h3>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition">
          <Plus size={14} /> Log Price
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleLogPrice} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Note: Mister will automatically add to this DB if you tell him a new price in Omni-Brain.</p>
          <input required value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} placeholder="Product (e.g. Geisha)" className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <div className="flex gap-2">
            <input required value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} placeholder="Vendor (e.g. Madam Tochi)" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Price ₦" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Save to Database</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader className="animate-spin text-gray-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Database size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Price database is empty.</p>
          <p className="text-xs mt-1">Tell Omni-Brain: "Mister, Geisha is now 1500 at Madam Tochi."</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Latest Price</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inflation Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={`${item.product.id}-${item.latest_vendor.id}`} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium text-gray-800 text-sm">{item.product.name}</td>
                  <td className="p-4 text-sm text-gray-500">{item.latest_vendor.name}</td>
                  <td className="p-4 text-sm font-bold text-gray-900">{formatNGN(item.latest_price)}</td>
                  <td className="p-4">{renderInflationBadge(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
