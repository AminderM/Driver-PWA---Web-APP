import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import OSMMapPreview from './OSMMapPreview';
import OSMAutocomplete from './OSMAutocomplete';
import DraggableFreightCalculator from './DraggableFreightCalculator';

// Unified Converter Component
const UnifiedConverter = () => {
  const [conversionType, setConversionType] = useState('weight');
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  const conversionConfig = {
    weight: {
      icon: 'fa-weight',
      color: 'green',
      fromUnit: 'Pounds (lbs)',
      toUnit: 'Kilograms (kg)',
      fromToRatio: 0.453592,
      toFromRatio: 2.20462,
      quickRef: [
        { label: '1 lb', value: '0.453 kg' },
        { label: '1 kg', value: '2.205 lbs' },
        { label: '1 ton (US)', value: '907 kg' },
        { label: '1 tonne', value: '2,205 lbs' }
      ]
    },
    temperature: {
      icon: 'fa-thermometer-half',
      color: 'red',
      fromUnit: 'Fahrenheit (°F)',
      toUnit: 'Celsius (°C)',
      convertFromTo: (f) => ((f - 32) * 5/9).toFixed(2),
      convertToFrom: (c) => ((c * 9/5) + 32).toFixed(2),
      quickRef: [
        { label: 'Freezing', value: '32°F / 0°C' },
        { label: 'Room Temp', value: '68°F / 20°C' },
        { label: 'Body Temp', value: '98.6°F / 37°C' },
        { label: 'Boiling', value: '212°F / 100°C' }
      ]
    },
    distance: {
      icon: 'fa-ruler',
      color: 'purple',
      fromUnit: 'Miles',
      toUnit: 'Kilometers',
      fromToRatio: 1.60934,
      toFromRatio: 0.621371,
      quickRef: [
        { label: '1 mile', value: '1.609 km' },
        { label: '1 km', value: '0.621 miles' },
        { label: '100 miles', value: '161 km' },
        { label: '100 km', value: '62 miles' }
      ]
    }
  };

  const config = conversionConfig[conversionType];

  const handleInputChange = (value, isFromUnit) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || value === '') {
      setInputValue('');
      setOutputValue('');
      return;
    }

    if (isFromUnit) {
      setInputValue(value);
      if (conversionType === 'temperature') {
        setOutputValue(config.convertFromTo(numValue));
      } else {
        setOutputValue((numValue * config.fromToRatio).toFixed(2));
      }
    } else {
      setOutputValue(value);
      if (conversionType === 'temperature') {
        setInputValue(config.convertToFrom(numValue));
      } else {
        setInputValue((numValue * config.toFromRatio).toFixed(2));
      }
    }
  };

  const handleTypeChange = (newType) => {
    setConversionType(newType);
    setInputValue('');
    setOutputValue('');
  };

  return (
    <Card className="h-[280px] flex flex-col">
      <CardHeader className="flex-shrink-0 px-4 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <i className={`fas ${config.icon} text-muted-foreground`}></i>
            Unit Converter
          </CardTitle>
          <Select value={conversionType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 flex-1 overflow-y-auto">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">{config.fromUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.fromUnit.toLowerCase()}`}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value, true)}
            className="h-9 border-border rounded-lg"
          />
        </div>

        <div className="text-center py-1">
          <i className="fas fa-exchange-alt text-muted-foreground text-sm"></i>
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">{config.toUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.toUnit.toLowerCase()}`}
            value={outputValue}
            onChange={(e) => handleInputChange(e.target.value, false)}
            className="h-9 border-border rounded-lg"
          />
        </div>

        <div className="p-2 bg-muted rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Quick Reference:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {config.quickRef.slice(0, 2).map((ref, idx) => (
              <div key={idx}>
                <span className="font-semibold">{ref.label}:</span> {ref.value}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Reusable Filter Bar Component
const FilterBar = ({ 
  filters, 
  setFilters, 
  columns, 
  statusOptions = [],
  sourceOptions = [],
  showSource = false,
  placeholder = "Search..."
}) => {
  const clearFilters = () => {
    setFilters({
      searchText: '',
      filterColumn: 'all',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      source: 'all'
    });
  };

  const hasActiveFilters = filters.searchText || filters.dateFrom || filters.dateTo || 
    filters.status !== 'all' || (showSource && filters.source !== 'all');

  return (
    <div className="p-4 bg-muted border-b border-border">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs"></i>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Column Filter */}
        <div className="w-[150px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Filter By Column</label>
          <select
            value={filters.filterColumn}
            onChange={(e) => setFilters({ ...filters, filterColumn: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
          >
            <option value="all">All Columns</option>
            {columns.map(col => (
              <option key={col.value} value={col.value}>{col.label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        {statusOptions.length > 0 && (
          <div className="w-[130px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
            >
              <option value="all">All Status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Source Filter (for Leads) */}
        {showSource && sourceOptions.length > 0 && (
          <div className="w-[130px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
            >
              <option value="all">All Sources</option>
              {sourceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
          >
            <i className="fas fa-times text-xs"></i>
            Clear
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.searchText && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-foreground rounded-full">
              Search: "{filters.searchText}"
              <button onClick={() => setFilters({ ...filters, searchText: '' })} className="ml-1 hover:text-foreground">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-foreground rounded-full">
              From: {filters.dateFrom}
              <button onClick={() => setFilters({ ...filters, dateFrom: '' })} className="ml-1 hover:text-foreground">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-foreground rounded-full">
              To: {filters.dateTo}
              <button onClick={() => setFilters({ ...filters, dateTo: '' })} className="ml-1 hover:text-foreground">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-foreground rounded-full">
              Status: {filters.status}
              <button onClick={() => setFilters({ ...filters, status: 'all' })} className="ml-1 hover:text-foreground">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {showSource && filters.source !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-foreground rounded-full">
              Source: {filters.source}
              <button onClick={() => setFilters({ ...filters, source: 'all' })} className="ml-1 hover:text-foreground">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const SalesDepartment = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loads, setLoads] = useState([]);
  const [quoteCounter, setQuoteCounter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new'
  });

  // Filter states for each tab
  const [pipelineFilters, setPipelineFilters] = useState({
    opportunity: 'all',
    company: 'all',
    valueMin: '',
    valueMax: '',
    stage: 'all',
    probabilityMin: '',
    probabilityMax: '',
    closeDateFrom: '',
    closeDateTo: ''
  });
  
  const [leadsFilters, setLeadsFilters] = useState({
    searchText: '',
    filterColumn: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    source: 'all'
  });
  
  const [customersFilters, setCustomersFilters] = useState({
    company: 'all',
    contactPerson: 'all',
    email: 'all',
    phone: 'all',
    revenueMin: '',
    revenueMax: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const [quotesFilters, setQuotesFilters] = useState({
    quoteNumber: 'all',
    pickupLocation: 'all',
    destination: 'all',
    consignor: 'all',
    consignee: 'all',
    customer: 'all',
    amountMin: '',
    amountMax: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
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

  // Filter helper functions
  const filterByDate = (item, dateField, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return true;
    const itemDate = new Date(item[dateField] || item.created_at || item.createdAt);
    if (dateFrom && itemDate < new Date(dateFrom)) return false;
    if (dateTo && itemDate > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  };

  const filterByText = (item, searchText, filterColumn, columns) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    
    if (filterColumn === 'all') {
      return columns.some(col => {
        const value = item[col];
        return value && String(value).toLowerCase().includes(search);
      });
    }
    
    const value = item[filterColumn];
    return value && String(value).toLowerCase().includes(search);
  };

  // Filtered data
  const filteredOpportunities = opportunities.filter(opp => {
    // Opportunity filter (search by title)
    if (pipelineFilters.opportunity !== 'all' && 
        !opp.title?.toLowerCase().includes(pipelineFilters.opportunity.toLowerCase())) return false;
    
    // Company filter
    if (pipelineFilters.company !== 'all' && opp.company !== pipelineFilters.company) return false;
    
    // Value range filter
    if (pipelineFilters.valueMin && opp.value < parseFloat(pipelineFilters.valueMin)) return false;
    if (pipelineFilters.valueMax && opp.value > parseFloat(pipelineFilters.valueMax)) return false;
    
    // Stage filter
    if (pipelineFilters.stage !== 'all' && opp.stage !== pipelineFilters.stage) return false;
    
    // Probability range filter
    if (pipelineFilters.probabilityMin && opp.probability < parseFloat(pipelineFilters.probabilityMin)) return false;
    if (pipelineFilters.probabilityMax && opp.probability > parseFloat(pipelineFilters.probabilityMax)) return false;
    
    // Creation Date range filter (using created_at)
    if (pipelineFilters.closeDateFrom || pipelineFilters.closeDateTo) {
      const createdDate = new Date(opp.created_at || opp.createdAt);
      if (pipelineFilters.closeDateFrom && createdDate < new Date(pipelineFilters.closeDateFrom)) return false;
      if (pipelineFilters.closeDateTo && createdDate > new Date(pipelineFilters.closeDateTo + 'T23:59:59')) return false;
    }
    
    return true;
  });

  // Get unique values for dropdown options
  const uniqueCompanies = [...new Set(opportunities.map(opp => opp.company).filter(Boolean))];
  const uniqueOpportunities = [...new Set(opportunities.map(opp => opp.title).filter(Boolean))];

  const filteredLeads = leads.filter(lead => {
    if (leadsFilters.status !== 'all' && lead.status !== leadsFilters.status) return false;
    if (leadsFilters.source !== 'all' && lead.source !== leadsFilters.source) return false;
    if (!filterByDate(lead, 'created_at', leadsFilters.dateFrom, leadsFilters.dateTo)) return false;
    return filterByText(lead, leadsFilters.searchText, leadsFilters.filterColumn,
      ['company_name', 'contact_person', 'email', 'phone', 'source', 'status']);
  });

  const filteredCustomers = customers.filter(customer => {
    // Company filter
    if (customersFilters.company !== 'all' && customer.company_name !== customersFilters.company) return false;
    // Contact Person filter
    if (customersFilters.contactPerson !== 'all' && customer.contact_person !== customersFilters.contactPerson) return false;
    // Revenue range filter
    if (customersFilters.revenueMin && customer.total_revenue < parseFloat(customersFilters.revenueMin)) return false;
    if (customersFilters.revenueMax && customer.total_revenue > parseFloat(customersFilters.revenueMax)) return false;
    // Status filter
    if (customersFilters.status !== 'all' && customer.status !== customersFilters.status) return false;
    // Date filter
    if (customersFilters.dateFrom || customersFilters.dateTo) {
      const createdDate = new Date(customer.created_at || customer.createdAt);
      if (customersFilters.dateFrom && createdDate < new Date(customersFilters.dateFrom)) return false;
      if (customersFilters.dateTo && createdDate > new Date(customersFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Get unique values for Customers filters
  const uniqueCustomerCompanies = [...new Set(customers.map(c => c.company_name).filter(Boolean))];
  const uniqueCustomerContacts = [...new Set(customers.map(c => c.contact_person).filter(Boolean))];

  const filteredQuotes = quotes.filter(quote => {
    // Quote Number filter
    if (quotesFilters.quoteNumber !== 'all' && quote.quoteNumber !== quotesFilters.quoteNumber) return false;
    // Pickup Location filter
    if (quotesFilters.pickupLocation !== 'all' && quote.pickupLocation !== quotesFilters.pickupLocation) return false;
    // Destination filter
    if (quotesFilters.destination !== 'all' && quote.destination !== quotesFilters.destination) return false;
    // Consignor filter
    if (quotesFilters.consignor !== 'all' && quote.consignor !== quotesFilters.consignor) return false;
    // Consignee filter
    if (quotesFilters.consignee !== 'all' && quote.consignee !== quotesFilters.consignee) return false;
    // Customer filter
    if (quotesFilters.customer !== 'all' && quote.customer !== quotesFilters.customer) return false;
    // Amount range filter
    if (quotesFilters.amountMin && parseFloat(quote.totalAmount) < parseFloat(quotesFilters.amountMin)) return false;
    if (quotesFilters.amountMax && parseFloat(quote.totalAmount) > parseFloat(quotesFilters.amountMax)) return false;
    // Status filter
    if (quotesFilters.status !== 'all' && quote.status !== quotesFilters.status) return false;
    // Date filter
    if (quotesFilters.dateFrom || quotesFilters.dateTo) {
      const createdDate = new Date(quote.createdAt);
      if (quotesFilters.dateFrom && createdDate < new Date(quotesFilters.dateFrom)) return false;
      if (quotesFilters.dateTo && createdDate > new Date(quotesFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Get unique values for Quotes filters
  const uniqueQuoteNumbers = [...new Set(quotes.map(q => q.quoteNumber).filter(Boolean))];
  const uniquePickupLocations = [...new Set(quotes.map(q => q.pickupLocation).filter(Boolean))];
  const uniqueDestinations = [...new Set(quotes.map(q => q.destination).filter(Boolean))];
  const uniqueConsignors = [...new Set(quotes.map(q => q.consignor).filter(Boolean))];
  const uniqueConsignees = [...new Set(quotes.map(q => q.consignee).filter(Boolean))];
  const uniqueQuoteCustomers = [...new Set(quotes.map(q => q.customer).filter(Boolean))];

  const filteredLoads = loads.filter(load => {
    // Load Number filter
    if (loadsFilters.loadNumber !== 'all' && load.order_number !== loadsFilters.loadNumber) return false;
    // Shipper filter
    if (loadsFilters.shipper !== 'all' && load.shipper_name !== loadsFilters.shipper) return false;
    // Pickup Location filter
    if (loadsFilters.pickupLocation !== 'all' && load.pickup_location !== loadsFilters.pickupLocation) return false;
    // Delivery Location filter
    if (loadsFilters.deliveryLocation !== 'all' && load.delivery_location !== loadsFilters.deliveryLocation) return false;
    // Rate range filter (use customer_rate for Sales view)
    const loadRate = load.customer_rate || load.confirmed_rate || load.total_cost || 0;
    if (loadsFilters.rateMin && loadRate < parseFloat(loadsFilters.rateMin)) return false;
    if (loadsFilters.rateMax && loadRate > parseFloat(loadsFilters.rateMax)) return false;
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
  const uniqueLoadNumbers = [...new Set(loads.map(l => l.order_number).filter(Boolean))];
  const uniqueShippers = [...new Set(loads.map(l => l.shipper_name).filter(Boolean))];
  const uniqueLoadPickups = [...new Set(loads.map(l => l.pickup_location).filter(Boolean))];
  const uniqueLoadDeliveries = [...new Set(loads.map(l => l.delivery_location).filter(Boolean))];
  
  // Multi-tab Freight Calculator state
  const [quoteTabs, setQuoteTabs] = useState([
    {
      id: 1,
      name: 'Quote 1',
      data: {
        pickupLocation: '',
        destination: '',
        stops: [],
        distance: 0,
        ratePerMile: 0,
        ratePerLbs: 0,
        fuelSurcharge: 0,
        ratePerStop: 0,
        accessorialCharges: 0,
        accessoryName: '',
        margin: 0,
        ftlLtlPercentage: 100,
        consignor: '',
        consignee: '',
        customer: ''
      },
      routeData: null,
      currentStop: ''
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  // Route calculation trigger (for OSM maps)
  const [calculateTrigger, setCalculateTrigger] = useState(0);

  // Get active quote tab
  const activeQuoteTab = quoteTabs.find(tab => tab.id === activeTabId) || quoteTabs[0];
  const quoteData = activeQuoteTab.data;
  const routeData = activeQuoteTab.routeData;
  const currentStop = activeQuoteTab.currentStop;

  // Update active tab
  const updateActiveTab = (updates) => {
    setQuoteTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, ...updates }
        : tab
    ));
  };

  const setQuoteData = (newData) => {
    updateActiveTab({ data: typeof newData === 'function' ? newData(quoteData) : newData });
  };

  const setRouteData = (newRouteData) => {
    updateActiveTab({ routeData: newRouteData });
  };

  const setCurrentStop = (newStop) => {
    updateActiveTab({ currentStop: newStop });
  };

  useEffect(() => {
    loadSalesData();
    loadRateQuotes();
    loadLoads();
  }, [fetchWithAuth, BACKEND_URL]);

  // Load loads from database
  const loadLoads = async () => {
    if (!fetchWithAuth || !BACKEND_URL) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
      if (res.ok) {
        const data = await res.json();
        setLoads(data || []);
      }
    } catch (error) {
      console.error('Error loading loads:', error);
    }
  };

  // Load rate quotes from database
  const loadRateQuotes = async () => {
    if (!fetchWithAuth || !BACKEND_URL) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/sales/rate-quotes`);
      if (res.ok) {
        const data = await res.json();
        const formattedQuotes = (data.quotes || []).map(q => ({
          id: q.id,
          quoteNumber: q.quote_number,
          pickupLocation: q.pickup || 'Not specified',
          destination: q.destination || 'Not specified',
          distance: q.distance || 0,
          totalAmount: q.total_quote?.toFixed(2) || '0.00',
          status: q.status || 'draft',
          createdAt: q.created_at,
          ratePerMile: q.base_rate || 0,
          fuelSurcharge: q.fuel_surcharge || 0,
          ratePerStop: 0,
          accessorialCharges: q.accessorials || 0,
          margin: 0,
          ftlLtlPercentage: q.ftl_ltl_percentage || 0,
          consignor: q.consignor || '',
          consignee: q.consignee || '',
          customer: q.customer || ''
        }));
        setQuotes(formattedQuotes);
        
        // Update quote counter based on existing quotes
        if (data.quotes && data.quotes.length > 0) {
          const maxNumber = Math.max(...data.quotes.map(q => {
            const num = parseInt(q.quote_number?.replace('RQ-', '') || '0');
            return isNaN(num) ? 0 : num;
          }));
          setQuoteCounter(maxNumber + 1);
        }
      }
    } catch (e) {
      console.error('Failed to load rate quotes:', e);
    }
  };

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Load mock data for now - you can replace with actual API calls
      setLeads([
        {
          id: '1',
          company_name: 'ABC Logistics Inc',
          contact_person: 'John Smith',
          email: 'john@abclogistics.com',
          phone: '555-0101',
          source: 'website',
          status: 'new',
          created_at: new Date().toISOString(),
          estimated_value: 50000
        },
        {
          id: '2',
          company_name: 'XYZ Transport Co',
          contact_person: 'Sarah Johnson',
          email: 'sarah@xyztransport.com',
          phone: '555-0102',
          source: 'referral',
          status: 'contacted',
          created_at: new Date().toISOString(),
          estimated_value: 75000
        },
        {
          id: '3',
          company_name: 'Global Shipping Ltd',
          contact_person: 'Mike Davis',
          email: 'mike@globalship.com',
          phone: '555-0103',
          source: 'cold_call',
          status: 'qualified',
          created_at: new Date().toISOString(),
          estimated_value: 120000
        }
      ]);

      setOpportunities([
        {
          id: '1',
          title: 'Quarterly Contract - ABC Logistics',
          company: 'ABC Logistics Inc',
          value: 50000,
          stage: 'proposal',
          probability: 60,
          close_date: '2024-12-31'
        },
        {
          id: '2',
          title: 'Annual Partnership - Global Shipping',
          company: 'Global Shipping Ltd',
          value: 250000,
          stage: 'negotiation',
          probability: 80,
          close_date: '2024-12-15'
        }
      ]);

      setCustomers([
        {
          id: '1',
          company_name: 'FastTrack Distribution',
          contact_person: 'Emily Brown',
          email: 'emily@fasttrack.com',
          phone: '555-0201',
          status: 'active',
          total_revenue: 150000,
          loads_count: 45
        },
        {
          id: '2',
          company_name: 'QuickMove Freight',
          contact_person: 'David Wilson',
          email: 'david@quickmove.com',
          phone: '555-0202',
          status: 'active',
          total_revenue: 220000,
          loads_count: 68
        }
      ]);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = () => {
    if (!newLead.company_name || !newLead.contact_person || !newLead.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const lead = {
      id: Date.now().toString(),
      ...newLead,
      created_at: new Date().toISOString(),
      estimated_value: 0
    };

    setLeads([lead, ...leads]);
    toast.success('Lead added successfully!');
    setShowAddLeadModal(false);
    setNewLead({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      source: 'website',
      status: 'new'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-muted text-foreground',
      contacted: 'bg-muted text-foreground',
      qualified: 'bg-muted text-foreground',
      proposal: 'bg-muted text-foreground',
      negotiation: 'bg-muted text-foreground',
      won: 'bg-muted0 text-white',
      lost: 'bg-muted text-foreground'
    };
    return colors[status] || 'bg-muted text-foreground';
  };

  const getStageColor = (stage) => {
    const colors = {
      prospecting: 'bg-muted0',
      qualification: 'bg-muted0',
      proposal: 'bg-muted0',
      negotiation: 'bg-muted0',
      closed_won: 'bg-muted0',
      closed_lost: 'bg-muted0'
    };
    return colors[stage] || 'bg-muted0';
  };

  const calculateTotalQuote = () => {
    // Calculate base subtotal
    const baseSubtotal = 
      (quoteData.distance * quoteData.ratePerMile) +
      quoteData.fuelSurcharge +
      (quoteData.stops.length * quoteData.ratePerStop) +
      quoteData.accessorialCharges;
    
    // Apply FTL/LTL percentage (truck capacity utilization)
    // 100% = Full Truck Load (pay full rate)
    // 25% = Use 25% of truck (pay 25% of rate)
    const ftlLtlPercentage = quoteData.ftlLtlPercentage || 100;
    const ftlLtlMultiplier = ftlLtlPercentage / 100;
    const adjustedSubtotal = baseSubtotal * ftlLtlMultiplier;
    
    // Apply margin on the adjusted subtotal
    const total = adjustedSubtotal + (adjustedSubtotal * (quoteData.margin / 100));
    return total.toFixed(2);
  };

  const pushToRateQuotes = async () => {
    const quoteNumber = `RQ-${String(quoteCounter).padStart(4, '0')}`;
    
    // Prepare quote data for backend
    // Transform stops from string array to StopLocation objects
    const formattedStops = (quoteData.stops || []).map(stop => ({
      address: stop
    }));
    
    const quotePayload = {
      quote_number: quoteNumber,
      pickup: quoteData.pickupLocation || 'Not specified',
      destination: quoteData.destination || 'Not specified',
      stops: formattedStops,
      distance: quoteData.distance || 0,
      base_rate: (quoteData.distance * quoteData.ratePerMile) || 0,
      fuel_surcharge: quoteData.fuelSurcharge || 0,
      accessorials: quoteData.accessorialCharges || 0,
      total_quote: parseFloat(calculateTotalQuote()) || 0,
      consignor: quoteData.consignor || null,
      consignee: quoteData.consignee || null,
      customer: quoteData.customer || null,
      ftl_ltl_percentage: quoteData.ftlLtlPercentage || null,
      status: 'draft'
    };
    
    try {
      // Save to backend
      const res = await fetchWithAuth(`${BACKEND_URL}/api/sales/rate-quotes`, {
        method: 'POST',
        body: JSON.stringify(quotePayload)
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Create local quote object for state
        const newQuote = {
          id: data.quote_id,
          quoteNumber: data.quote_number,
          pickupLocation: quoteData.pickupLocation || 'Not specified',
          destination: quoteData.destination || 'Not specified',
          distance: quoteData.distance,
          totalAmount: calculateTotalQuote(),
          status: 'draft',
          createdAt: new Date().toISOString(),
          ratePerMile: quoteData.ratePerMile,
          fuelSurcharge: quoteData.fuelSurcharge,
          ratePerStop: quoteData.ratePerStop,
          accessorialCharges: quoteData.accessorialCharges,
          margin: quoteData.margin,
          ftlLtlPercentage: quoteData.ftlLtlPercentage,
          consignor: quoteData.consignor || '',
          consignee: quoteData.consignee || '',
          customer: quoteData.customer || ''
        };
        
        setQuotes([newQuote, ...quotes]);
        setQuoteCounter(quoteCounter + 1);
        setActiveTab('quotes');
        toast.success(`Quote ${data.quote_number} created and saved successfully`);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote. Please try again.');
    }
  };

  // Create a load from a rate quote
  const createLoadFromQuote = async (quote) => {
    try {
      // Parse pickup location to extract city/state
      const pickupParts = quote.pickupLocation?.split(',').map(s => s.trim()) || [];
      const deliveryParts = quote.destination?.split(',').map(s => s.trim()) || [];
      
      // Get both rates
      const customerRate = parseFloat(quote.totalAmount) || 0;  // Rate WITH margin (for Sales)
      const marginPercent = parseFloat(quote.margin) || 0;
      
      // Calculate rate WITHOUT margin (for Dispatch)
      // Total = RateWithoutMargin × (1 + Margin%)
      // So: RateWithoutMargin = Total / (1 + Margin%)
      const dispatchRate = marginPercent > 0 
        ? customerRate / (1 + marginPercent / 100)
        : customerRate;
      
      const loadData = {
        pickup_location: quote.pickupLocation || '',
        pickup_city: pickupParts[0] || '',
        pickup_state: pickupParts[1] || '',
        pickup_country: 'USA',
        delivery_location: quote.destination || '',
        delivery_city: deliveryParts[0] || '',
        delivery_state: deliveryParts[1] || '',
        delivery_country: 'USA',
        shipper_name: quote.consignor || '',
        shipper_address: '',
        commodity: '',
        weight: null,
        cubes: null,
        confirmed_rate: parseFloat(dispatchRate.toFixed(2)),  // Dispatch rate (without margin)
        customer_rate: parseFloat(customerRate.toFixed(2)),   // Sales rate (with margin)
        margin_percentage: marginPercent,
        notes: `Created from Rate Quote ${quote.quoteNumber}`,
        source_quote_id: quote.id,
        source_quote_number: quote.quoteNumber
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bookings/from-quote`, {
        method: 'POST',
        body: JSON.stringify(loadData)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Load ${data.order_number} created from ${quote.quoteNumber}`);
        // Reload loads to show the new load
        await loadLoads();
        // Switch to loads tab
        setActiveTab('loads');
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create load');
      }
    } catch (error) {
      console.error('Error creating load:', error);
      toast.error('Failed to create load. Please try again.');
    }
  };

  // Handle status change for loads (Sales view)
  const handleLoadStatusChange = async (loadId, newStatus) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${loadId}/status?status=${newStatus}`, {
        method: 'PATCH'
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        loadLoads();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
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

  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const generateEmail = async (quote) => {
    try {
      toast.info('AI Assistant is generating your professional email...');
      
      const quoteDetails = `
Generate a professional rate quotation email for the following details:

QUOTE NUMBER: ${quote.quoteNumber}
DATE: ${new Date(quote.createdAt).toLocaleDateString()}

CUSTOMER INFORMATION:
- Customer: ${quote.customer}
- Consignor: ${quote.consignor}
- Consignee: ${quote.consignee}

ROUTE DETAILS:
- Pickup Location: ${quote.pickupLocation}
- Destination: ${quote.destination}
- Distance: ${quote.distance} miles

PRICING BREAKDOWN:
- Rate per Mile: $${quote.ratePerMile}
- Fuel Surcharge: $${quote.fuelSurcharge}
- Rate per Stop: $${quote.ratePerStop}
- Accessorial Charges: $${quote.accessorialCharges}
- Margin: ${quote.margin}%
- FTL/LTL: ${quote.ftlLtlPercentage}%

TOTAL AMOUNT: $${quote.totalAmount}

Please generate:
1. A professional email subject line
2. A complete professional email body with proper formatting, greeting, quote details, terms, and closing

Format the response EXACTLY as:
Subject: [subject line]

Body:
[email body]
      `.trim();

      const response = await fetchWithAuth(`${BACKEND_URL}/api/tms-chat/message`, {
        method: 'POST',
        body: JSON.stringify({
          message: quoteDetails,
          context: 'sales'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse the AI response to extract subject and body
        const emailContent = data.response || '';
        
        setGeneratedEmail({
          content: emailContent,
          quote: quote
        });
        setShowEmailModal(true);
        
        toast.success('Professional quotation email generated successfully!');
      } else {
        throw new Error('Failed to generate email');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    }
  };

  const copyEmailToClipboard = () => {
    if (!generatedEmail) return;
    
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedEmail.content)
          .then(() => {
            toast.success('Email copied to clipboard!');
          })
          .catch(() => {
            // Fallback to older method
            fallbackCopyToClipboard(generatedEmail.content);
          });
      } else {
        // Use fallback method directly
        fallbackCopyToClipboard(generatedEmail.content);
      }
    } catch (error) {
      // Use fallback method
      fallbackCopyToClipboard(generatedEmail.content);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('Email copied to clipboard!');
      } else {
        toast.error('Failed to copy. Please select and copy manually.');
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      toast.error('Failed to copy. Please select and copy manually.');
    }
    
    document.body.removeChild(textArea);
  };

  const isQuoteComplete = (quote) => {
    return quote.consignor && quote.consignee && quote.customer;
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Sales & Business Development
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Lead generation, CRM, rate quotes & customer management</p>
          </div>
          {activeTab === 'leads' && (
            <Button onClick={() => setShowAddLeadModal(true)} className="bg-primary hover:bg-primary/90 rounded-lg">
              <i className="fas fa-plus mr-2"></i>
              Add New Lead
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="px-6 pt-4 bg-muted">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 bg-card rounded-xl p-1 border border-border shadow-sm">
          <TabsTrigger value="analytics" className="text-sm px-2">
            <i className="fas fa-chart-line mr-1.5 text-xs"></i>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-sm px-2">
            <i className="fas fa-user-plus mr-1.5 text-xs"></i>
            Leads
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-sm px-2">
            <i className="fas fa-funnel-dollar mr-1.5 text-xs"></i>
            <span className="hidden sm:inline">Sales </span>Pipeline
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-sm px-2">
            <i className="fas fa-building mr-1.5 text-xs"></i>
            Customers
          </TabsTrigger>
          <TabsTrigger value="calculator" className="text-sm px-2">
            <i className="fas fa-calculator mr-1.5 text-xs"></i>
            <span className="hidden lg:inline">Freight </span>Calculator
          </TabsTrigger>
          <TabsTrigger value="quotes" className="text-sm px-2">
            <i className="fas fa-file-invoice-dollar mr-1.5 text-xs"></i>
            <span className="hidden sm:inline">Rate </span>Quotes
          </TabsTrigger>
          <TabsTrigger value="loads" className="text-sm px-2">
            <i className="fas fa-truck-loading mr-1.5 text-xs"></i>
            Loads
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 pb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card rounded-xl shadow-sm border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold text-foreground">{leads.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <i className="fas fa-user-plus text-foreground text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl shadow-sm border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Opportunities</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{opportunities.length}</p>
                  </div>
                  <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                    <i className="fas fa-handshake text-muted-foreground text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl shadow-sm border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pipeline Value</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ${opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-muted-foreground text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl shadow-sm border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{customers.length}</p>
                  </div>
                  <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                    <i className="fas fa-building text-muted-foreground text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Content */}
          <div className="grid gap-6">
            <Card className="bg-card rounded-2xl shadow-sm border border-border">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Sales & Business Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-20">
                  <i className="fas fa-chart-pie text-foreground text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Analytics Dashboard Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Comprehensive sales analytics, performance metrics, and business insights will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6 pb-6">
          <Card className="bg-card rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">Active Opportunities ({filteredOpportunities.length})</CardTitle>
                <span className="text-xs text-muted-foreground">{opportunities.length} total</span>
              </div>
            </CardHeader>
            
            {/* Custom Pipeline Filter Bar - Single Line */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                {/* Opportunity Filter */}
                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Opportunity</label>
                  <select
                    value={pipelineFilters.opportunity}
                    onChange={(e) => setPipelineFilters({ ...pipelineFilters, opportunity: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueOpportunities.map(opp => (
                      <option key={opp} value={opp}>{opp.length > 20 ? opp.substring(0, 20) + '...' : opp}</option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Company</label>
                  <select
                    value={pipelineFilters.company}
                    onChange={(e) => setPipelineFilters({ ...pipelineFilters, company: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                {/* Value Range Filter */}
                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Value ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={pipelineFilters.valueMin}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, valueMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={pipelineFilters.valueMax}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, valueMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Stage Filter */}
                <div className="w-[95px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Stage</label>
                  <select
                    value={pipelineFilters.stage}
                    onChange={(e) => setPipelineFilters({ ...pipelineFilters, stage: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Won</option>
                    <option value="closed_lost">Lost</option>
                  </select>
                </div>

                {/* Probability Range Filter */}
                <div className="w-[100px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Prob. (%)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={pipelineFilters.probabilityMin}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, probabilityMin: e.target.value })}
                      placeholder="Min"
                      min="0"
                      max="100"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={pipelineFilters.probabilityMax}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, probabilityMax: e.target.value })}
                      placeholder="Max"
                      min="0"
                      max="100"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Creation Date Range Filter */}
                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Creation Date</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={pipelineFilters.closeDateFrom}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, closeDateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={pipelineFilters.closeDateTo}
                      onChange={(e) => setPipelineFilters({ ...pipelineFilters, closeDateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(pipelineFilters.opportunity !== 'all' || pipelineFilters.company !== 'all' || 
                  pipelineFilters.valueMin || pipelineFilters.valueMax || pipelineFilters.stage !== 'all' ||
                  pipelineFilters.probabilityMin || pipelineFilters.probabilityMax ||
                  pipelineFilters.closeDateFrom || pipelineFilters.closeDateTo) && (
                  <button
                    onClick={() => setPipelineFilters({
                      opportunity: 'all',
                      company: 'all',
                      valueMin: '',
                      valueMax: '',
                      stage: 'all',
                      probabilityMin: '',
                      probabilityMax: '',
                      closeDateFrom: '',
                      closeDateTo: ''
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
              {filteredOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-handshake text-muted-foreground text-5xl mb-4"></i>
                  <p className="text-muted-foreground">{opportunities.length === 0 ? 'No opportunities yet' : 'No opportunities match your filters'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Opportunity</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Value</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Stage</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Probability</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Close Date</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpportunities.map((opp) => (
                        <tr key={opp.id} className="border-b border-gray-300 hover:bg-muted">
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{opp.title}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{opp.company}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground font-semibold border-r border-gray-300">${opp.value.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className={getStatusColor(opp.stage)}>{opp.stage.replace('_', ' ').toUpperCase()}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${getStageColor(opp.stage)} h-2 rounded-full`}
                                  style={{ width: `${opp.probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-foreground">{opp.probability}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{new Date(opp.close_date).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-edit mr-1 text-xs"></i>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-file-alt mr-1 text-xs"></i>
                                Proposal
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

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <Card className="bg-card rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">Lead Management ({filteredLeads.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{leads.length} total</span>
                  <Button onClick={() => setShowAddLeadModal(true)} size="sm">
                    <i className="fas fa-plus mr-1"></i>
                    Add Lead
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Filter Bar */}
            <FilterBar
              filters={leadsFilters}
              setFilters={setLeadsFilters}
              columns={[
                { value: 'company_name', label: 'Company' },
                { value: 'contact_person', label: 'Contact Person' },
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' }
              ]}
              statusOptions={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'proposal', label: 'Proposal' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' }
              ]}
              showSource={true}
              sourceOptions={[
                { value: 'website', label: 'Website' },
                { value: 'referral', label: 'Referral' },
                { value: 'cold_call', label: 'Cold Call' },
                { value: 'trade_show', label: 'Trade Show' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'other', label: 'Other' }
              ]}
              placeholder="Search leads..."
            />
            
            <CardContent className="p-0">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-plus text-muted-foreground text-5xl mb-4"></i>
                  <p className="text-muted-foreground">{leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}</p>
                  {leads.length === 0 && (
                    <Button onClick={() => setShowAddLeadModal(true)} className="mt-4">
                      Add Your First Lead
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Contact Person</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Email</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Phone</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Source</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Status</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-gray-300 hover:bg-muted">
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{lead.company_name}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{lead.contact_person}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-envelope text-muted-foreground text-xs"></i>
                              {lead.email}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-phone text-muted-foreground text-xs"></i>
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300 capitalize">{lead.source.replace('_', ' ')}</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-phone mr-1 text-xs"></i>
                                Contact
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-arrow-right mr-1 text-xs"></i>
                                Convert
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

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-6">
          <Card className="bg-card rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">Customer Database ({filteredCustomers.length})</CardTitle>
                <span className="text-xs text-muted-foreground">{customers.length} total</span>
              </div>
            </CardHeader>
            
            {/* Custom Customers Filter Bar - Single Line */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                {/* Company Filter */}
                <div className="min-w-[130px] max-w-[150px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Company</label>
                  <select
                    value={customersFilters.company}
                    onChange={(e) => setCustomersFilters({ ...customersFilters, company: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueCustomerCompanies.map(company => (
                      <option key={company} value={company}>{company.length > 20 ? company.substring(0, 20) + '...' : company}</option>
                    ))}
                  </select>
                </div>

                {/* Contact Person Filter */}
                <div className="min-w-[130px] max-w-[150px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact</label>
                  <select
                    value={customersFilters.contactPerson}
                    onChange={(e) => setCustomersFilters({ ...customersFilters, contactPerson: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueCustomerContacts.map(contact => (
                      <option key={contact} value={contact}>{contact}</option>
                    ))}
                  </select>
                </div>

                {/* Revenue Range Filter */}
                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Revenue ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={customersFilters.revenueMin}
                      onChange={(e) => setCustomersFilters({ ...customersFilters, revenueMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={customersFilters.revenueMax}
                      onChange={(e) => setCustomersFilters({ ...customersFilters, revenueMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={customersFilters.status}
                    onChange={(e) => setCustomersFilters({ ...customersFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Creation Date Range Filter */}
                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Creation Date</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={customersFilters.dateFrom}
                      onChange={(e) => setCustomersFilters({ ...customersFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={customersFilters.dateTo}
                      onChange={(e) => setCustomersFilters({ ...customersFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(customersFilters.company !== 'all' || customersFilters.contactPerson !== 'all' || 
                  customersFilters.revenueMin || customersFilters.revenueMax || customersFilters.status !== 'all' ||
                  customersFilters.dateFrom || customersFilters.dateTo) && (
                  <button
                    onClick={() => setCustomersFilters({
                      company: 'all',
                      contactPerson: 'all',
                      email: 'all',
                      phone: 'all',
                      revenueMin: '',
                      revenueMax: '',
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
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-building text-muted-foreground text-5xl mb-4"></i>
                  <p className="text-muted-foreground">{customers.length === 0 ? 'No customers yet' : 'No customers match your filters'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Contact Person</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Email</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Phone</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Total Revenue</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Loads</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-foreground border-r border-gray-300">Status</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-gray-300 hover:bg-muted">
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{customer.company_name}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{customer.contact_person}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-envelope text-muted-foreground text-xs"></i>
                              {customer.email}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-phone text-muted-foreground text-xs"></i>
                              {customer.phone}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-foreground font-semibold border-r border-gray-300">${customer.total_revenue.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground border-r border-gray-300">{customer.loads_count} completed</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className="bg-muted0 text-white">ACTIVE</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-eye mr-1 text-xs"></i>
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-file-invoice mr-1 text-xs"></i>
                                Quote
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-history mr-1 text-xs"></i>
                                History
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

        {/* Freight Calculator Tab */}
        <TabsContent value="calculator" className="mt-6">
          {/* Multi-Quote Tabs Bar */}
          <div className="mb-4 flex items-center gap-2 bg-card rounded-lg border border-border p-2 overflow-x-auto">
            <div className="flex gap-1 flex-1 overflow-x-auto">
              {quoteTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all
                    ${tab.id === activeTabId 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-muted text-foreground hover:bg-muted'
                    }
                  `}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <i className="fas fa-file-invoice text-xs flex-shrink-0"></i>
                  <input
                    type="text"
                    value={tab.name}
                    onChange={(e) => {
                      e.stopPropagation();
                      setQuoteTabs(tabs => tabs.map(t => 
                        t.id === tab.id ? { ...t, name: e.target.value } : t
                      ));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      text-sm font-medium bg-transparent border-none outline-none w-20
                      ${tab.id === activeTabId ? 'text-white placeholder-white/70' : 'text-foreground'}
                    `}
                    placeholder="Quote"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quoteTabs.length === 1) {
                        toast.error('Cannot close the last quote tab');
                        return;
                      }
                      const newTabs = quoteTabs.filter(t => t.id !== tab.id);
                      setQuoteTabs(newTabs);
                      if (tab.id === activeTabId && newTabs.length > 0) {
                        setActiveTabId(newTabs[0].id);
                      }
                      toast.success(`${tab.name} closed - all data cleared`);
                    }}
                    className={`
                      flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-card/20 transition-colors
                      ${tab.id === activeTabId ? 'text-white hover:bg-card/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                    `}
                    title="Close quote"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add New Quote Tab Button */}
            <button
              onClick={() => {
                const newTab = {
                  id: nextTabId,
                  name: `Quote ${nextTabId}`,
                  data: {
                    pickupLocation: '',
                    destination: '',
                    stops: [],
                    distance: 0,
                    ratePerMile: 0,
                    ratePerLbs: 0,
                    fuelSurcharge: 0,
                    ratePerStop: 0,
                    accessorialCharges: 0,
                    accessoryName: '',
                    margin: 0,
                    ftlLtlPercentage: 100,
                    consignor: '',
                    consignee: '',
                    customer: ''
                  },
                  routeData: null,
                  currentStop: ''
                };
                setQuoteTabs([...quoteTabs, newTab]);
                setActiveTabId(newTab.id);
                setNextTabId(nextTabId + 1);
                toast.success('New quote created');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors flex-shrink-0"
            >
              <i className="fas fa-plus text-xs"></i>
              <span className="text-sm font-medium">New Quote</span>
            </button>
          </div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-2">
                {/* Left Column - Quote Calculator + Total Quote */}
                <div className="space-y-4 w-full lg:w-[280px] flex-shrink-0">
                  {/* Quote Calculator */}
                  <div className="bg-card rounded-2xl shadow-sm border border-border h-[480px] flex flex-col">
                    <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="fas fa-dollar-sign text-muted-foreground"></i>
                        Quote Calculator
                      </h4>
                    </div>
                    <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Rate per Mile</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerMile || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerMile: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Fuel Surcharge</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.fuelSurcharge || ''}
                            onChange={(e) => setQuoteData({...quoteData, fuelSurcharge: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Rate per Stop</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerStop || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerStop: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Rate per Lbs</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerLbs || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerLbs: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">FTL/LTL (%)</Label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                          <Input 
                            type="number" 
                            placeholder="0"
                            min="0"
                            max="100"
                            step="1"
                            value={quoteData.ftlLtlPercentage || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const clampedValue = Math.min(Math.max(value, 0), 100);
                              setQuoteData({...quoteData, ftlLtlPercentage: clampedValue});
                            }}
                            className="pr-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">0% = LTL</span> (Less Than Truck Load) | <span className="font-medium">100% = FTL</span> (Full Truck Load)
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Accessorial Charges</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              step="0.01"
                              value={quoteData.accessorialCharges || ''}
                              onChange={(e) => setQuoteData({...quoteData, accessorialCharges: parseFloat(e.target.value) || 0})}
                              className="pl-7 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                          <div className="relative flex-1">
                            <Input 
                              type="text" 
                              placeholder="Name"
                              value={quoteData.accessoryName || ''}
                              onChange={(e) => setQuoteData({...quoteData, accessoryName: e.target.value})}
                              className="h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Margin (%)</Label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                          <Input 
                            type="number" 
                            placeholder="0"
                            step="1"
                            value={quoteData.margin || ''}
                            onChange={(e) => setQuoteData({...quoteData, margin: parseFloat(e.target.value) || 0})}
                            className="pr-8 h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>

                      {/* Required Fields for Email Generation */}
                      <div className="pt-3 border-t border-border space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Consignor <span className="text-foreground">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter consignor name"
                            value={quoteData.consignor || ''}
                            onChange={(e) => setQuoteData({...quoteData, consignor: e.target.value})}
                            className="h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Consignee <span className="text-foreground">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter consignee name"
                            value={quoteData.consignee || ''}
                            onChange={(e) => setQuoteData({...quoteData, consignee: e.target.value})}
                            className="h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Customer <span className="text-foreground">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter customer name"
                            value={quoteData.customer || ''}
                            onChange={(e) => setQuoteData({...quoteData, customer: e.target.value})}
                            className="h-8 text-sm border-border rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>

                      {/* Route Distance Display */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-route text-primary"></i>
                            <Label className="text-xs font-medium text-foreground">Route Distance</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-foreground">
                              {routeData ? routeData.distanceValue.toFixed(2) : quoteData.distance || '0.00'}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">miles</span>
                          </div>
                        </div>
                        {routeData && (
                          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                            <i className="fas fa-clock text-xs"></i>
                            <span>Est. {routeData.durationValue.toFixed(1)} hours</span>
                          </div>
                        )}
                        {!routeData && !quoteData.distance && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            Enter pickup & destination to calculate
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total Rate Card - Below Quote Calculator */}
                  <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl shadow-md border border-primary p-5 h-auto flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white/90">Total Quote</h4>
                      <i className="fas fa-file-invoice-dollar text-white/60 text-lg"></i>
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-3">
                      <div className="text-4xl font-bold text-white mb-1">${calculateTotalQuote()}</div>
                      {/* FTL/LTL Breakdown */}
                      <div className="bg-card/20 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-white/90">
                          <span>Base Rate ({quoteData.distance || 0} mi × ${quoteData.ratePerMile || 0}/mi)</span>
                          <span>${((quoteData.distance || 0) * (quoteData.ratePerMile || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                          <span>+ Fuel Surcharge</span>
                          <span>${(quoteData.fuelSurcharge || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                          <span>+ Stops ({quoteData.stops?.length || 0} × ${quoteData.ratePerStop || 0})</span>
                          <span>${((quoteData.stops?.length || 0) * (quoteData.ratePerStop || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                          <span>+ Accessorials</span>
                          <span>${(quoteData.accessorialCharges || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/30 pt-1 flex justify-between text-xs font-semibold text-white">
                          <span>Subtotal</span>
                          <span>${(((quoteData.distance || 0) * (quoteData.ratePerMile || 0)) + (quoteData.fuelSurcharge || 0) + ((quoteData.stops?.length || 0) * (quoteData.ratePerStop || 0)) + (quoteData.accessorialCharges || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                          <span>× {quoteData.ftlLtlPercentage || 100}% {(quoteData.ftlLtlPercentage || 100) === 100 ? '(FTL)' : '(LTL)'}</span>
                          <span>${((((quoteData.distance || 0) * (quoteData.ratePerMile || 0)) + (quoteData.fuelSurcharge || 0) + ((quoteData.stops?.length || 0) * (quoteData.ratePerStop || 0)) + (quoteData.accessorialCharges || 0)) * ((quoteData.ftlLtlPercentage || 100) / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                          <span>+ Margin ({quoteData.margin || 0}%)</span>
                          <span>${(((((quoteData.distance || 0) * (quoteData.ratePerMile || 0)) + (quoteData.fuelSurcharge || 0) + ((quoteData.stops?.length || 0) * (quoteData.ratePerStop || 0)) + (quoteData.accessorialCharges || 0)) * ((quoteData.ftlLtlPercentage || 100) / 100)) * ((quoteData.margin || 0) / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={pushToRateQuotes}
                      className="w-full bg-card hover:bg-muted text-primary font-semibold rounded-lg shadow-sm h-11"
                    >
                      <i className="fas fa-arrow-right mr-2"></i>
                      Push to Rate Quotes
                    </Button>
                  </div>
                </div>

                {/* Right Column - Map + Unit Converter + Route Calculator */}
                <div className="space-y-4 flex-1">
                  {/* Map Display with OpenStreetMap Integration */}
                  <OSMMapPreview
                    pickup={quoteData.pickupLocation}
                    destination={quoteData.destination}
                    stops={quoteData.stops}
                    calculateTrigger={calculateTrigger}
                    onRouteCalculated={(data) => {
                      setRouteData(data);
                      setQuoteData({...quoteData, distance: data.distanceValue});
                    }}
                  />

                  {/* Bottom Row - Unit Converter and Route Calculator */}
                  <div className="flex gap-4 items-start">
                    {/* Unit Converter - 364px width */}
                    <div className="flex-[0.9]">
                      <UnifiedConverter />
                    </div>

                    {/* Route Calculator - 404px width */}
                    <div className="border border-border rounded-xl bg-card shadow-sm h-[280px] flex-1 flex flex-col overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <i className="fas fa-route text-foreground"></i>
                          Route Calculator
                        </h4>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-evenly">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                            <i className="fas fa-map-marker-alt text-foreground"></i>
                          </div>
                          <OSMAutocomplete
                            placeholder="Pickup location"
                            value={quoteData.pickupLocation}
                            onChange={(value) => setQuoteData({...quoteData, pickupLocation: value})}
                            className="pl-10 h-9 border-border focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        
                        {/* Add Stop Section */}
                        <div className="space-y-2">
                          <div className="relative flex gap-2">
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                                <i className="fas fa-map-pin text-muted-foreground"></i>
                              </div>
                              <OSMAutocomplete
                                placeholder="Add stop (optional)"
                                value={currentStop}
                                onChange={(value) => setCurrentStop(value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && currentStop.trim()) {
                                    e.preventDefault();
                                    setQuoteData({
                                      ...quoteData, 
                                      stops: [...quoteData.stops, currentStop]
                                    });
                                    setCurrentStop('');
                                    toast.success('Stop added to route');
                                  }
                                }}
                                className="pl-10 h-9 border-border focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
                              />
                            </div>
                            <Button
                              onClick={() => {
                                if (currentStop.trim()) {
                                  setQuoteData({
                                    ...quoteData, 
                                    stops: [...quoteData.stops, currentStop]
                                  });
                                  setCurrentStop('');
                                  toast.success('Stop added to route');
                                }
                              }}
                              size="sm"
                              className="h-9 w-9 p-0 bg-primary hover:bg-primary/90 rounded-md flex items-center justify-center"
                            >
                              <span className="text-lg font-bold text-black">+</span>
                            </Button>
                          </div>
                          
                          {/* List of Added Stops */}
                          {quoteData.stops.length > 0 && (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                              {quoteData.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs border border-blue-100 hover:border-border transition-all">
                                  <i className="fas fa-map-pin text-foreground text-xs"></i>
                                  <span className="flex-1 truncate text-foreground font-medium">Stop {index + 1}: {stop}</span>
                                  <button
                                    onClick={() => {
                                      const newStops = quoteData.stops.filter((_, i) => i !== index);
                                      setQuoteData({...quoteData, stops: newStops});
                                      toast.success(`Stop ${index + 1} removed from route`);
                                    }}
                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-red-300 transition-all shadow-sm hover:shadow"
                                    title="Remove this stop"
                                  >
                                    <i className="fas fa-times text-xs"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                            <i className="fas fa-map-marker-alt text-foreground"></i>
                          </div>
                          <OSMAutocomplete
                            placeholder="Destination"
                            value={quoteData.destination}
                            onChange={(value) => setQuoteData({...quoteData, destination: value})}
                            className="pl-10 h-9 border-border focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </div>

                        <Button 
                          onClick={() => {
                            if (!quoteData.pickupLocation || !quoteData.destination) {
                              toast.error('Please enter both pickup and destination locations');
                              return;
                            }
                            // Trigger route calculation
                            setCalculateTrigger(prev => prev + 1);
                            toast.info('Calculating route...');
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm h-10"
                        >
                          <i className="fas fa-calculator mr-2"></i>
                          Calculate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Quotes Tab */}
        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Rate Quotes ({filteredQuotes.length})</CardTitle>
                  <span className="text-xs text-muted-foreground">{quotes.length} total</span>
                </div>
                <Button onClick={() => setActiveTab('calculator')}>
                  <i className="fas fa-plus mr-2"></i>
                  Create New Quote
                </Button>
              </div>
            </CardHeader>
            
            {/* Custom Quotes Filter Bar - Single Line */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                {/* Quote Number Filter */}
                <div className="min-w-[90px] max-w-[100px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Quote #</label>
                  <select
                    value={quotesFilters.quoteNumber}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, quoteNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueQuoteNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                {/* Pickup Location Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Pickup</label>
                  <select
                    value={quotesFilters.pickupLocation}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, pickupLocation: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniquePickupLocations.map(loc => (
                      <option key={loc} value={loc}>{loc.length > 12 ? loc.substring(0, 12) + '...' : loc}</option>
                    ))}
                  </select>
                </div>

                {/* Destination Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Destination</label>
                  <select
                    value={quotesFilters.destination}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, destination: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueDestinations.map(dest => (
                      <option key={dest} value={dest}>{dest.length > 12 ? dest.substring(0, 12) + '...' : dest}</option>
                    ))}
                  </select>
                </div>

                {/* Consignor Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Consignor</label>
                  <select
                    value={quotesFilters.consignor}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, consignor: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueConsignors.map(c => (
                      <option key={c} value={c}>{c.length > 12 ? c.substring(0, 12) + '...' : c}</option>
                    ))}
                  </select>
                </div>

                {/* Consignee Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Consignee</label>
                  <select
                    value={quotesFilters.consignee}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, consignee: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueConsignees.map(c => (
                      <option key={c} value={c}>{c.length > 12 ? c.substring(0, 12) + '...' : c}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Filter */}
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Customer</label>
                  <select
                    value={quotesFilters.customer}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, customer: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueQuoteCustomers.map(c => (
                      <option key={c} value={c}>{c.length > 12 ? c.substring(0, 12) + '...' : c}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Range Filter */}
                <div className="w-[110px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={quotesFilters.amountMin}
                      onChange={(e) => setQuotesFilters({ ...quotesFilters, amountMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={quotesFilters.amountMax}
                      onChange={(e) => setQuotesFilters({ ...quotesFilters, amountMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-[80px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={quotesFilters.status}
                    onChange={(e) => setQuotesFilters({ ...quotesFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="complete">Complete</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Creation Date Range Filter */}
                <div className="w-[160px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Creation Date</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={quotesFilters.dateFrom}
                      onChange={(e) => setQuotesFilters({ ...quotesFilters, dateFrom: e.target.value })}
                      className="w-[70px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={quotesFilters.dateTo}
                      onChange={(e) => setQuotesFilters({ ...quotesFilters, dateTo: e.target.value })}
                      className="w-[70px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(quotesFilters.quoteNumber !== 'all' || quotesFilters.pickupLocation !== 'all' || 
                  quotesFilters.destination !== 'all' || quotesFilters.consignor !== 'all' ||
                  quotesFilters.consignee !== 'all' || quotesFilters.customer !== 'all' ||
                  quotesFilters.amountMin || quotesFilters.amountMax || 
                  quotesFilters.status !== 'all' || quotesFilters.dateFrom || quotesFilters.dateTo) && (
                  <button
                    onClick={() => setQuotesFilters({
                      quoteNumber: 'all',
                      pickupLocation: 'all',
                      destination: 'all',
                      consignor: 'all',
                      consignee: 'all',
                      customer: 'all',
                      amountMin: '',
                      amountMax: '',
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
            
            <CardContent>
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice-dollar text-muted-foreground text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">{quotes.length === 0 ? 'No Quotes Yet' : 'No Quotes Match Your Filters'}</h3>
                  <p className="text-muted-foreground mb-4">{quotes.length === 0 ? 'Create professional rate quotes using the Freight Calculator' : 'Try adjusting your filters'}</p>
                  {quotes.length === 0 && (
                    <Button onClick={() => setActiveTab('calculator')} className="bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-calculator mr-2"></i>
                      Go to Freight Calculator
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <i className="fas fa-file-invoice text-foreground text-xl"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-foreground text-lg">
                                {quote.quoteNumber}
                              </h4>
                              <Badge className="bg-muted text-foreground text-xs">Rate Quote</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(quote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">${quote.totalAmount}</div>
                          <Badge className={quote.status === 'incomplete' ? 'bg-muted text-foreground' : 'bg-muted text-foreground'}>
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Consignor, Consignee, Customer Section */}
                      <div className="grid grid-cols-3 gap-3 text-sm mb-3 p-3 bg-muted rounded-lg">
                        <div>
                          <span className="text-muted-foreground block text-xs">Consignor</span>
                          <span className="font-semibold text-foreground">
                            {quote.consignor || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Consignee</span>
                          <span className="font-semibold text-foreground">
                            {quote.consignee || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Customer</span>
                          <span className="font-semibold text-foreground">
                            {quote.customer || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Rate/Mile:</span>
                          <span className="font-semibold ml-1">${quote.ratePerMile}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fuel Surcharge:</span>
                          <span className="font-semibold ml-1">${quote.fuelSurcharge}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate/Stop:</span>
                          <span className="font-semibold ml-1">${quote.ratePerStop}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin:</span>
                          <span className="font-semibold ml-1">{quote.margin}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm">
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateEmail(quote)}
                          disabled={!isQuoteComplete(quote)}
                          className={!isQuoteComplete(quote) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}
                        >
                          <i className="fas fa-envelope mr-1"></i>
                          Generate Email
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => createLoadFromQuote(quote)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <i className="fas fa-truck-loading mr-1"></i>
                          Create Load
                        </Button>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-check mr-1"></i>
                          Mark Complete
                        </Button>
                      </div>
                      {!isQuoteComplete(quote) && (
                        <p className="text-xs text-foreground mt-2">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Please add Consignor, Consignee, and Customer to generate email
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loads Tab */}
        <TabsContent value="loads" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>
                    <i className="fas fa-truck-loading mr-2 text-foreground"></i>
                    Loads ({filteredLoads.length})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{loads.length} total</span>
                </div>
                <Button onClick={() => setActiveTab('quotes')} variant="outline">
                  <i className="fas fa-file-invoice-dollar mr-2"></i>
                  View Rate Quotes
                </Button>
              </div>
            </CardHeader>
            
            {/* Custom Loads Filter Bar - Single Line */}
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
                  <h3 className="text-xl font-semibold mb-2">{loads.length === 0 ? 'No Loads Yet' : 'No Loads Match Your Filters'}</h3>
                  <p className="text-muted-foreground mb-4">{loads.length === 0 ? 'Create loads from your rate quotes to manage shipments' : 'Try adjusting your filters'}</p>
                  {loads.length === 0 && (
                    <Button onClick={() => setActiveTab('quotes')} className="bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-file-invoice-dollar mr-2"></i>
                      Go to Rate Quotes
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Load #</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Creation Date</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Creation Time</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Status</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Driver</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Carrier</th>
                        <th className="px-3 py-3 text-left font-semibold text-foreground whitespace-nowrap text-xs">Customer Rate</th>
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
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatCreationDate(load.created_at)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatCreationTime(load.created_at)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Select value={load.status || 'pending'} onValueChange={(value) => handleLoadStatusChange(load.id, value)}>
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
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                            {load.assigned_driver || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {load.assigned_carrier || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-semibold text-foreground text-xs">
                            ${load.customer_rate?.toFixed(2) || load.confirmed_rate?.toFixed(2) || load.total_cost?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="max-w-[120px] truncate text-xs" title={load.pickup_location}>
                              {load.pickup_location || `${load.pickup_city || ''}, ${load.pickup_state || ''}`}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.pickup_time_planned)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.pickup_time_actual_in)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.pickup_time_actual_out)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="max-w-[120px] truncate text-xs" title={load.delivery_location}>
                              {load.delivery_location || `${load.delivery_city || ''}, ${load.delivery_state || ''}`}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.delivery_time_planned)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.delivery_time_actual_in)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                            {formatShortDateTime(load.delivery_time_actual_out)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {load.source_quote_number ? (
                              <Badge variant="outline" className="text-xs">
                                {load.source_quote_number}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Button variant="outline" size="sm" className="h-7 px-2" title="View Only">
                              <i className="fas fa-eye text-muted-foreground"></i>
                            </Button>
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
      </div>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  placeholder="ABC Logistics Inc"
                />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input
                  value={newLead.contact_person}
                  onChange={(e) => setNewLead({ ...newLead, contact_person: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="555-0100"
                />
              </div>
              <div>
                <Label>Source</Label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="email">Email Campaign</option>
                  <option value="social_media">Social Media</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddLead} className="flex-1">
                  Add Lead
                </Button>
                <Button onClick={() => setShowAddLeadModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generated Email Modal */}
      {showEmailModal && generatedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground">
                  <i className="fas fa-envelope mr-2 text-foreground"></i>
                  Generated Email - {generatedEmail.quote.quoteNumber}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailModal(false)}
                  className="hover:bg-muted"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-info-circle text-foreground"></i>
                    <span className="font-semibold text-foreground">AI-Generated Professional Email</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Review the generated email below. You can copy it to your clipboard and paste it into your email client.
                  </p>
                </div>

                <div className="bg-muted border border-gray-300 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
{generatedEmail.content}
                  </pre>
                </div>
              </div>
            </CardContent>
            <div className="border-t border-border p-4 flex gap-2 flex-shrink-0">
              <Button
                onClick={copyEmailToClipboard}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setShowEmailModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesDepartment;
