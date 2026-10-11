import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Shield, AlertTriangle, X } from 'lucide-react';
import { client } from '../lib/api';
import { IpWhitelist as IpWhitelistType } from '../types';

export default function IpWhitelist() {
  const [ips, setIps] = useState<IpWhitelistType[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIp, setCurrentIp] = useState('Loading...');
  const [currentLocation, setCurrentLocation] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ipAddress: '', description: '', status: 'Active' });

  useEffect(() => {
    // Fetch real IP and location
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setCurrentIp(data.ip);
        setCurrentLocation(`${data.city}, ${data.region}, ${data.country_name}`);
      })
      .catch(() => {
        setCurrentIp('Unknown');
        setCurrentLocation('Unknown Location');
      });
  }, []);

  const fetchIps = async () => {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/public/ip-whitelist');
      const { data } = await res.json();
      setIps(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  const handleAdd = async () => {
    if (!form.ipAddress) return;
    try {
      await client.api.fetch('/api/public/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, addedBy: 'Admin', created: new Date().toLocaleString() })
      });
      fetchIps();
      setShowAddModal(false);
      setForm({ ipAddress: '', description: '', status: 'Active' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await client.api.fetch(`/api/public/ip-whitelist/${id}`, { method: 'DELETE' });
      fetchIps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">IP Whitelist</h1>
          <p className="text-gray-500 text-sm mt-1">Manage allowed IP addresses for organization access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchIps} className="btn-secondary"><RefreshCw size={16} /></button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add IP Address</button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <Shield className="text-blue-600 mt-1 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-medium text-blue-900">How IP Restriction Works</h3>
          <p className="text-sm text-blue-700 mt-1">
            When IP addresses are added to the whitelist, only users connecting from those IPs can login to the CRM. 
            If no IPs are configured, all users can login from any location.
          </p>
          <p className="text-sm font-bold text-blue-800 mt-2">Your Current IP: {currentIp} {currentLocation ? `(${currentLocation})` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total IPs</p>
          <p className="text-2xl font-bold mt-1">{ips.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Active IPs</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{ips.filter(i => i.status === 'Active').length}</p>
        </div>
        <div className="card p-4 md:col-span-2">
          <p className="text-sm text-gray-500">IP Restriction</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${ips.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {ips.length > 0 ? 'ON' : 'OFF'}
            </span>
            <span className="text-sm text-gray-500">
              {ips.length > 0 ? '(Restricted to whitelisted IPs)' : '(All IPs allowed)'}
            </span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left border border-gray-200">IP Address</th>
                <th className="px-4 py-3 text-left border border-gray-200">Description</th>
                <th className="px-4 py-3 text-left border border-gray-200">Status</th>
                <th className="px-4 py-3 text-left border border-gray-200">Added On</th>
                <th className="px-4 py-3 text-right border border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ips.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No IP addresses configured</td></tr>
              ) : (
                [...ips].sort((a, b) => b.id - a.id).map(ip => (
                  <tr key={ip.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono border border-gray-200">{ip.ipAddress}</td>
                    <td className="px-4 py-3 border border-gray-200">{ip.description}</td>
                    <td className="px-4 py-3 border border-gray-200">
                      <span className={`badge ${ip.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {ip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-gray-200">{ip.created}</td>
                    <td className="px-4 py-3 text-right border border-gray-200">
                      <button onClick={() => handleDelete(ip.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add IP Address</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input value={form.ipAddress} onChange={(e) => setForm({...form, ipAddress: e.target.value})} className="input-field" placeholder="e.g. 192.168.1.1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field" placeholder="e.g. Office Network" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="select-field">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} className="btn-primary">Add IP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
