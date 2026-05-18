import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const ChatScreen = ({ load, onBack }) => {
  const { api, user, theme } = useDriverApp();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'  : 'bg-white';
  const textCls = isDark ? 'text-white' : 'text-black';
  const sub     = isDark ? 'text-white/60' : 'text-black/60';
  const border  = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';
  const inputCls = `flex-1 border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 ${
    isDark
      ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30'
      : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const fetchMessages = async (isInitial = false) => {
    try {
      const data = await api(`/loads/${load.id}/messages`);
      setMessages(Array.isArray(data) ? data : data?.messages || []);
      if (isInitial) setFetchError('');
    } catch (err) {
      if (isInitial) setFetchError(err.message || 'Could not load messages.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [load.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError('');
    setText('');
    try {
      await api(`/loads/${load.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      await fetchMessages(false);
    } catch (err) {
      setText(content); // restore on failure
      setSendError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center gap-3 border-b ${border}`}>
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${textCls}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={`text-lg font-bold tracking-wider ${textCls}`}>DISPATCHER CHAT</h1>
          <p className={`text-xs ${sub}`}>
            {load.order_number || `Load #${load.id?.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-500 text-xs tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-sm text-center ${sub}`}>{fetchError}</p>
            <p className={`text-xs mt-1 text-center ${sub}`}>Chat endpoint may not be available yet. Contact your dispatcher by phone.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <svg className={`w-8 h-8 ${sub}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className={`text-sm ${sub}`}>No messages yet.</p>
            <p className={`text-xs mt-1 ${sub}`}>Send a message to your dispatcher.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_type === 'driver';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className={`text-xs mb-1 ml-1 ${sub}`}>{msg.sender_name || 'Dispatcher'}</p>
                )}
                <div className={`max-w-[78%] px-4 py-3 ${
                  isMe
                    ? 'bg-red-600 text-white'
                    : isDark
                      ? 'bg-[#1a1a1a] border border-[#262626] text-white'
                      : 'bg-[#f0f0f0] border border-[#e5e5e5] text-black'
                }`}>
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                </div>
                <p className={`text-xs mt-1 ${sub}`}>{formatTime(msg.sent_at)}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`px-4 py-4 border-t ${border}`}>
        {sendError && (
          <p className="text-red-500 text-xs mb-2">{sendError}</p>
        )}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message dispatcher..."
            className={inputCls}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
