import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Truck, Shield, AlertTriangle, CheckCircle, XCircle, Building2, Users, FileText, Phone, MapPin, Mail } from 'lucide-react';

const CarrierLookup = ({ BACKEND_URL, fetchWithAuth }) => {
  // Separate search fields
  const [dotNumber, setDotNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [carrierDetails, setCarrierDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleSearch = async () => {
    // Determine which field to search with (priority: DOT > Company Name)
    let searchQuery = '';
    let searchType = 'name';
    
    if (dotNumber.trim()) {
      searchQuery = dotNumber.trim().replace(/^DOT[-#]?/i, '');
      searchType = 'dot';
    } else if (companyName.trim()) {
      searchQuery = companyName.trim();
      searchType = 'name';
    } else {
      toast.error('Please enter a DOT# or Company Name to search');
      return;
    }

    setLoading(true);
    setSearchResults(null);
    setSelectedCarrier(null);
    setCarrierDetails(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        search_type: searchType
      });

      const response = await fetchWithAuth(`${BACKEND_URL}/api/fmcsa/carrier/lookup?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle single carrier result
        if (data.carrier) {
          setSearchResults({ carriers: [data.carrier], total: 1 });
          // Auto-select and load full details for single result
          await loadCarrierDetails(data.carrier.dot_number);
        } 
        // Handle multiple results
        else if (data.carriers) {
          setSearchResults(data);
          if (data.carriers.length === 1) {
            await loadCarrierDetails(data.carriers[0].dot_number);
          }
        }
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.info('No carriers found matching your search');
          setSearchResults({ carriers: [], total: 0 });
        } else {
          toast.error(error.detail || 'Search failed');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search carriers');
    } finally {
      setLoading(false);
    }
  };

  const loadCarrierDetails = async (dotNumber) => {
    setLoadingDetails(true);
    setSelectedCarrier(dotNumber);

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/fmcsa/carrier/dot/${dotNumber}?full_details=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCarrierDetails(data.carrier);
      } else {
        toast.error('Failed to load carrier details');
      }
    } catch (error) {
      console.error('Load details error:', error);
      toast.error('Failed to load carrier details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (allowToOperate, outOfService) => {
    if (outOfService) {
      return <Badge className="bg-muted text-red-800"><XCircle className="w-3 h-3 mr-1" />Out of Service</Badge>;
    }
    if (allowToOperate === 'Y') {
      return <Badge className="bg-muted text-foreground"><CheckCircle className="w-3 h-3 mr-1" />Authorized</Badge>;
    }
    return <Badge className="bg-muted text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Not Authorized</Badge>;
  };

  const getBasicScoreColor = (score) => {
    if (!score || score === 'Inconclusive') return 'bg-muted text-muted-foreground';
    const numScore = parseFloat(score);
    if (numScore >= 75) return 'bg-muted text-red-800';
    if (numScore >= 50) return 'bg-muted text-yellow-800';
    return 'bg-muted text-foreground';
  };

  const formatBasicScore = (score) => {
    if (!score) return 'N/A';
    if (score === 'Inconclusive') return 'Inconclusive';
    return `${score}%`;
  };

  const clearSearch = () => {
    setDotNumber('');
    setCompanyName('');
    setSearchResults(null);
    setSelectedCarrier(null);
    setCarrierDetails(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
          <Truck className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">FMCSA Carrier Lookup</h1>
          <p className="text-muted-foreground">Search carrier data by DOT# or company name</p>
        </div>
      </div>

      {/* Search Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DOT# Field */}
            <div>
              <Label className="text-sm font-medium mb-2 block">DOT#</Label>
              <Input
                placeholder="e.g., 2233541"
                value={dotNumber}
                onChange={(e) => setDotNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            {/* Company Name Field */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Company Name</Label>
              <Input
                placeholder="e.g., Swift Transportation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            {/* Search Button */}
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 h-10 px-6 flex-1"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results List */}
        {searchResults && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Results ({searchResults.total})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                {searchResults.carriers.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No carriers found
                  </div>
                ) : (
                  searchResults.carriers.map((carrier, idx) => (
                    <div
                      key={carrier.dot_number || idx}
                      onClick={() => loadCarrierDetails(carrier.dot_number)}
                      className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${
                        selectedCarrier === carrier.dot_number ? 'bg-muted border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">{carrier.legal_name}</h4>
                        {getStatusBadge(carrier.allow_to_operate, carrier.out_of_service)}
                      </div>
                      {carrier.dba_name && (
                        <p className="text-sm text-muted-foreground mb-1">DBA: {carrier.dba_name}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-1">
                        <span className="font-medium">DOT# {carrier.dot_number}</span>
                        {carrier.mc_number && <span>MC# {carrier.mc_number}</span>}
                      </div>
                      {/* Phone and Email */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {carrier.phone || 'N/A'}
                        </span>
                        {carrier.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {carrier.email}
                          </span>
                        )}
                      </div>
                      {carrier.physical_address && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{carrier.physical_address}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Carrier Details Panel */}
        {(carrierDetails || loadingDetails) && (
          <div className={searchResults ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Carrier Details
                  </CardTitle>
                  {carrierDetails && getStatusBadge(carrierDetails.allow_to_operate, carrierDetails.out_of_service)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : carrierDetails ? (
                  <div className="space-y-6">
                    {/* Company Info */}
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{carrierDetails.legal_name}</h3>
                      {carrierDetails.dba_name && (
                        <p className="text-muted-foreground">DBA: {carrierDetails.dba_name}</p>
                      )}
                      <div className="flex gap-4 mt-2">
                        <Badge variant="outline" className="text-foreground">DOT# {carrierDetails.dot_number}</Badge>
                        {carrierDetails.mc_number && (
                          <Badge variant="outline" className="text-foreground">MC# {carrierDetails.mc_number}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {carrierDetails.physical_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Physical Address</p>
                              <p className="text-foreground">{carrierDetails.physical_address}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            {carrierDetails.phone ? (
                              <p className="text-foreground">{carrierDetails.phone}</p>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                N/A - <a 
                                  href={`https://safer.fmcsa.dot.gov/query.asp?query_param=USDOT&query_string=${carrierDetails.dot_number}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Check SAFER for details
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        {carrierDetails.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Email</p>
                              <p className="text-foreground">{carrierDetails.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {carrierDetails.entity_type && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Operation Type</p>
                            <p className="text-foreground">{carrierDetails.entity_type}</p>
                          </div>
                        )}
                        {carrierDetails.total_power_units !== undefined && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Fleet Size</p>
                            <p className="text-foreground">{carrierDetails.total_power_units} Power Units</p>
                          </div>
                        )}
                        {carrierDetails.total_drivers !== undefined && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Drivers</p>
                            <p className="text-foreground">{carrierDetails.total_drivers} Drivers</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Authority Status */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Authority & Insurance
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Common Authority</p>
                          <Badge className={carrierDetails.common_authority === 'A' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}>
                            {carrierDetails.common_authority === 'A' ? 'Active' : carrierDetails.common_authority || 'N/A'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Contract Authority</p>
                          <Badge className={carrierDetails.contract_authority === 'A' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}>
                            {carrierDetails.contract_authority === 'A' ? 'Active' : carrierDetails.contract_authority || 'N/A'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Broker Authority</p>
                          <Badge className={carrierDetails.broker_authority === 'A' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}>
                            {carrierDetails.broker_authority === 'A' ? 'Active' : carrierDetails.broker_authority || 'N/A'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">BIPD Insurance</p>
                          <Badge className={carrierDetails.insurance_bipd === 'Y' ? 'bg-muted text-foreground' : 'bg-muted text-red-800'}>
                            {carrierDetails.insurance_bipd === 'Y' ? 'On File' : 'Not On File'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Cargo Insurance</p>
                          <Badge className={carrierDetails.insurance_cargo === 'Y' ? 'bg-muted text-foreground' : 'bg-muted text-red-800'}>
                            {carrierDetails.insurance_cargo === 'Y' ? 'On File' : 'Not On File'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Bond/Trust</p>
                          <Badge className={carrierDetails.insurance_bond === 'Y' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}>
                            {carrierDetails.insurance_bond === 'Y' ? 'On File' : 'Not On File'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* BASIC Scores */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Safety BASIC Scores
                        <span className="text-xs font-normal text-muted-foreground">(Higher = Worse)</span>
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Unsafe Driving', value: carrierDetails.unsafe_driving_basic },
                          { label: 'Hours of Service', value: carrierDetails.hours_of_service_basic },
                          { label: 'Driver Fitness', value: carrierDetails.driver_fitness_basic },
                          { label: 'Controlled Substances', value: carrierDetails.controlled_substances_basic },
                          { label: 'Vehicle Maintenance', value: carrierDetails.vehicle_maintenance_basic },
                          { label: 'Hazmat Compliance', value: carrierDetails.hazmat_basic },
                          { label: 'Crash Indicator', value: carrierDetails.crash_indicator_basic },
                        ].map((basic, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{basic.label}</p>
                            <Badge className={getBasicScoreColor(basic.value)}>
                              {formatBasicScore(basic.value)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Crash & Inspection Data */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Crash & Inspection History
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.fatal_crashes || 0}</p>
                          <p className="text-xs text-muted-foreground">Fatal Crashes</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.injury_crashes || 0}</p>
                          <p className="text-xs text-muted-foreground">Injury Crashes</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.tow_crashes || 0}</p>
                          <p className="text-xs text-muted-foreground">Tow-Away Crashes</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.total_crashes || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Crashes</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.vehicle_inspections || 0}</p>
                          <p className="text-xs text-muted-foreground">Vehicle Inspections</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.driver_inspections || 0}</p>
                          <p className="text-xs text-muted-foreground">Driver Inspections</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.vehicle_oos_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">Vehicle OOS Rate</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-foreground">{carrierDetails.driver_oos_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">Driver OOS Rate</p>
                        </div>
                      </div>
                    </div>

                    {/* Cargo Types */}
                    {carrierDetails.cargo_carried && carrierDetails.cargo_carried.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-foreground mb-3">Cargo Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {carrierDetails.cargo_carried.map((cargo, idx) => (
                            <Badge key={idx} variant="outline">{cargo}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!searchResults && !carrierDetails && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Search for a Carrier</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a DOT number or company name to lookup carrier information including safety scores, authority status, and crash history.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarrierLookup;
