import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { AdminDashboard } from './components/AdminDashboard';
import { DeliveryBoyDashboard } from './components/DeliveryBoyDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Ticket, LayoutDashboard, PlusCircle, History, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'raise' | 'track'>('raise');
  const [view, setView] = useState<'landing' | 'customer' | 'admin' | 'delivery'>('landing');

  const isAdmin = user?.role === 'admin';
  const isDeliveryBoy = user?.role === 'delivery_boy';

  // Sync view with user role on login/logout
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'admin') setView('admin');
        else if (user.role === 'delivery_boy') setView('delivery');
        else setView('customer');
      } else {
        setView('landing');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Initializing Tic-Solver...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Ticket className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Tic<span className="text-indigo-600">-Solver</span>
            </h1>
          </div>
          {user && <Auth user={user} loading={loading} login={login} logout={logout} />}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto py-12"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                  The Bridge Between <span className="text-indigo-600">Issues</span> and <span className="text-indigo-600">Solutions</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Professional ticketing SaaS for local marts and fintech startups. Choose your portal to get started.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Customer Portal */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-200 transition-all">
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Customer Portal</h3>
                  <p className="text-gray-500 mb-8">Raise tickets for order issues or payment failures. Track your resolution in real-time.</p>
                  <Auth user={user} loading={loading} login={login} logout={logout} onNavigate={setView} forcedRole="customer" />
                </div>

                {/* Delivery Boy Portal */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:border-emerald-200 transition-all">
                  <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Truck className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Delivery Boy</h3>
                  <p className="text-gray-500 mb-8">Pick up products from customers and update return status in real-time.</p>
                  <Auth user={user} loading={loading} login={login} logout={logout} onNavigate={setView} forcedRole="delivery_boy" />
                </div>

                {/* Admin Portal */}
                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center group hover:bg-slate-800 transition-all text-white">
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Company Admin</h3>
                  <p className="text-slate-400 mb-8">Manage incoming tickets, respond to customers, and resolve issues efficiently.</p>
                  <Auth user={user} loading={loading} login={login} logout={logout} onNavigate={setView} forcedRole="admin" />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'customer' && user && (
            <motion.div
              key="customer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab('raise')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === 'raise' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  Raise Ticket
                </button>
                <button
                  onClick={() => setActiveTab('track')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === 'track' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <History className="w-4 h-4" />
                  Track My Tickets
                </button>
              </div>
              {activeTab === 'raise' ? <TicketForm user={user} /> : <TicketList user={user} />}
            </motion.div>
          )}

          {view === 'delivery' && user && isDeliveryBoy && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DeliveryBoyDashboard user={user} />
            </motion.div>
          )}

          {view === 'admin' && user && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AdminDashboard user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            24x7 Customer Care Assistance • Tic-Solver SaaS
          </p>
        </div>
      </footer>
    </div>
  );
}
