import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { X, Send, User, ShieldCheck, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getCustomerAiSupport } from '../services/geminiService';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function TicketChat({ ticket, user, onClose }: { ticket: any, user: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>(ticket.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin';

  const handleAiSupport = async () => {
    if (!newMessage.trim() || aiLoading) return;
    
    const userMsg = newMessage;
    setNewMessage('');
    setAiLoading(true);

    const path = `tickets/${ticket.id}`;
    try {
      // Add user message to UI immediately
      const userMessageObj = {
        senderId: user.uid,
        senderName: user.displayName,
        text: userMsg,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'tickets', ticket.id), {
        messages: arrayUnion(userMessageObj),
        updatedAt: new Date().toISOString(),
      });

      // Get AI response
      const aiResponse = await getCustomerAiSupport(userMsg, ticket);
      
      // Add AI message
      await updateDoc(doc(db, 'tickets', ticket.id), {
        messages: arrayUnion({
          senderId: 'ai-assistant',
          senderName: 'AI Assistant',
          text: aiResponse,
          timestamp: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const path = `tickets/${ticket.id}`;
    const unsubscribe = onSnapshot(doc(db, 'tickets', ticket.id), (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [ticket.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const path = `tickets/${ticket.id}`;
    try {
      await updateDoc(doc(db, 'tickets', ticket.id), {
        messages: arrayUnion({
          senderId: user.uid,
          senderName: user.displayName,
          text: newMessage,
          timestamp: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{ticket.ticketNumber}</h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-indigo-100 uppercase font-bold">Status: {ticket.status}</p>
                {ticket.type === 'order' && ticket.details?.returnStatus && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">
                    Return: {ticket.details.returnStatus.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, i) => {
            const isMe = msg.senderId === user.uid;
            const isAi = msg.senderId === 'ai-assistant';
            return (
              <div key={i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                  isMe ? "bg-indigo-600 text-white rounded-tr-none" : 
                  isAi ? "bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-tl-none" :
                  "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                )}>
                  {!isMe && (
                    <div className="flex items-center gap-1 mb-1">
                      {isAi && <Sparkles className="w-3 h-3" />}
                      <p className="text-[10px] font-bold uppercase">{msg.senderName}</p>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {format(new Date(msg.timestamp), 'p')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={handleAiSupport}
                disabled={aiLoading || !newMessage.trim()}
                className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                title="Ask AI Assistant"
              >
                <Sparkles className={cn("w-5 h-5", aiLoading && "animate-spin")} />
              </button>
            )}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={!isAdmin ? "Ask AI or type message..." : "Type your response..."}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <button
              disabled={!newMessage.trim() || sending}
              type="submit"
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
