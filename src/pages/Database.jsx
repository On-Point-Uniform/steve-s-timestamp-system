import React, { useState, useEffect, useMemo } from 'react';
import { listAllEvents } from '@/api/timestampEvents';
import {
  FileSpreadsheet, FileText, Printer, Filter, X, ArrowUpDown, Loader2, Calendar
} from 'lucide-react';
import { exportToCSV, exportToExcel, printAuditLog } from '@/lib/auditExport';

export default function Database() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort: 'desc' (newest first) or 'asc' (oldest first)
  const [sortDir, setSortDir] = useState('desc');

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllEvents(5000);
      setRecords(data || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load audit log data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = useMemo(() => {
    let result = [...records];
    if (startDate) {
      result = result.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter((r) => r.date <= endDate);
    }
    result.sort((a, b) => {
      const ta = new Date(a.full_timestamp).getTime();
      const tb = new Date(b.full_timestamp).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });
    return result;
  }, [records, startDate, endDate, sortDir]);

  const hasActiveFilter = startDate || endDate;

  const handleExportExcelAll = () => {
    // Export ALL records (ignoring filter), respecting current sort
    const all = [...records].sort((a, b) => {
      const ta = new Date(a.full_timestamp).getTime();
      const tb = new Date(b.full_timestamp).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToExcel(all, `audit_log_all_${dateStr}.xlsx`);
  };

  const handleExportExcelFiltered = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToExcel(filtered, `audit_log_filtered_${dateStr}.xlsx`);
  };

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToCSV(filtered, `audit_log_${dateStr}.csv`);
  };

  const handlePrint = () => {
    printAuditLog(filtered);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const toggleSort = () => {
    setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading...' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
            {hasActiveFilter && ' (filtered)'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /> Clear Filter
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={toggleSort}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortDir === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="mt-3 flex items-center gap-2 text-xs text-cyan-700">
              <Filter className="w-3.5 h-3.5" />
              <span>
                Showing records
                {startDate && ` from ${startDate}`}
                {startDate && endDate && ' to'}
                {endDate && ` ${endDate}`}
              </span>
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <ExportButton onClick={handleExportExcelAll} icon={FileSpreadsheet} label="Export All to Excel" color="emerald" />
          <ExportButton
            onClick={handleExportExcelFiltered}
            icon={FileSpreadsheet}
            label="Export Filtered to Excel"
            color="teal"
            disabled={!hasActiveFilter}
          />
          <ExportButton onClick={handleExportCSV} icon={FileText} label="Export to CSV" color="cyan" />
          <ExportButton onClick={handlePrint} icon={Printer} label="Print Audit Log" color="slate" />
        </div>

        {/* Table / states */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={loadRecords}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Timestamp events will appear here</p>
          </div>
        ) : (
          <AuditTable
            records={filtered}
            sortDir={sortDir}
            onToggleSort={toggleSort}
          />
        )}
      </div>
    </div>
  );
}

function AuditTable({ records, sortDir, onToggleSort }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Log ID</th>
              <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Session #</th>
              <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Event</th>
              <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Break #</th>
              <th
                className="px-3 py-3 text-left font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-800 transition-colors select-none"
                onClick={onToggleSort}
              >
                <span className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortDir === 'desc' ? '↓' : '↑'}
                </span>
              </th>
              <th
                className="px-3 py-3 text-left font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-800 transition-colors select-none"
                onClick={onToggleSort}
              >
                <span className="flex items-center gap-1">
                  Time
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortDir === 'desc' ? '↓' : '↑'}
                </span>
              </th>
              <th
                className="px-3 py-3 text-left font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-800 transition-colors select-none"
                onClick={onToggleSort}
              >
                <span className="flex items-center gap-1">
                  Full Timestamp
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortDir === 'desc' ? '↓' : '↑'}
                </span>
              </th>
              <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status After</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr
                key={record.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
              >
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">
                  {record.log_sequence ?? '—'}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-700">
                  #{record.session_number}
                </td>
                <td className="px-3 py-2.5">
                  <EventBadge name={record.event_name} />
                </td>
                <td className="px-3 py-2.5 text-slate-600">
                  {record.break_number ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{record.date}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{record.time}</td>
                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono text-xs">
                  {new Date(record.full_timestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={record.status_after} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventBadge({ name }) {
  const styles = {
    'Stamp In': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Stamp Out': 'bg-rose-100 text-rose-700 border-rose-200',
    'Break Start': 'bg-amber-100 text-amber-700 border-amber-200',
    'Break End': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };
  const cls = styles[name] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {name}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Working': 'bg-emerald-100 text-emerald-700',
    'On Break': 'bg-amber-100 text-amber-700',
    'Stamped Out': 'bg-rose-100 text-rose-700',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

const COLOR_CLASSES = {
  emerald: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600',
  teal: 'bg-teal-500 hover:bg-teal-600 border-teal-600',
  cyan: 'bg-cyan-500 hover:bg-cyan-600 border-cyan-600',
  slate: 'bg-slate-600 hover:bg-slate-700 border-slate-700',
};

function ExportButton({ onClick, icon: Icon, label, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium border-b-2 transition-all ${COLOR_CLASSES[color]} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md active:translate-y-0.5'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}