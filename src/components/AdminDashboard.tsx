import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Clock, CheckCircle2, MessageSquare, Search, Filter, User, ArrowUpRight, AlertCircle, X, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { TicketChat } from './TicketChat';

import { handleFirestoreError, OperationType, getFriendlyFirestoreErrorMessage } from '../lib/firestore-errors';

export function AdminDashboard({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'tickets' | 'users'>('tickets');
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    const path = 'tickets';
    const uid = user.uid || user.id;
    if (!uid) return;

    setError(null);
    const q = query(collection(db, path));
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
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      const path = 'users';
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersList(docs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      });
      return unsubscribe;
    }
  }, [activeTab]);

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    const path = `tickets/${ticketId}`;
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        messages: arrayUnion({
          senderId: user.uid,
          senderName: 'System Admin',
          text: `Status updated to ${newStatus}`,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handlePriorityUpdate = async (ticketId: string, newPriority: string) => {
    const path = `tickets/${ticketId}`;
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        priority: newPriority,
        updatedAt: new Date().toISOString(),
        messages: arrayUnion({
          senderId: user.uid,
          senderName: 'System Admin',
          text: `Priority updated to ${newPriority}`,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleReturnSuccess = async (ticketId: string) => {
    const path = `tickets/${ticketId}`;
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'resolved',
        'details.returnStatus': 'returned_successfully',
        updatedAt: new Date().toISOString(),
        messages: arrayUnion({
          senderId: user.uid,
          senderName: 'System Admin',
          text: 'Product Is Returned Successfully. Return Payment will be issued automatically.',
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUserRoleUpdate = async (userId: string, newRole: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (t.customerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
        <div className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Access Error</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500">Manage tickets and user roles</p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('tickets')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tickets' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Ticket className="w-4 h-4" />
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'users' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <User className="w-4 h-4" />
            Users
          </button>
        </div>
      </div>

      {activeTab === 'tickets' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Resolved</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket # or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 border border-gray-200 rounded-xl">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 border border-gray-200 rounded-xl">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-600">{ticket.ticketNumber}</span>
                      <span className="text-xs text-gray-500">{ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'MMM d, p') : 'Just now'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{ticket.customerName}</span>
                        <span className="text-xs text-gray-500">{ticket.customerEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                      ticket.type === 'order' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {ticket.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={ticket.priority || 'medium'}
                      onChange={(e) => handlePriorityUpdate(ticket.id, e.target.value)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg outline-none border-none cursor-pointer w-fit uppercase",
                        ticket.priority === 'high' ? "bg-red-50 text-red-600" :
                        ticket.priority === 'medium' ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      )}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                        className={cn(
                          "text-xs font-bold px-2 py-1 rounded-lg outline-none border-none cursor-pointer w-fit",
                          ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      {ticket.type === 'order' && ticket.details?.returnStatus && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase w-fit",
                          ticket.details.returnStatus === 'returned_successfully' ? "bg-green-50 text-green-600" :
                          ticket.details.returnStatus === 'product_received' ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                        )}>
                          {ticket.details.returnStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {ticket.type === 'order' && ticket.details?.returnStatus === 'product_received' && (
                        <button
                          onClick={() => handleReturnSuccess(ticket.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
                          title="Mark as Returned Successfully"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Mark Returned
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Chat"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-gray-100" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{u.displayName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUserRoleUpdate(u.id, e.target.value)}
                        disabled={u.email === 'prasannashiremath27@gmail.com'}
                        className={cn(
                          "text-xs font-bold px-2 py-1 rounded-lg outline-none border border-gray-200 cursor-pointer",
                          u.role === 'admin' ? "bg-slate-900 text-white" :
                          u.role === 'delivery_boy' ? "bg-emerald-50 text-emerald-600" :
                          "bg-blue-50 text-blue-600"
                        )}
                      >
                        <option value="customer">Customer</option>
                        <option value="delivery_boy">Delivery Boy</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
