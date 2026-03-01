import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const DocumentsScreen = ({ load, onBack }) => {
  const { api } = useDriverApp();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

  const handleUpload = async (file, source) => {
    if (!file) return;
    
    setUploading(true);
    setSyncStatus('syncing');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'pod'); // Default to POD

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
        await fetchDocuments();
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setSyncStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/50 to-gray-950 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Document Upload</h1>
          <p className="text-green-300 text-sm">{load.order_number || 'Load'} Documents</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Upload Buttons */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
          <h3 className="text-white font-medium mb-4">{load.order_number || 'Load'} Documents</h3>
          
          {/* Take Photo */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleUpload(e.target.files?.[0], 'camera')}
            className="hidden"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-green-600/50 rounded-xl py-6 mb-3 flex flex-col items-center justify-center hover:bg-green-900/20 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white font-medium">Take Photo</span>
            <span className="text-gray-500 text-sm">Capture POD, BOL, etc.</span>
          </button>

          {/* Browse Files */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleUpload(e.target.files?.[0], 'browse')}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-600/50 rounded-xl py-6 flex flex-col items-center justify-center hover:bg-gray-800/50 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-white font-medium">Browse Files</span>
            <span className="text-gray-500 text-sm">Upload from device</span>
          </button>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-gray-400 text-sm font-medium mb-3">UPLOADED ({documents.length})</h3>
          
          {loading ? (
            <div className="py-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-gray-500 text-xs">{formatFileSize(doc.file_size || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Status */}
        <div className="mt-4 text-center">
          <p className={`text-sm ${syncStatus === 'synced' ? 'text-green-400' : syncStatus === 'syncing' ? 'text-yellow-400' : 'text-red-400'}`}>
            {syncStatus === 'synced' && '✓ Syncing with Company TMS...'}
            {syncStatus === 'syncing' && '↻ Uploading...'}
            {syncStatus === 'error' && '✗ Sync failed'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsScreen;
