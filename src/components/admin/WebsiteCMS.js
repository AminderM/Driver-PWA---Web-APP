import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe, Mail, Users, Eye, CheckCircle, Clock, XCircle, MessageSquare, Building, Phone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const WebsiteCMS = ({ fetchWithAuth, BACKEND_URL }) => {
  const [activeTab, setActiveTab] = useState('leads');
  const [demoRequests, setDemoRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        fetchWithAuth(`${BACKEND_URL}/api/marketing/admin/demo-requests`),
        fetchWithAuth(`${BACKEND_URL}/api/marketing/admin/stats`)
      ]);

      if (requestsRes.ok) {
        setDemoRequests(await requestsRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, notes = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (notes !== null) params.append('notes', notes);

      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/marketing/admin/demo-requests/${requestId}?${params.toString()}`,
        { method: 'PUT' }
      );

      if (res.ok) {
        toast.success('Request updated');
        loadData();
      } else {
        toast.error('Failed to update request');
      }
    } catch (e) {
      toast.error('Failed to update request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'contacted': return <MessageSquare className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRequests = statusFilter === 'all' 
    ? demoRequests 
    : demoRequests.filter(r => r.status === statusFilter);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Website CMS</h2>
          <p className="text-muted-foreground mt-2">Manage marketing website content and demo requests</p>
        </div>
        <a
          href="https://scms-project.preview.emergentagent.com:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Live Site
        </a>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.total_requests}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Requests</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.new_requests}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacted</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.contacted}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Converted</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.converted}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'leads'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Demo Requests
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Website Content
        </button>
      </div>

      {/* Demo Requests Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Label>Filter by status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No demo requests yet</p>
                <p className="text-sm mt-2">Requests from the marketing website will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {request.first_name[0]}{request.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.first_name} {request.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building className="w-3 h-3" />
                            {request.company}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </span>
                        {expandedId === request.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedId === request.id && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                              {request.email}
                            </a>
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a href={`tel:${request.phone}`} className="text-foreground hover:underline">
                                {request.phone}
                              </a>
                            </div>
                          )}
                          {request.role && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Role:</span>{' '}
                              <span className="text-foreground">{request.role}</span>
                            </div>
                          )}
                          {request.fleet_size && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Fleet Size:</span>{' '}
                              <span className="text-foreground">{request.fleet_size}</span>
                            </div>
                          )}
                        </div>

                        {request.message && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Message:</p>
                            <p className="text-sm text-foreground">{request.message}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Label className="text-sm">Update Status:</Label>
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Website Content Tab */}
      {activeTab === 'content' && (
        <Card>
          <CardHeader>
            <CardTitle>Website Content Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-2">Content Editor Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The full content management system will allow you to edit hero text, features, pricing, and more directly from this dashboard.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                For now, the marketing website displays default content. Contact development to make content changes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Hero Section</h4>
                <p className="text-sm text-muted-foreground">Main headline, subtext, and CTA buttons</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Features</h4>
                <p className="text-sm text-muted-foreground">Product features and benefits</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Pricing</h4>
                <p className="text-sm text-muted-foreground">Pricing plans and features list</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Contact Info</h4>
                <p className="text-sm text-muted-foreground">Email, phone, and address</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebsiteCMS;
