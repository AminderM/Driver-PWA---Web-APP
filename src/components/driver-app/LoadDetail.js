import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { 
  ArrowLeft, MapPin, Clock, Phone, MessageCircle, FileText, 
  CheckCircle2, AlertCircle, Navigation, Truck, Package,
  ChevronRight, Camera, Upload, Send, Image, X, RefreshCw
} from 'lucide-react';

// Status configuration
const STATUS_CONFIG = {
  assigned: { label: 'Assigned', color: 'bg-slate-500', next: 'en_route_pickup', nextLabel: 'Start Route to Pickup' },
  en_route_pickup: { label: 'En Route to Pickup', color: 'bg-blue-500', next: 'arrived_pickup', nextLabel: 'Arrived at Pickup' },
  arrived_pickup: { label: 'At Pickup', color: 'bg-amber-500', next: 'loaded', nextLabel: 'Loaded & Departing' },
  loaded: { label: 'Loaded', color: 'bg-indigo-500', next: 'en_route_delivery', nextLabel: 'Start Route to Delivery' },
  en_route_delivery: { label: 'En Route to Delivery', color: 'bg-blue-500', next: 'arrived_delivery', nextLabel: 'Arrived at Delivery' },
  arrived_delivery: { label: 'At Delivery', color: 'bg-amber-500', next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', color: 'bg-green-500', next: null, nextLabel: null },
  problem: { label: 'Problem', color: 'bg-red-500', next: null, nextLabel: null },
  // Legacy mapping
  planned: { label: 'Planned', color: 'bg-slate-500', next: 'en_route_pickup', nextLabel: 'Start Route to Pickup' },
  in_transit_pickup: { label: 'En Route to Pickup', color: 'bg-blue-500', next: 'arrived_pickup', nextLabel: 'Arrived at Pickup' },
  at_pickup: { label: 'At Pickup', color: 'bg-amber-500', next: 'loaded', nextLabel: 'Loaded & Departing' },
  in_transit_delivery: { label: 'En Route to Delivery', color: 'bg-blue-500', next: 'arrived_delivery', nextLabel: 'Arrived at Delivery' },
  at_delivery: { label: 'At Delivery', color: 'bg-amber-500', next: 'delivered', nextLabel: 'Mark Delivered' },
};

// Tab Components
const DetailsTab = ({ load }) => {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Pickup */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <span className="text-green-400 font-medium">Pickup</span>
        </div>
        <p className="text-white font-medium">{load.pickup_location || load.origin_address || 'Address TBD'}</p>
        <p className="text-slate-400 text-sm">
          {load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state}
        </p>
        <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          {formatDateTime(load.pickup_time_planned || load.pickup_date)}
        </div>
        {load.pickup_contact && (
          <a href={`tel:${load.pickup_phone}`} className="flex items-center gap-2 mt-2 text-blue-400 text-sm">
            <Phone className="w-4 h-4" />
            {load.pickup_contact}
          </a>
        )}
      </div>

      {/* Delivery */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </div>
          <span className="text-red-400 font-medium">Delivery</span>
        </div>
        <p className="text-white font-medium">{load.delivery_location || load.destination_address || 'Address TBD'}</p>
        <p className="text-slate-400 text-sm">
          {load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}
        </p>
        <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          {formatDateTime(load.delivery_time_planned || load.delivery_date)}
        </div>
      </div>

      {/* Load Info */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">Load Information</h3>
        <div className="space-y-2 text-sm">
          {load.equipment_type && (
            <div className="flex justify-between">
              <span className="text-slate-500">Equipment</span>
              <span className="text-white">{load.equipment_type}</span>
            </div>
          )}
          {load.weight && (
            <div className="flex justify-between">
              <span className="text-slate-500">Weight</span>
              <span className="text-white">{load.weight} lbs</span>
            </div>
          )}
          {load.commodity && (
            <div className="flex justify-between">
              <span className="text-slate-500">Commodity</span>
              <span className="text-white">{load.commodity}</span>
            </div>
          )}
          {load.reference_number && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reference #</span>
              <span className="text-white">{load.reference_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {load.notes && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">Notes</h3>
          <p className="text-slate-400 text-sm">{load.notes}</p>
        </div>
      )}
    </div>
  );
};

const ChatTab = ({ load }) => {
  const { api, user } = useDriverApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await api(`/loads/${load.id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [load.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    try {
      const response = await api(`/loads/${load.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage.trim() })
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs">Send a message to dispatch</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'driver' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender_type === 'driver'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-700 text-white rounded-bl-sm'
                }`}
              >
                {msg.sender_type !== 'driver' && (
                  <p className="text-xs text-slate-400 mb-1">{msg.sender_name || 'Dispatch'}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_type === 'driver' ? 'text-blue-200' : 'text-slate-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentsTab = ({ load }) => {
  const { api } = useDriverApp();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('bol');
  const fileInputRef = useRef(null);

  const DOC_TYPES = [
    { value: 'bol', label: 'Bill of Lading' },
    { value: 'pod', label: 'Proof of Delivery' },
    { value: 'lumper', label: 'Lumper Receipt' },
    { value: 'scale_ticket', label: 'Scale Ticket' },
    { value: 'other', label: 'Other' },
  ];

  const fetchDocuments = async () => {
    try {
      const data = await api(`/loads/${load.id}/documents`);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [load.id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', selectedType);

    try {
      const token = localStorage.getItem('driver_app_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/loads/${load.id}/documents`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );
      
      if (response.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Upload Section */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">Upload Document</h3>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white mb-3"
        >
          {DOC_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          className="hidden"
          capture="environment"
        />

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Take Photo
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
                fileInputRef.current.setAttribute('capture', 'environment');
              }
            }}
            disabled={uploading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            Choose File
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <h3 className="text-white font-medium mb-3">Uploaded Documents</h3>
        {documents.length === 0 ? (
          <div className="text-center py-8 bg-slate-800 rounded-xl">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No documents uploaded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  {doc.content_type?.includes('image') ? (
                    <Image className="w-5 h-5 text-slate-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                  <p className="text-slate-500 text-xs">
                    {DOC_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusTab = ({ load, onStatusUpdate }) => {
  const { api, currentLocation } = useDriverApp();
  const [updating, setUpdating] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [problemNote, setProblemNote] = useState('');
  const [history, setHistory] = useState([]);

  const currentStatus = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api(`/loads/${load.id}/status-history`);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [load.id, load.status]);

  const handleStatusUpdate = async (newStatus, note = '') => {
    setUpdating(true);
    try {
      await api(`/loads/${load.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          note,
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng
        })
      });
      onStatusUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
      setShowProblem(false);
      setProblemNote('');
    }
  };

  const handleProblem = () => {
    if (!problemNote.trim()) {
      alert('Please describe the problem');
      return;
    }
    handleStatusUpdate('problem', problemNote);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Current Status */}
      <div className="bg-slate-800 rounded-xl p-4 text-center">
        <p className="text-slate-400 text-sm mb-2">Current Status</p>
        <span className={`${currentStatus.color} text-white text-lg font-medium px-4 py-2 rounded-full inline-block`}>
          {currentStatus.label}
        </span>
      </div>

      {/* Next Action */}
      {currentStatus.next && (
        <button
          onClick={() => handleStatusUpdate(currentStatus.next)}
          disabled={updating}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {updating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {currentStatus.nextLabel}
            </>
          )}
        </button>
      )}

      {/* Problem Button */}
      {load.status !== 'delivered' && load.status !== 'problem' && (
        <>
          {!showProblem ? (
            <button
              onClick={() => setShowProblem(true)}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Report Problem
            </button>
          ) : (
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <textarea
                value={problemNote}
                onChange={(e) => setProblemNote(e.target.value)}
                placeholder="Describe the problem..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProblem(false)}
                  className="flex-1 bg-slate-700 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProblem}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {updating ? 'Submitting...' : 'Submit Problem'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status History */}
      {history.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">Status History</h3>
          <div className="space-y-3">
            {history.map((event, i) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-white text-sm">
                    {STATUS_CONFIG[event.new_status]?.label || event.new_status}
                  </p>
                  {event.note && (
                    <p className="text-slate-400 text-xs mt-1">{event.note}</p>
                  )}
                  <p className="text-slate-500 text-xs">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Load Detail Component
const LoadDetail = ({ load: initialLoad, onBack }) => {
  const { api, setActiveLoadId } = useDriverApp();
  const [load, setLoad] = useState(initialLoad);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setActiveLoadId(load.id);
    return () => setActiveLoadId(null);
  }, [load.id, setActiveLoadId]);

  const refreshLoad = async () => {
    try {
      const data = await api(`/loads/${load.id}`);
      setLoad(data);
    } catch (err) {
      console.error('Failed to refresh load:', err);
    }
  };

  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;

  const tabs = [
    { id: 'details', label: 'Details', icon: Package },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'status', label: 'Status', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-semibold">#{load.order_number || load.id?.slice(0, 8)}</h1>
          <span className={`${status.color} text-white text-xs px-2 py-0.5 rounded-full`}>
            {status.label}
          </span>
        </div>
        <button onClick={refreshLoad} className="w-10 h-10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-800/50 border-b border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 ${
                activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' && <DetailsTab load={load} />}
        {activeTab === 'chat' && <ChatTab load={load} />}
        {activeTab === 'docs' && <DocumentsTab load={load} />}
        {activeTab === 'status' && <StatusTab load={load} onStatusUpdate={refreshLoad} />}
      </div>
    </div>
  );
};

export default LoadDetail;
