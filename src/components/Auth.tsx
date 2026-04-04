import React, { useState } from 'react';
import { User as UserIcon, ShieldCheck, ShoppingBag, Truck, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  user: any;
  loading: boolean;
  login: (role?: 'admin' | 'customer' | 'delivery_boy') => Promise<any>;
  logout: () => Promise<void>;
  onNavigate?: (view: 'customer' | 'admin' | 'delivery') => void;
  forcedRole?: 'admin' | 'customer' | 'delivery_boy';
}

export function Auth({ user, loading, login, logout, onNavigate, forcedRole }: AuthProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await login(forcedRole);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded-lg" />;

  if (user) {
    // If forcedRole is provided, check if user already has that role
    const hasCorrectRole = forcedRole ? user.role === forcedRole : true;

    if (forcedRole && hasCorrectRole) {
      return (
        <button
          onClick={() => onNavigate?.(forcedRole === 'admin' ? 'admin' : forcedRole === 'delivery_boy' ? 'delivery' : 'customer')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95",
            forcedRole === 'admin' 
              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200" 
              : forcedRole === 'delivery_boy'
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Go to Dashboard
        </button>
      );
    }

    if (forcedRole && !hasCorrectRole) {
      return (
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            forcedRole === 'admin' 
              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200" 
              : forcedRole === 'delivery_boy'
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
          )}
        >
          {forcedRole === 'admin' ? <ShieldCheck className="w-5 h-5" /> : forcedRole === 'delivery_boy' ? <Truck className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          {isLoggingIn ? 'Switching...' : `Switch to ${forcedRole === 'admin' ? 'Admin' : forcedRole === 'delivery_boy' ? 'Delivery Boy' : 'Customer'}`}
        </button>
      );
    }

    // If it's the header Auth (no forcedRole) or the correct role portal
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-indigo-600" />
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoggingIn}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        forcedRole === 'admin' 
          ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200" 
          : forcedRole === 'delivery_boy'
          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
      )}
    >
      {forcedRole === 'admin' ? <ShieldCheck className="w-5 h-5" /> : forcedRole === 'delivery_boy' ? <Truck className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
      {isLoggingIn ? 'Logging in...' : `Login as ${forcedRole === 'admin' ? 'Company Admin' : forcedRole === 'delivery_boy' ? 'Delivery Boy' : 'Customer'}`}
    </button>
  );
}
