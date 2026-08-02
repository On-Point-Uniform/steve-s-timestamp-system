import React, { useEffect, useState } from 'react';
import { findValidToken, consumeToken, saveIdentity } from '@/api/portalAuth';
import { Clock, AlertCircle } from 'lucide-react';

export default function PortalCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('portal_token');
    const employeeName = params.get('employee_name');

    if (!token) {
      setError('No token received. Please try signing in again.');
      return;
    }

    const verify = async () => {
      try {
        const record = await findValidToken(token);
        if (!record) {
          setError('Invalid or already-used token. Please sign in again.');
          return;
        }

        if (new Date() > new Date(record.expires_at)) {
          setError('Your sign-in link has expired. Please try again.');
          return;
        }

        await consumeToken(record.id);

        saveIdentity({
          employee_name: employeeName || record.employee_name || 'Staff Member',
          role: record.role || 'staff',
          employee_id: record.employee_id || record.id,
        });
        window.location.href = '/';
      } catch (e) {
        console.error(e);
        setError('Something went wrong during sign-in. Please try again.');
      }
    };

    verify();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sign-in Failed</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
        <a
          href="/login"
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Try Again
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-white animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Verifying your identity…</h2>
      <p className="text-slate-400 text-sm">Please wait a moment.</p>
    </div>
  );
}