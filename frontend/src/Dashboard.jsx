import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, AlertCircle, Filter, FileText, Activity, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, flagged: 0 });
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/esg-records/?status=${filter}`);
      setRecords(res.data);
      const statsRes = await axios.get(`http://localhost:8000/api/esg-records/stats/`);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Failed to fetch records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      await axios.post(`http://localhost:8000/api/esg-records/${id}/approve/`);
      toast.success("Record approved and locked for audit.");
      fetchRecords();
    } catch (err) {
      toast.error("Failed to approve record.");
    }
  };

  const handleFlag = async (id) => {
    const notes = prompt("Reason for flagging:");
    if (notes === null) return;
    try {
      await axios.post(`http://localhost:8000/api/esg-records/${id}/flag/`, { notes });
      toast.success("Record flagged for review.");
      fetchRecords();
    } catch (err) {
      toast.error("Failed to flag record.");
    }
  };

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    FLAGGED: 'bg-red-100 text-red-800 border-red-200',
  };

  const chartData = [
    { name: 'Pending', value: stats.total - stats.approved - stats.flagged, color: '#f59e0b' },
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Flagged', value: stats.flagged, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Analyst Review Dashboard</h2>
          <p className="text-muted-foreground mt-2 text-lg">Review ingested ESG data, approve valid records, and flag anomalies for audit.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-surface p-1 rounded-xl border border-border shadow-sm">
          {['PENDING', 'APPROVED', 'FLAGGED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                filter === status 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
            </div>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requires Attention</p>
              <p className="text-2xl font-bold text-foreground">{stats.flagged}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col items-center justify-center h-32">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Source</th>
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Category</th>
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Scope</th>
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Value</th>
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Period</th>
                <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Status</th>
                {filter === 'PENDING' && (
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {loading && records.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 bg-slate-200 rounded w-full"></div></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-3/4"></div></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-1/2"></div></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-1/2"></div></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-full"></div></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-3/4"></div></td>
                    {filter === 'PENDING' && <td className="p-4"></td>}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p>No {filter.toLowerCase()} records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{record.source_name}</span>
                        <span className="text-xs text-muted-foreground">{record.source_type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{record.category}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {record.scope.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm text-foreground">
                      {record.normalized_value} <span className="text-muted-foreground">{record.normalized_unit}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {record.period_start ? `${record.period_start} to ${record.period_end || '?'}` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        statusColors[record.status]
                      )}>
                        {record.status}
                      </span>
                    </td>
                    {filter === 'PENDING' && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApprove(record.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger"
                            title="Approve Record"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleFlag(record.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                            title="Flag Issue"
                          >
                            <AlertCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
