import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShoppingBag, CreditCard, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const STORES = ['Vishal Mart', 'D Mart', 'Famous Store', 'Local Mart'];
const BANKS = ['Lakshmi Bank', 'HDFC Bank', 'SBI', 'ICICI', 'Paytm Payments Bank'];

export function TicketForm({ user }: { user: any }) {
  const [type, setType] = useState<'order' | 'payment'>('order');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    storeName: STORES[0],
    deliveredDate: '',
    transactionId: '',
    bankName: BANKS[0],
    transactionDateTime: '',
    reason: '',
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ticketNumber = `${type === 'order' ? 'OD' : 'PB'}${formData.storeName.substring(0, 2).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const ticketData = {
        ticketNumber,
        type,
        status: 'pending',
        priority: formData.priority,
        customerId: user.uid,
        customerEmail: user.email,
        customerName: user.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        details: type === 'order' ? {
          productId: formData.productId,
          productName: formData.productName,
          storeName: formData.storeName,
          deliveredDate: formData.deliveredDate,
          reason: formData.reason,
          returnStatus: 'pending_pickup', // Added returnStatus
        } : {
          transactionId: formData.transactionId,
          bankName: formData.bankName,
          transactionDateTime: formData.transactionDateTime,
          reason: formData.reason,
        },
        messages: [{
          senderId: user.uid,
          senderName: user.displayName,
          text: `Ticket raised for ${type === 'order' ? 'Order' : 'Payment'} issue: ${formData.reason}`,
          timestamp: new Date().toISOString(),
        }]
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      setFormData({
        productId: '',
        productName: '',
        storeName: STORES[0],
        deliveredDate: '',
        transactionId: '',
        bankName: BANKS[0],
        transactionDateTime: '',
        reason: '',
        priority: 'medium',
      });
    } catch (err) {
      console.error('Error raising ticket:', err);
      setError('Failed to raise ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-green-100 text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Raised Successfully!</h3>
        <p className="text-gray-600 mb-6">Our team will resolve your issue within 1-2 days. You can track the status in the "Track Tickets" tab.</p>
        <button
          onClick={() => setSuccess(false)}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Raise Another Ticket
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setType('order')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all",
              type === 'order' ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            Order Based
          </button>
          <button
            onClick={() => setType('payment')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all",
              type === 'payment' ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Payment Based
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {type === 'order' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product ID</label>
                  <input
                    required
                    type="text"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    placeholder="e.g. PRD-12345"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    required
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Wireless Headphones"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Store Name</label>
                  <select
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  >
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivered Date</label>
                  <input
                    required
                    type="date"
                    value={formData.deliveredDate}
                    onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                  <input
                    required
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder="e.g. TXN987654321"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Bank Name</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  >
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Transaction Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.transactionDateTime}
                    onChange={(e) => setFormData({ ...formData, transactionDateTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason / Issue Description</label>
            <textarea
              required
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={type === 'order' ? "e.g. Received wrong product size..." : "e.g. Payment deducted but not updated..."}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority Level</label>
            <div className="grid grid-cols-3 gap-4">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={cn(
                    "py-2 px-4 rounded-xl text-xs font-bold uppercase transition-all border",
                    formData.priority === p 
                      ? p === 'high' ? "bg-red-50 border-red-200 text-red-600 shadow-sm" :
                        p === 'medium' ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" :
                        "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                      : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
