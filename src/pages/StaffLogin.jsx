import React from 'react';
import { Clock } from 'lucide-react';

const APP_NAME = "Steves-Timestamp-System";
const PORTAL_AUTH_URL = "https://on-point-portal.base44.app/auth";

export default function StaffLogin() {
  const handleLogin = () => {
    const redirect = encodeURIComponent(window.location.origin + '/callback');
    window.location.href = `${PORTAL_AUTH_URL}?app=${APP_NAME}&redirect=${redirect}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo / branding */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg">
            <Clock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
          Steve's Timestamp System
        </h1>
        <p className="text-slate-400 text-sm mb-10">
          On Point Uniform &amp; Supply — Staff Portal
        </p>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Staff Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">
            Use your employee PIN to access the timestamp system.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md"
          >
            Sign in with your Employee PIN
          </button>
          <p className="text-xs text-slate-400 mt-5">
            You will be redirected to the On Point secure portal to verify your identity.
          </p>
        </div>
      </div>
    </div>
  );
}