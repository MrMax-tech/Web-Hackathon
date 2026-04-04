import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Truck, Package, CheckCircle2, Clock, Search, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType, getFriendlyFirestoreErrorMessage } from '../lib/firestore-errors';

export function DeliveryBoyDashboard({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Delivery boy only cares about Order Based tickets that need pickup or are received
    const path = 'tickets';
    const uid = user.uid || user.id;
    if (!uid) return;

    setError(null);
    const q = query(
      collection(db, path),
      where('type', '==', 'order')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((t: any) => t.details?.returnStatus === 'pending_pickup' || t.details?.returnStatus === 'product_received')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTickets(docs);
      setLoading(false);
    }, (err) => {
      const friendlyMessage = getFriendlyFirestoreErrorMessage(err);
      setError(friendlyMessage);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return unsubscribe;
  }, []);

  const handleReceiveProduct = async (ticketId: string) => {
    const path = `tickets/${ticketId}`;
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        'details.returnStatus': 'product_received',
        updatedAt: new Date().toISOString(),
        messages: arrayUnion({
          senderId: user.uid,
          senderName: 'Delivery Boy',
          text: 'The Product Is Received from the customer.',
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h2>
          <p className="text-gray-500">Manage product pickups and returns</p>
        </div>
        <div className="bg-emerald-100 p-3 rounded-xl">
          <Truck className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ticket # or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            Retry
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No pending pickups at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {ticket.ticketNumber}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                      ticket.details.returnStatus === 'product_received' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {ticket.details.returnStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Customer</p>
                        <p className="text-sm font-semibold text-gray-900">{ticket.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Product</p>
                        <p className="text-sm font-semibold text-gray-900">{ticket.details.productName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Store: {ticket.details.storeName}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                  {ticket.details.returnStatus === 'pending_pickup' ? (
                    <button
                      onClick={() => handleReceiveProduct(ticket.id)}
                      className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      The Product Is Received
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold border border-blue-100">
                      <Clock className="w-5 h-5" />
                      In Transit to Admin
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
