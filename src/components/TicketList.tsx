import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Clock, CheckCircle2, MessageSquare, FileText, ChevronRight, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { TicketChat } from './TicketChat';
import { PDFGenerator } from './PDFGenerator';

import { handleFirestoreError, OperationType, getFriendlyFirestoreErrorMessage } from '../lib/firestore-errors';

export function TicketList({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const path = 'tickets';
    const uid = user.uid || user.id;
    if (!uid) return;

    setError(null);
    const q = query(
      collection(db, path),
      where('customerId', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
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
  }, [user.uid]);

  const filteredTickets = tickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.details.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Tickets</h3>
        <p className="text-red-700 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ticket number or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No tickets found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    ticket.status === 'resolved' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {ticket.status === 'resolved' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-indigo-600">{ticket.ticketNumber}</span>
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                        ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                          ticket.priority === 'high' ? "bg-red-100 text-red-700" :
                          ticket.priority === 'medium' ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{ticket.details.reason}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'PPP p') : 'Just now'}
                      </p>
                      {ticket.type === 'order' && ticket.details?.returnStatus && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                          ticket.details.returnStatus === 'returned_successfully' ? "bg-green-50 text-green-600" :
                          ticket.details.returnStatus === 'product_received' ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                        )}>
                          Return: {ticket.details.returnStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                  <PDFGenerator ticket={ticket} />
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <TicketChat
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
