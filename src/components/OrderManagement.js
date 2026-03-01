import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import FeatureGate from './FeatureGate';

const OrderManagement = () => {
  const { user, fetchWithAuth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('loads');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showRateConfirmation, setShowRateConfirmation] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsingDocument, setParsingDocument] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  
  // Dispatch edit modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingLoad, setDispatchingLoad] = useState(null);
  const [dispatchData, setDispatchData] = useState({
    assigned_carrier: '',
    assigned_driver: '',
    assigned_driver_id: '',
    pickup_time_actual_in: '',
    pickup_time_actual_out: '',
    delivery_time_actual_in: '',
    delivery_time_actual_out: ''
  });
  
  // Available drivers for assignment
  const [availableDrivers, setAvailableDrivers] = useState([]);
  
  // Loads filter state (synced with Sales/Business Development)
  const [loadsFilters, setLoadsFilters] = useState({
    loadNumber: 'all',
    shipper: 'all',
    pickupLocation: 'all',
    deliveryLocation: 'all',
    rateMin: '',
    rateMax: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const [formData, setFormData] = useState({
    equipment_id: '',
    shipper_name: '',
    shipper_address: '',
    pickup_location: '',
    pickup_city: '',
    pickup_state: '',
    pickup_country: 'USA',
    delivery_location: '',
    delivery_city: '',
    delivery_state: '',
    delivery_country: 'USA',
    commodity: '',
    weight: '',
    cubes: '',
    tractor_number: '',
    trailer_number: '',
    driver_name: '',
    driver_id: '',
    pickup_time_planned: '',
    delivery_time_planned: '',
    confirmed_rate: '',
    notes: '',
    start_date: '',
    end_date: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadOrders();
    loadEquipment();
    loadAvailableDrivers();
  }, [user]);

  const loadOrders = async () => {
    try {
      let endpoint = `${BACKEND_URL}/api/bookings/my`;
      
      if (user?.role === 'fleet_owner' || user?.role === 'platform_admin') {
        endpoint = `${BACKEND_URL}/api/bookings/requests`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadAvailableDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/all`);
      if (response.ok) {
        const data = await response.json();
        setAvailableDrivers(data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmedRateChange = (value) => {
    // Remove all non-numeric characters except decimal point
    let numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (numericValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = numericValue.split('.');
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    const decimalIndex = numericValue.indexOf('.');
    if (decimalIndex !== -1 && numericValue.length - decimalIndex > 3) {
      numericValue = numericValue.substring(0, decimalIndex + 3);
    }
    
    setFormData(prev => ({ ...prev, confirmed_rate: numericValue }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      shipper_name: '',
      shipper_address: '',
      pickup_location: '',
      pickup_city: '',
      pickup_state: '',
      pickup_country: 'USA',
      delivery_location: '',
      delivery_city: '',
      delivery_state: '',
      delivery_country: 'USA',
      commodity: '',
      weight: '',
      cubes: '',
      tractor_number: '',
      trailer_number: '',
      driver_name: '',
      driver_id: '',
      pickup_time_planned: '',
      delivery_time_planned: '',
      confirmed_rate: '',
      notes: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleSubmitOrder = async () => {
    try {
      // Validate required fields
      if (!formData.equipment_id) {
        toast.error('Please select equipment');
        return;
      }
      if (!formData.pickup_location || !formData.delivery_location) {
        toast.error('Please provide pickup and delivery locations');
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        toast.error('Please provide start and end dates');
        return;
      }

      const orderData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        cubes: formData.cubes ? parseFloat(formData.cubes) : null,
        confirmed_rate: formData.confirmed_rate ? parseFloat(formData.confirmed_rate) : null,
        pickup_time_planned: formData.pickup_time_planned || null,
        delivery_time_planned: formData.delivery_time_planned || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };

      // Determine if we're creating or updating
      const isEditingOrder = editingOrder !== null;
      const url = isEditingOrder 
        ? `${BACKEND_URL}/api/bookings/${editingOrder.id}`
        : `${BACKEND_URL}/api/bookings`;
      
      const response = await fetchWithAuth(url, {
        method: isEditingOrder ? 'PUT' : 'POST',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast.success(isEditingOrder ? 'Order updated successfully!' : 'Order created successfully!');
        setShowOrderForm(false);
        setEditingOrder(null);
        resetForm();
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || (isEditingOrder ? 'Failed to update order' : 'Failed to create order'));
      }
    } catch (error) {
      toast.error(editingOrder ? 'Error updating order' : 'Error creating order');
    }
  };

  const handleEditOrder = (order) => {
    // Only allow editing if order is pending
    if (order.status !== 'pending') {
      toast.error('Only orders with "Pending" status can be edited');
      return;
    }

    // Convert datetime fields for form inputs
    const formatDateForInput = (dateTime) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      return date.toISOString().slice(0, 10);
    };

    const formatDateTimeForInput = (dateTime) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      return date.toISOString().slice(0, 16);
    };

    // Populate form with order data
    setFormData({
      equipment_id: order.equipment_id || '',
      shipper_name: order.shipper_name || '',
      shipper_address: order.shipper_address || '',
      pickup_location: order.pickup_location || '',
      pickup_city: order.pickup_city || '',
      pickup_state: order.pickup_state || '',
      pickup_country: order.pickup_country || 'USA',
      delivery_location: order.delivery_location || '',
      delivery_city: order.delivery_city || '',
      delivery_state: order.delivery_state || '',
      delivery_country: order.delivery_country || 'USA',
      commodity: order.commodity || '',
      weight: order.weight || '',
      cubes: order.cubes || '',
      tractor_number: order.tractor_number || '',
      trailer_number: order.trailer_number || '',
      driver_name: order.driver_name || '',
      driver_id: order.driver_id || '',
      pickup_time_planned: formatDateTimeForInput(order.pickup_time_planned),
      delivery_time_planned: formatDateTimeForInput(order.delivery_time_planned),
      confirmed_rate: order.confirmed_rate || '',
      notes: order.notes || '',
      start_date: formatDateForInput(order.start_date),
      end_date: formatDateForInput(order.end_date)
    });

    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_transit_pickup', label: 'In-Transit Pick up' },
    { value: 'at_pickup', label: 'At Pick up' },
    { value: 'in_transit_delivery', label: 'In Transit to Delivery' },
    { value: 'at_delivery', label: 'At Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'payment_overdue', label: 'Payment OverDue' },
    { value: 'paid', label: 'Paid' }
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-muted text-foreground border-yellow-300',
      planned: 'bg-muted text-foreground border-blue-300',
      in_transit_pickup: 'bg-muted text-foreground border-purple-300',
      at_pickup: 'bg-muted text-foreground border-indigo-300',
      in_transit_delivery: 'bg-muted text-foreground border-purple-300',
      at_delivery: 'bg-muted text-foreground border-indigo-300',
      delivered: 'bg-muted text-foreground border-green-300',
      invoiced: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      payment_overdue: 'bg-muted text-foreground border-red-300',
      paid: 'bg-muted text-emerald-800 border-emerald-300'
    };
    return statusColors[status] || statusColors.pending;
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH'
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  // Open dispatch edit modal
  const openDispatchModal = (load) => {
    setDispatchingLoad(load);
    setDispatchData({
      assigned_carrier: load.assigned_carrier || '',
      assigned_driver: load.assigned_driver || '',
      assigned_driver_id: load.assigned_driver_id || '',
      pickup_time_actual_in: load.pickup_time_actual_in ? load.pickup_time_actual_in.slice(0, 16) : '',
      pickup_time_actual_out: load.pickup_time_actual_out ? load.pickup_time_actual_out.slice(0, 16) : '',
      delivery_time_actual_in: load.delivery_time_actual_in ? load.delivery_time_actual_in.slice(0, 16) : '',
      delivery_time_actual_out: load.delivery_time_actual_out ? load.delivery_time_actual_out.slice(0, 16) : ''
    });
    setShowDispatchModal(true);
  };

  // Save dispatch info
  const handleSaveDispatch = async () => {
    if (!dispatchingLoad) return;
    
    try {
      const payload = {};
      // Only include non-empty values
      if (dispatchData.assigned_carrier) payload.assigned_carrier = dispatchData.assigned_carrier;
      if (dispatchData.assigned_driver) payload.assigned_driver = dispatchData.assigned_driver;
      if (dispatchData.assigned_driver_id) payload.assigned_driver_id = dispatchData.assigned_driver_id;
      if (dispatchData.pickup_time_actual_in) payload.pickup_time_actual_in = new Date(dispatchData.pickup_time_actual_in).toISOString();
      if (dispatchData.pickup_time_actual_out) payload.pickup_time_actual_out = new Date(dispatchData.pickup_time_actual_out).toISOString();
      if (dispatchData.delivery_time_actual_in) payload.delivery_time_actual_in = new Date(dispatchData.delivery_time_actual_in).toISOString();
      if (dispatchData.delivery_time_actual_out) payload.delivery_time_actual_out = new Date(dispatchData.delivery_time_actual_out).toISOString();

      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${dispatchingLoad.id}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Dispatch info updated successfully');
        setShowDispatchModal(false);
        setDispatchingLoad(null);
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update dispatch info');
      }
    } catch (error) {
      console.error('Error updating dispatch info:', error);
      toast.error('Error updating dispatch info');
    }
  };

  // Push load to driver's mobile app
  const handlePushToDriver = async () => {
    if (!dispatchingLoad || !dispatchData.assigned_driver_id) {
      toast.error('Please select a driver first');
      return;
    }
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${dispatchingLoad.id}/push-to-driver`, {
        method: 'POST',
        body: JSON.stringify({
          driver_id: dispatchData.assigned_driver_id,
          driver_name: dispatchData.assigned_driver
        })
      });

      if (response.ok) {
        toast.success(`Load pushed to ${dispatchData.assigned_driver}'s mobile app!`);
        setShowDispatchModal(false);
        setDispatchingLoad(null);
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to push load to driver');
      }
    } catch (error) {
      console.error('Error pushing load to driver:', error);
      toast.error('Error pushing load to driver');
    }
  };

  // Format short datetime for display
  const formatShortDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format datetime for input
  const formatDateTimeForInput = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  };

  // Handle inline field update for dispatch info
  const handleInlineDispatchUpdate = async (loadId, field, value) => {
    try {
      const payload = {};
      if (field.includes('time')) {
        // It's a datetime field
        payload[field] = value ? new Date(value).toISOString() : null;
      } else {
        payload[field] = value || null;
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${loadId}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Updated successfully');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Error updating field');
    }
  };

  // Get unique drivers and carriers for dropdowns
  const uniqueDrivers = [...new Set(orders.map(o => o.assigned_driver).filter(Boolean))];
  const uniqueCarriers = [...new Set(orders.map(o => o.assigned_carrier).filter(Boolean))];

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleParseRateConfirmation = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setParsingDocument(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadedFile);

      // Use fetch directly with Authorization header for file upload
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/bookings/parse-rate-confirmation`, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // Pre-fill the form with extracted data
          const extractedData = result.data;
          
          setFormData(prev => ({
            ...prev,
            shipper_name: extractedData.shipper_name || '',
            shipper_address: extractedData.shipper_address || '',
            pickup_location: extractedData.pickup_location || '',
            pickup_city: extractedData.pickup_city || '',
            pickup_state: extractedData.pickup_state || '',
            pickup_country: extractedData.pickup_country || 'USA',
            delivery_location: extractedData.delivery_location || '',
            delivery_city: extractedData.delivery_city || '',
            delivery_state: extractedData.delivery_state || '',
            delivery_country: extractedData.delivery_country || 'USA',
            commodity: extractedData.commodity || '',
            weight: extractedData.weight || '',
            cubes: extractedData.cubes || '',
            tractor_number: extractedData.tractor_number || '',
            trailer_number: extractedData.trailer_number || '',
            driver_name: extractedData.driver_name || '',
            driver_id: extractedData.driver_id || '',
            pickup_time_planned: extractedData.pickup_time_planned ? extractedData.pickup_time_planned.slice(0, 16) : '',
            delivery_time_planned: extractedData.delivery_time_planned ? extractedData.delivery_time_planned.slice(0, 16) : '',
            confirmed_rate: extractedData.confirmed_rate || '',
            notes: extractedData.notes || ''
          }));

          toast.success('Document parsed successfully! Review and submit the order.');
          setShowRateConfirmation(false);
          setShowOrderForm(true);
        } else {
          toast.error('Failed to extract data from document');
        }
      } else {
        const error = await response.json();
        
        // Handle different error formats
        let errorMessage = 'Failed to parse document';
        
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            // Handle FastAPI validation errors
            errorMessage = error.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof error.detail === 'object') {
            errorMessage = JSON.stringify(error.detail);
          }
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      toast.error(`Error parsing document: ${error.message || 'Unknown error'}`);
    } finally {
      setParsingDocument(false);
    }
  };

  // Export to JSON
  const exportToJSON = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${data.length} orders to JSON`);
    } catch (e) {
      console.error('Export JSON error', e);
      toast.error('Failed to export JSON');
    }
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Define columns to export
    const columns = [
      { key: 'order_number', label: 'Order #' },
      { key: 'status', label: 'Status' },
      { key: 'confirmed_rate', label: 'Confirmed Rate' },
      { key: 'shipper_name', label: 'Shipper Name' },
      { key: 'shipper_address', label: 'Shipper Address' },
      { key: 'pickup_location', label: 'Pickup Location' },
      { key: 'pickup_city', label: 'Pickup City' },
      { key: 'pickup_state', label: 'Pickup State' },
      { key: 'pickup_country', label: 'Pickup Country' },
      { key: 'delivery_location', label: 'Delivery Location' },
      { key: 'delivery_city', label: 'Delivery City' },
      { key: 'delivery_state', label: 'Delivery State' },
      { key: 'delivery_country', label: 'Delivery Country' },
      { key: 'commodity', label: 'Commodity' },
      { key: 'weight', label: 'Weight (lbs)' },
      { key: 'cubes', label: 'Cubes (cu ft)' },
      { key: 'tractor_number', label: 'Tractor #' },
      { key: 'trailer_number', label: 'Trailer #' },
      { key: 'driver_name', label: 'Driver Name' },
      { key: 'driver_id', label: 'Driver ID' },
      { key: 'pickup_time_planned', label: 'Pickup Time (Planned)' },
      { key: 'pickup_time_actual', label: 'Pickup Time (Actual)' },
      { key: 'delivery_time_planned', label: 'Delivery Time (Planned)' },
      { key: 'delivery_time_actual', label: 'Delivery Time (Actual)' }
    ];

    // Create CSV header
    const header = columns.map(col => col.label).join(',');

    // Create CSV rows
    const rows = data.map(order => {
      return columns.map(col => {
        let value = order[col.key] || '';
        
        // Format values
        if (col.key === 'confirmed_rate' && value) {
          value = `$${parseFloat(value).toFixed(2)}`;
        } else if (col.key.includes('time') && value) {
          value = new Date(value).toLocaleString();
        } else if (col.key === 'status') {
          value = getStatusLabel(value);
        }
        
        // Escape commas and quotes in CSV
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
        
        return value;
      }).join(',');
    });

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success(`Exported ${data.length} orders to CSV`);
  };

  // Export to Excel
  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare data for Excel
    const excelData = data.map(order => ({
      'Order #': order.order_number || order.id?.substring(0, 8).toUpperCase() || 'N/A',
      'Status': getStatusLabel(order.status),
      'Confirmed Rate': order.confirmed_rate ? `$${parseFloat(order.confirmed_rate).toFixed(2)}` : 'N/A',
      'Shipper Name': order.shipper_name || 'N/A',
      'Shipper Address': order.shipper_address || 'N/A',
      'Pickup Location': order.pickup_location || 'N/A',
      'Pickup City': order.pickup_city || 'N/A',
      'Pickup State': order.pickup_state || 'N/A',
      'Pickup Country': order.pickup_country || 'USA',
      'Delivery Location': order.delivery_location || 'N/A',
      'Delivery City': order.delivery_city || 'N/A',
      'Delivery State': order.delivery_state || 'N/A',
      'Delivery Country': order.delivery_country || 'USA',
      'Commodity': order.commodity || 'N/A',
      'Weight (lbs)': order.weight || 'N/A',
      'Cubes (cu ft)': order.cubes || 'N/A',
      'Tractor #': order.tractor_number || 'N/A',
      'Trailer #': order.trailer_number || 'N/A',
      'Driver Name': order.driver_name || 'N/A',
      'Driver ID': order.driver_id || 'N/A',
      'Pickup Time (Planned)': order.pickup_time_planned ? new Date(order.pickup_time_planned).toLocaleString() : 'N/A',
      'Pickup Time (Actual)': order.pickup_time_actual ? new Date(order.pickup_time_actual).toLocaleString() : 'N/A',
      'Delivery Time (Planned)': order.delivery_time_planned ? new Date(order.delivery_time_planned).toLocaleString() : 'N/A',
      'Delivery Time (Actual)': order.delivery_time_actual ? new Date(order.delivery_time_actual).toLocaleString() : 'N/A'
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Order #
      { wch: 20 }, // Status
      { wch: 15 }, // Confirmed Rate
      { wch: 25 }, // Shipper Name
      { wch: 30 }, // Shipper Address
      { wch: 25 }, // Pickup Location
      { wch: 15 }, // Pickup City
      { wch: 10 }, // Pickup State
      { wch: 10 }, // Pickup Country
      { wch: 25 }, // Delivery Location
      { wch: 15 }, // Delivery City
      { wch: 10 }, // Delivery State
      { wch: 10 }, // Delivery Country
      { wch: 20 }, // Commodity
      { wch: 12 }, // Weight
      { wch: 12 }, // Cubes
      { wch: 12 }, // Tractor #
      { wch: 12 }, // Trailer #
      { wch: 20 }, // Driver Name
      { wch: 15 }, // Driver ID
      { wch: 20 }, // Pickup Time Planned
      { wch: 20 }, // Pickup Time Actual
      { wch: 20 }, // Delivery Time Planned
      { wch: 20 }  // Delivery Time Actual
    ];
    ws['!cols'] = colWidths;

    // Generate Excel file
    try {
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success(`Exported ${data.length} orders to Excel`);
    } catch (e) {
      console.error('Export Excel error', e);
      toast.error('Failed to export Excel');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipper_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.commodity?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Split orders into active and paid
  const activeOrders = filteredOrders.filter(order => order.status !== 'paid');
  const paidOrders = filteredOrders.filter(order => order.status === 'paid');

  // Filtered loads for the new Loads tab (synced with Sales/Business Development)
  const filteredLoads = orders.filter(load => {
    // Load Number filter
    if (loadsFilters.loadNumber !== 'all' && load.order_number !== loadsFilters.loadNumber) return false;
    // Shipper filter
    if (loadsFilters.shipper !== 'all' && load.shipper_name !== loadsFilters.shipper) return false;
    // Pickup Location filter
    if (loadsFilters.pickupLocation !== 'all' && load.pickup_location !== loadsFilters.pickupLocation) return false;
    // Delivery Location filter
    if (loadsFilters.deliveryLocation !== 'all' && load.delivery_location !== loadsFilters.deliveryLocation) return false;
    // Rate range filter
    if (loadsFilters.rateMin && (load.confirmed_rate || load.total_cost || 0) < parseFloat(loadsFilters.rateMin)) return false;
    if (loadsFilters.rateMax && (load.confirmed_rate || load.total_cost || 0) > parseFloat(loadsFilters.rateMax)) return false;
    // Status filter
    if (loadsFilters.status !== 'all' && load.status !== loadsFilters.status) return false;
    // Date filter
    if (loadsFilters.dateFrom || loadsFilters.dateTo) {
      const createdDate = new Date(load.created_at);
      if (loadsFilters.dateFrom && createdDate < new Date(loadsFilters.dateFrom)) return false;
      if (loadsFilters.dateTo && createdDate > new Date(loadsFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by created_at descending (most recent first)
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });

  // Format date for display (date only)
  const formatCreationDate = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display (time only)
  const formatCreationTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get unique values for Loads filters
  const uniqueLoadNumbers = [...new Set(orders.map(l => l.order_number).filter(Boolean))];
  const uniqueShippers = [...new Set(orders.map(l => l.shipper_name).filter(Boolean))];
  const uniqueLoadPickups = [...new Set(orders.map(l => l.pickup_location).filter(Boolean))];
  const uniqueLoadDeliveries = [...new Set(orders.map(l => l.delivery_location).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
          <p className="text-muted-foreground">Track and manage all shipment orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadOrders}>
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
          
          {/* Rate Confirmation Dialog */}
          <Dialog open={showRateConfirmation} onOpenChange={setShowRateConfirmation}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <i className="fas fa-file-invoice mr-2"></i>
                Rate Confirmation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Rate Confirmation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Upload a rate confirmation document (PDF or image) and our AI will automatically extract order details.
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate-confirmation-file">Document File</Label>
                  <Input
                    id="rate-confirmation-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={parsingDocument}
                  />
                  {uploadedFile && (
                    <div className="text-sm text-foreground flex items-center">
                      <i className="fas fa-check-circle mr-2"></i>
                      {uploadedFile.name}
                    </div>
                  )}
                </div>

                <div className="bg-muted border border-border rounded-lg p-3 text-sm">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-foreground mt-0.5 mr-2"></i>
                    <div>
                      <p className="font-semibold text-blue-900">AI-Powered Extraction</p>
                      <p className="text-foreground mt-1">
                        Our AI will extract shipper details, pickup/delivery locations, commodity info, and more from your document.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRateConfirmation(false);
                      setUploadedFile(null);
                    }}
                    disabled={parsingDocument}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleParseRateConfirmation}
                    disabled={!uploadedFile || parsingDocument}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {parsingDocument ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Parsing Document...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        Parse & Create Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <i className="fas fa-plus mr-2"></i>
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Equipment Selection */}
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Equipment *</Label>
                  <Select value={formData.equipment_id} onValueChange={(value) => handleInputChange('equipment_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipper Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Shipper Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipper_name">Shipper Name</Label>
                      <Input
                        id="shipper_name"
                        value={formData.shipper_name}
                        onChange={(e) => handleInputChange('shipper_name', e.target.value)}
                        placeholder="Enter shipper name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipper_address">Shipper Address</Label>
                      <Input
                        id="shipper_address"
                        value={formData.shipper_address}
                        onChange={(e) => handleInputChange('shipper_address', e.target.value)}
                        placeholder="Enter shipper address"
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Pickup Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_location">Pickup Location *</Label>
                      <Input
                        id="pickup_location"
                        value={formData.pickup_location}
                        onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                        placeholder="Enter pickup address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_city">Pickup City</Label>
                      <Input
                        id="pickup_city"
                        value={formData.pickup_city}
                        onChange={(e) => handleInputChange('pickup_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_state">Pickup State</Label>
                      <Input
                        id="pickup_state"
                        value={formData.pickup_state}
                        onChange={(e) => handleInputChange('pickup_state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_country">Pickup Country</Label>
                      <Input
                        id="pickup_country"
                        value={formData.pickup_country}
                        onChange={(e) => handleInputChange('pickup_country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_time_planned">Planned Pickup Time</Label>
                      <Input
                        id="pickup_time_planned"
                        type="datetime-local"
                        value={formData.pickup_time_planned}
                        onChange={(e) => handleInputChange('pickup_time_planned', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_location">Delivery Location *</Label>
                      <Input
                        id="delivery_location"
                        value={formData.delivery_location}
                        onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                        placeholder="Enter delivery address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_city">Delivery City</Label>
                      <Input
                        id="delivery_city"
                        value={formData.delivery_city}
                        onChange={(e) => handleInputChange('delivery_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_state">Delivery State</Label>
                      <Input
                        id="delivery_state"
                        value={formData.delivery_state}
                        onChange={(e) => handleInputChange('delivery_state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_country">Delivery Country</Label>
                      <Input
                        id="delivery_country"
                        value={formData.delivery_country}
                        onChange={(e) => handleInputChange('delivery_country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_time_planned">Planned Delivery Time</Label>
                      <Input
                        id="delivery_time_planned"
                        type="datetime-local"
                        value={formData.delivery_time_planned}
                        onChange={(e) => handleInputChange('delivery_time_planned', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Cargo Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Cargo Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commodity">Commodity</Label>
                      <Input
                        id="commodity"
                        value={formData.commodity}
                        onChange={(e) => handleInputChange('commodity', e.target.value)}
                        placeholder="Enter commodity type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="Enter weight"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cubes">Cubes (cu ft)</Label>
                      <Input
                        id="cubes"
                        type="number"
                        value={formData.cubes}
                        onChange={(e) => handleInputChange('cubes', e.target.value)}
                        placeholder="Enter cubic feet"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle and Driver Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Vehicle & Driver Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tractor_number">Tractor Number</Label>
                      <Input
                        id="tractor_number"
                        value={formData.tractor_number}
                        onChange={(e) => handleInputChange('tractor_number', e.target.value)}
                        placeholder="Enter tractor number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trailer_number">Trailer Number</Label>
                      <Input
                        id="trailer_number"
                        value={formData.trailer_number}
                        onChange={(e) => handleInputChange('trailer_number', e.target.value)}
                        placeholder="Enter trailer number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_name">Driver Name</Label>
                      <Input
                        id="driver_name"
                        value={formData.driver_name}
                        onChange={(e) => handleInputChange('driver_name', e.target.value)}
                        placeholder="Enter driver name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_id">Driver ID</Label>
                      <Input
                        id="driver_id"
                        value={formData.driver_id}
                        onChange={(e) => handleInputChange('driver_id', e.target.value)}
                        placeholder="Enter driver ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Date and Notes */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmed_rate">Confirmed Rate ($)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="confirmed_rate"
                          type="text"
                          value={formData.confirmed_rate}
                          onChange={(e) => handleConfirmedRateChange(e.target.value)}
                          onBlur={(e) => {
                            // Format on blur
                            if (formData.confirmed_rate) {
                              const formatted = formatCurrency(formData.confirmed_rate);
                              if (formatted) {
                                setFormData(prev => ({ ...prev, confirmed_rate: parseFloat(formData.confirmed_rate).toFixed(2) }));
                              }
                            }
                          }}
                          onFocus={(e) => {
                            // Remove formatting on focus for easier editing
                            if (formData.confirmed_rate) {
                              e.target.select();
                            }
                          }}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Enter numeric value only (e.g., 1250.50)</p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Enter any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowOrderForm(false);
                    setEditingOrder(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitOrder} className="btn-primary">
                    {editingOrder ? 'Update Order' : 'Create Order'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by order #, shipper, driver, or commodity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'planned' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('planned')}
                size="sm"
              >
                Planned
              </Button>
              <Button
                variant={filterStatus === 'in_transit_pickup' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('in_transit_pickup')}
                size="sm"
              >
                In-Transit
              </Button>
              <Button
                variant={filterStatus === 'delivered' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('delivered')}
                size="sm"
              >
                Delivered
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('paid')}
                size="sm"
              >
                Paid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Loads, Active Loads and Load History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
          <TabsTrigger value="loads">
            <i className="fas fa-truck-loading mr-2"></i>
            Loads ({filteredLoads.length})
          </TabsTrigger>
          <TabsTrigger value="active-loads">
            <i className="fas fa-truck mr-2"></i>
            Active Loads ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="load-history">
            <i className="fas fa-history mr-2"></i>
            Load History ({paidOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Loads Tab (Synced with Sales/Business Development) */}
        <TabsContent value="loads">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>
                    <i className="fas fa-truck-loading mr-2 text-foreground"></i>
                    Loads ({filteredLoads.length})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{orders.length} total</span>
                </div>
                <Button variant="outline" onClick={loadOrders}>
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            {/* Custom Loads Filter Bar - Single Line (Same as Sales/Business Development) */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                {/* Load Number Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Load #</label>
                  <select
                    value={loadsFilters.loadNumber}
                    onChange={(e) => setLoadsFilters({ ...loadsFilters, loadNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueLoadNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                {/* Shipper Filter */}
                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Shipper</label>
                  <select
                    value={loadsFilters.shipper}
                    onChange={(e) => setLoadsFilters({ ...loadsFilters, shipper: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueShippers.map(shipper => (
                      <option key={shipper} value={shipper}>{shipper.length > 15 ? shipper.substring(0, 15) + '...' : shipper}</option>
                    ))}
                  </select>
                </div>

                {/* Pickup Location Filter */}
                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Pickup</label>
                  <select
                    value={loadsFilters.pickupLocation}
                    onChange={(e) => setLoadsFilters({ ...loadsFilters, pickupLocation: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueLoadPickups.map(loc => (
                      <option key={loc} value={loc}>{loc.length > 15 ? loc.substring(0, 15) + '...' : loc}</option>
                    ))}
                  </select>
                </div>

                {/* Delivery Location Filter */}
                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Delivery</label>
                  <select
                    value={loadsFilters.deliveryLocation}
                    onChange={(e) => setLoadsFilters({ ...loadsFilters, deliveryLocation: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueLoadDeliveries.map(loc => (
                      <option key={loc} value={loc}>{loc.length > 15 ? loc.substring(0, 15) + '...' : loc}</option>
                    ))}
                  </select>
                </div>

                {/* Rate Range Filter */}
                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Rate ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={loadsFilters.rateMin}
                      onChange={(e) => setLoadsFilters({ ...loadsFilters, rateMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={loadsFilters.rateMax}
                      onChange={(e) => setLoadsFilters({ ...loadsFilters, rateMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={loadsFilters.status}
                    onChange={(e) => setLoadsFilters({ ...loadsFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="planned">Planned</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Creation Date Range Filter */}
                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Creation Date</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={loadsFilters.dateFrom}
                      onChange={(e) => setLoadsFilters({ ...loadsFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={loadsFilters.dateTo}
                      onChange={(e) => setLoadsFilters({ ...loadsFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(loadsFilters.loadNumber !== 'all' || loadsFilters.shipper !== 'all' || 
                  loadsFilters.pickupLocation !== 'all' || loadsFilters.deliveryLocation !== 'all' ||
                  loadsFilters.rateMin || loadsFilters.rateMax || loadsFilters.status !== 'all' ||
                  loadsFilters.dateFrom || loadsFilters.dateTo) && (
                  <button
                    onClick={() => setLoadsFilters({
                      loadNumber: 'all',
                      shipper: 'all',
                      pickupLocation: 'all',
                      deliveryLocation: 'all',
                      rateMin: '',
                      rateMax: '',
                      status: 'all',
                      dateFrom: '',
                      dateTo: ''
                    })}
                    className="px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-muted rounded transition-colors whitespace-nowrap"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <CardContent className="p-0">
              {filteredLoads.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-truck-loading text-muted-foreground text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">{orders.length === 0 ? 'No Loads Yet' : 'No Loads Match Your Filters'}</h3>
                  <p className="text-muted-foreground mb-4">{orders.length === 0 ? 'Create loads from rate quotes in Sales/Business Development' : 'Try adjusting your filters'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Load #</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Status</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Driver</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Carrier</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Carrier Rate</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Pickup Location</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Pickup Planned</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Pickup Actual In</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Pickup Actual Out</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Delivery Location</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Delivery Planned</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Delivery Actual In</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Delivery Actual Out</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Source Quote</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLoads.map((load, index) => (
                        <tr key={load.id} className={`hover:bg-muted ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}>
                          <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground text-xs">
                            {load.order_number || load.id?.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Select value={load.status || 'pending'} onValueChange={(value) => handleStatusChange(load.id, value)}>
                              <SelectTrigger className={`h-7 w-[120px] text-xs border-0 ${
                                load.status === 'pending' ? 'bg-muted text-foreground' :
                                load.status === 'planned' ? 'bg-muted text-foreground' :
                                load.status === 'in_transit_pickup' || load.status === 'in_transit' ? 'bg-muted text-foreground' :
                                load.status === 'at_pickup' ? 'bg-muted text-foreground' :
                                load.status === 'in_transit_delivery' ? 'bg-muted text-foreground' :
                                load.status === 'at_delivery' ? 'bg-muted text-foreground' :
                                load.status === 'delivered' ? 'bg-muted text-foreground' :
                                load.status === 'invoiced' ? 'bg-muted text-foreground' :
                                load.status === 'payment_overdue' ? 'bg-muted text-foreground' :
                                load.status === 'paid' ? 'bg-muted text-emerald-800' :
                                'bg-muted text-foreground'
                              }`}>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="in_transit_pickup">In-Transit Pickup</SelectItem>
                                <SelectItem value="at_pickup">At Pickup</SelectItem>
                                <SelectItem value="in_transit_delivery">In-Transit Delivery</SelectItem>
                                <SelectItem value="at_delivery">At Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="invoiced">Invoiced</SelectItem>
                                <SelectItem value="payment_overdue">Payment Overdue</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Select 
                              value={load.assigned_driver || 'none'} 
                              onValueChange={(value) => handleInlineDispatchUpdate(load.id, 'assigned_driver', value === 'none' ? '' : value)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue placeholder="Select Driver" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {uniqueDrivers.map(driver => (
                                  <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                                ))}
                                <SelectItem value="__new__">+ Add New</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Select 
                              value={load.assigned_carrier || 'none'} 
                              onValueChange={(value) => handleInlineDispatchUpdate(load.id, 'assigned_carrier', value === 'none' ? '' : value)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue placeholder="Select Carrier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {uniqueCarriers.map(carrier => (
                                  <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                                ))}
                                <SelectItem value="__new__">+ Add New</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-semibold text-foreground text-xs">
                            ${load.confirmed_rate?.toFixed(2) || load.total_cost?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="max-w-[120px] truncate text-xs" title={load.pickup_location}>
                              {load.pickup_location || `${load.pickup_city || ''}, ${load.pickup_state || ''}`}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.pickup_time_planned)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="datetime-local"
                              className="h-7 w-[140px] text-xs border rounded px-1"
                              value={formatDateTimeForInput(load.pickup_time_actual_in)}
                              onChange={(e) => handleInlineDispatchUpdate(load.id, 'pickup_time_actual_in', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="datetime-local"
                              className="h-7 w-[140px] text-xs border rounded px-1"
                              value={formatDateTimeForInput(load.pickup_time_actual_out)}
                              onChange={(e) => handleInlineDispatchUpdate(load.id, 'pickup_time_actual_out', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="max-w-[120px] truncate text-xs" title={load.delivery_location}>
                              {load.delivery_location || `${load.delivery_city || ''}, ${load.delivery_state || ''}`}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.delivery_time_planned)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="datetime-local"
                              className="h-7 w-[140px] text-xs border rounded px-1"
                              value={formatDateTimeForInput(load.delivery_time_actual_in)}
                              onChange={(e) => handleInlineDispatchUpdate(load.id, 'delivery_time_actual_in', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="datetime-local"
                              className="h-7 w-[140px] text-xs border rounded px-1"
                              value={formatDateTimeForInput(load.delivery_time_actual_out)}
                              onChange={(e) => handleInlineDispatchUpdate(load.id, 'delivery_time_actual_out', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {load.source_quote_number ? (
                              <Badge variant="outline" className="text-xs">
                                {load.source_quote_number}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openDispatchModal(load)} title="Edit Dispatch Info">
                                <i className="fas fa-truck text-foreground"></i>
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => handleEditOrder(load)} title="Edit Order">
                                <i className="fas fa-edit text-foreground"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Loads Tab */}
        <TabsContent value="active-loads">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Active Loads</CardTitle>
                <div className="flex space-x-2">
                  <FeatureGate flag="export_downloads" fallback={<div className="text-xs text-muted-foreground">Downloads disabled</div>}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={activeOrders.length === 0}>
                          <i className="fas fa-download mr-2"></i>
                          Download
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCSV(activeOrders, `active-loads-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-file-csv text-muted-foreground"></i>
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToExcel(activeOrders, `active-loads-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-file-excel text-foreground"></i>
                          Export Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToJSON(activeOrders, `active-loads-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-code text-foreground"></i>
                          Export JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FeatureGate>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeOrders.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-clipboard-list text-muted-foreground text-5xl mb-4"></i>
                  <p className="text-muted-foreground">No active orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Order #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Confirmed Rate</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Shipper Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Shipper Address</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Location</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup City</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup State</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Country</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Location</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery City</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery State</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Country</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Commodity</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Weight (lbs)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Cubes (cu ft)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Tractor #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Trailer #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Driver Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Driver ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Time (Planned)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Time (Actual)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Time (Planned)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Time (Actual)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">
                            {order.order_number || order.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className={`w-48 ${getStatusColor(order.status)} border`}>
                                <SelectValue>
                                  {getStatusLabel(order.status)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-foreground">
                            {order.confirmed_rate ? `$${order.confirmed_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.shipper_name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.shipper_address || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_location || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_city || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_state || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_country || 'USA'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_location || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_city || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_state || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_country || 'USA'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.commodity || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            {order.weight ? order.weight.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">{order.cubes || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.tractor_number || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.trailer_number || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.driver_name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.driver_id || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.pickup_time_planned)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.pickup_time_actual)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.delivery_time_planned)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.delivery_time_actual)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" title="View Order">
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditOrder(order)}
                                disabled={order.status !== 'pending'}
                                title={order.status === 'pending' ? 'Edit Order' : 'Only pending orders can be edited'}
                                className={order.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Load History Tab */}
        <TabsContent value="load-history">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Load History</CardTitle>
                <div className="flex space-x-2">
                  <FeatureGate flag="export_downloads" fallback={<div className="text-xs text-muted-foreground">Downloads disabled</div>}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={paidOrders.length === 0}>
                          <i className="fas fa-download mr-2"></i>
                          Download
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCSV(paidOrders, `load-history-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-file-csv text-muted-foreground"></i>
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToExcel(paidOrders, `load-history-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-file-excel text-foreground"></i>
                          Export Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToJSON(paidOrders, `load-history-${new Date().toISOString().split('T')[0]}`)}>
                          <i className="fas fa-code text-foreground"></i>
                          Export JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FeatureGate>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {paidOrders.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-check-circle text-muted-foreground text-5xl mb-4"></i>
                  <p className="text-muted-foreground">No completed/paid orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Order #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Confirmed Rate</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Shipper Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Shipper Address</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Location</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup City</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup State</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Country</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Location</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery City</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery State</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Country</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Commodity</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Weight (lbs)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Cubes (cu ft)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Tractor #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Trailer #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Driver Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Driver ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Time (Planned)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Pickup Time (Actual)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Time (Planned)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Delivery Time (Actual)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paidOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">
                            {order.order_number || order.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className="bg-green-600 text-white">
                              <i className="fas fa-check-circle mr-1"></i>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-foreground">
                            {order.confirmed_rate ? `$${order.confirmed_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.shipper_name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.shipper_address || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_location || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_city || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_state || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.pickup_country || 'USA'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_location || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_city || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_state || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.delivery_country || 'USA'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.commodity || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            {order.weight ? order.weight.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            {order.cubes ? order.cubes.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.tractor_number || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.trailer_number || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.driver_name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{order.driver_id || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.pickup_time_planned)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.pickup_time_actual)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.delivery_time_planned)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(order.delivery_time_actual)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" title="View Order">
                                <i className="fas fa-eye"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispatch Edit Modal */}
      <Dialog open={showDispatchModal} onOpenChange={setShowDispatchModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-truck text-foreground"></i>
              Dispatch Load - {dispatchingLoad?.order_number || 'Load'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Driver/Carrier Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_driver">Assign Driver *</Label>
                <Select 
                  value={dispatchData.assigned_driver_id}
                  onValueChange={(value) => {
                    const driver = availableDrivers.find(d => d.id === value);
                    setDispatchData({
                      ...dispatchData,
                      assigned_driver_id: value,
                      assigned_driver: driver?.full_name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 ? (
                      <SelectItem value="none" disabled>No drivers available</SelectItem>
                    ) : (
                      availableDrivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <span>{driver.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {driver.status || 'available'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {dispatchData.assigned_driver && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {dispatchData.assigned_driver}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_carrier">Assigned Carrier</Label>
                <Input
                  id="assigned_carrier"
                  value={dispatchData.assigned_carrier}
                  onChange={(e) => setDispatchData({ ...dispatchData, assigned_carrier: e.target.value })}
                  placeholder="Enter carrier name"
                />
              </div>
            </div>

            {/* Actual Pickup Times */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Actual Pickup Time</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_time_actual_in">Time In</Label>
                  <Input
                    id="pickup_time_actual_in"
                    type="datetime-local"
                    value={dispatchData.pickup_time_actual_in}
                    onChange={(e) => setDispatchData({ ...dispatchData, pickup_time_actual_in: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup_time_actual_out">Time Out</Label>
                  <Input
                    id="pickup_time_actual_out"
                    type="datetime-local"
                    value={dispatchData.pickup_time_actual_out}
                    onChange={(e) => setDispatchData({ ...dispatchData, pickup_time_actual_out: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Actual Delivery Times */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Actual Delivery Time</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_time_actual_in">Time In</Label>
                  <Input
                    id="delivery_time_actual_in"
                    type="datetime-local"
                    value={dispatchData.delivery_time_actual_in}
                    onChange={(e) => setDispatchData({ ...dispatchData, delivery_time_actual_in: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time_actual_out">Time Out</Label>
                  <Input
                    id="delivery_time_actual_out"
                    type="datetime-local"
                    value={dispatchData.delivery_time_actual_out}
                    onChange={(e) => setDispatchData({ ...dispatchData, delivery_time_actual_out: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="default" 
                onClick={handlePushToDriver}
                disabled={!dispatchData.assigned_driver_id}
                className="bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Push to Driver App
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowDispatchModal(false);
                  setDispatchingLoad(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDispatch} className="bg-purple-600 hover:bg-purple-700">
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Stats - Removed per user request */}
    </div>
  );
};

export default OrderManagement;
