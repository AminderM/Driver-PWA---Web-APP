import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Package, Users, Building2, DollarSign, TrendingUp, 
  Edit, Trash2, Check, X, Search, UserPlus, Zap, Copy
} from 'lucide-react';

const SubscriptionManager = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('bundles');
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);

  // Bundle form
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    products: [],
    monthly_price: '',
    is_active: true
  });

  // Assignment form
  const [assignForm, setAssignForm] = useState({
    bundle_id: '',
    entity_type: 'user',
    entity_id: '',
    notes: ''
  });

  // Entity search for assignment modal
  const [entitySearchQuery, setEntitySearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadBundles(),
      loadProducts(),
      loadAssignments(),
      loadStats(),
      loadUsers(),
      loadCompanies()
    ]);
    setLoading(false);
  };

  const loadBundles = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles`);
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (e) {
      console.error('Failed to load bundles:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load assignments:', e);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/stats/overview`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users?limit=500`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || data || []);
      }
    } catch (e) {
      console.error('Failed to load companies:', e);
    }
  };

  const handleCreateBundle = async () => {
    if (!bundleForm.name || !bundleForm.monthly_price || bundleForm.products.length === 0) {
      toast.error('Please fill in bundle name, price, and select at least one product');
      return;
    }

    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description,
        products: bundleForm.products.map(p => ({
          product_id: p.id,
          product_name: p.name,
          included_seats: p.included_seats || 5,
          included_storage_gb: 10
        })),
        monthly_price: parseFloat(bundleForm.monthly_price),
        is_active: bundleForm.is_active
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Bundle created successfully');
        setShowBundleModal(false);
        resetBundleForm();
        loadBundles();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create bundle');
      }
    } catch (e) {
      toast.error('Failed to create bundle');
    }
  };

  const handleUpdateBundle = async () => {
    if (!bundleForm.name || !bundleForm.monthly_price) {
      toast.error('Please fill in bundle name and price');
      return;
    }

    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description,
        products: bundleForm.products.map(p => ({
          product_id: p.id || p.product_id,
          product_name: p.name || p.product_name,
          included_seats: p.included_seats || 5,
          included_storage_gb: 10
        })),
        monthly_price: parseFloat(bundleForm.monthly_price),
        is_active: bundleForm.is_active
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/${editingBundle.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Bundle updated successfully');
        setShowBundleModal(false);
        setEditingBundle(null);
        resetBundleForm();
        loadBundles();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to update bundle');
      }
    } catch (e) {
      toast.error('Failed to update bundle');
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/${bundleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Bundle deleted');
        loadBundles();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to delete bundle');
      }
    } catch (e) {
      toast.error('Failed to delete bundle');
    }
  };

  const handleAssignBundle = async () => {
    if (!assignForm.bundle_id || !assignForm.entity_id) {
      toast.error('Please select a bundle and a user/company');
      return;
    }

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assign`, {
        method: 'POST',
        body: JSON.stringify(assignForm)
      });

      if (res.ok) {
        toast.success('Subscription assigned successfully');
        setShowAssignModal(false);
        setAssignForm({ bundle_id: '', entity_type: 'user', entity_id: '', notes: '' });
        loadAssignments();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to assign subscription');
      }
    } catch (e) {
      toast.error('Failed to assign subscription');
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assignments/${assignmentId}/cancel`, {
        method: 'PUT'
      });

      if (res.ok) {
        toast.success('Subscription cancelled');
        loadAssignments();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to cancel subscription');
      }
    } catch (e) {
      toast.error('Failed to cancel subscription');
    }
  };

  const openEditBundle = (bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      description: bundle.description || '',
      products: bundle.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        price: p.product_price || 0,
        included_seats: p.included_seats || 5
      })),
      monthly_price: bundle.monthly_price.toString(),
      is_active: bundle.is_active
    });
    setShowBundleModal(true);
  };

  const openAssignModal = (bundle = null) => {
    setSelectedBundle(bundle);
    setAssignForm({
      bundle_id: bundle?.id || '',
      entity_type: 'user',
      entity_id: '',
      notes: ''
    });
    setEntitySearchQuery('');
    setShowAssignModal(true);
  };

  const duplicateBundle = (bundle) => {
    // Pre-populate form with existing bundle data, but with a new name
    setBundleForm({
      name: `${bundle.name} (Copy)`,
      description: bundle.description || '',
      products: bundle.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        price: p.product_price || 0,
        included_seats: p.included_seats || 5
      })),
      monthly_price: bundle.monthly_price.toString(),
      is_active: true
    });
    setEditingBundle(null); // This is a new bundle, not editing existing
    setShowBundleModal(true);
    toast.info('Bundle duplicated. Modify as needed and save.');
  };

  const resetBundleForm = () => {
    setBundleForm({
      name: '',
      description: '',
      products: [],
      monthly_price: '',
      is_active: true
    });
    setEditingBundle(null);
  };

  const toggleProductInBundle = (product) => {
    const exists = bundleForm.products.find(p => p.id === product.id);
    if (exists) {
      setBundleForm(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== product.id)
      }));
    } else {
      setBundleForm(prev => ({
        ...prev,
        products: [...prev.products, { ...product, included_seats: product.default_seats || 5 }]
      }));
    }
  };

  const calculateOriginalPrice = () => {
    return bundleForm.products.reduce((sum, p) => sum + (p.price || 0), 0);
  };

  const calculateDiscount = () => {
    const original = calculateOriginalPrice();
    const monthly = parseFloat(bundleForm.monthly_price) || 0;
    if (original > 0 && monthly > 0) {
      return Math.round(((original - monthly) / original) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Manager</h1>
          <p className="text-muted-foreground">Create product bundles and assign subscriptions to users and companies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAssignModal()} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Subscription
          </Button>
          <Button onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bundles</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_bundles}</p>
                </div>
                <Package className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active_assignments}</p>
                </div>
                <Check className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">User Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.user_subscriptions}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Company Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.company_subscriptions}</p>
                </div>
                <Building2 className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Monthly Revenue (MRR)</p>
                  <p className="text-2xl font-bold">${stats.mrr?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bundles">
            <Package className="w-4 h-4 mr-2" />
            Product Bundles ({bundles.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Users className="w-4 h-4 mr-2" />
            Subscriptions ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Zap className="w-4 h-4 mr-2" />
            Available Products ({products.length})
          </TabsTrigger>
        </TabsList>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading bundles...</p>
            </div>
          ) : bundles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Bundles Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first product bundle to get started</p>
                <Button onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bg-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bundle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Bundle Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Products</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Discount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Subscriptions</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bundles.map(bundle => (
                        <tr key={bundle.id} className={`hover:bg-muted ${!bundle.is_active ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{bundle.name}</p>
                              {bundle.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">{bundle.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {bundle.products?.slice(0, 3).map((prod, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {prod.product_name}
                                </Badge>
                              ))}
                              {bundle.products?.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-muted">
                                  +{bundle.products.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">${bundle.monthly_price}/mo</span>
                              {bundle.original_price > bundle.monthly_price && (
                                <span className="text-xs text-muted-foreground line-through">${bundle.original_price}/mo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {bundle.discount_percentage > 0 ? (
                              <Badge className="bg-muted text-red-800">
                                {bundle.discount_percentage}% OFF
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{bundle.assignments_count || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={bundle.is_active ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}>
                              {bundle.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditBundle(bundle)} title="Edit">
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => duplicateBundle(bundle)} title="Duplicate">
                                <Copy className="w-4 h-4 text-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openAssignModal(bundle)} title="Assign">
                                <UserPlus className="w-4 h-4 text-foreground" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteBundle(bundle.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-foreground" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No subscriptions assigned yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Entity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Bundle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignments.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-muted">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {assignment.entity_type === 'user' ? (
                                <Users className="w-4 h-4 text-purple-500" />
                              ) : (
                                <Building2 className="w-4 h-4 text-foreground" />
                              )}
                              <span className="font-medium">{assignment.entity_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {assignment.entity_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{assignment.bundle_name}</td>
                          <td className="px-4 py-3 font-medium">${assignment.monthly_price}/mo</td>
                          <td className="px-4 py-3">
                            <Badge className={
                              assignment.status === 'active' ? 'bg-muted text-foreground' :
                              assignment.status === 'cancelled' ? 'bg-muted text-red-800' :
                              'bg-muted text-muted-foreground'
                            }>
                              {assignment.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(assignment.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {assignment.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-foreground"
                                onClick={() => handleCancelAssignment(assignment.id)}
                              >
                                Cancel
                              </Button>
                            )}
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

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.default_seats} seats included</p>
                    <div className="space-y-1">
                      {product.features?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-foreground mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Badge className={product.status === 'active' ? 'bg-muted text-foreground' : 'bg-muted'}>
                      {product.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Bundle Modal */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Create Product Bundle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Bundle Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Bundle Name *</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="e.g., Enterprise Suite"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  placeholder="Describe what's included in this bundle"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <Label className="mb-2 block">Select Products to Include *</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {products.map(product => {
                  const isSelected = bundleForm.products.some(p => p.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProductInBundle(product)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-muted' : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{product.name}</span>
                        {isSelected && <Check className="w-5 h-5 text-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground">${product.price}/mo</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Products Summary */}
            {bundleForm.products.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Products ({bundleForm.products.length})</h4>
                <div className="space-y-2">
                  {bundleForm.products.map(prod => (
                    <div key={prod.id} className="flex items-center justify-between text-sm">
                      <span>{prod.name}</span>
                      <span className="text-muted-foreground">${prod.price}/mo</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Original Total:</span>
                    <span>${calculateOriginalPrice()}/mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Bundle Price *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={bundleForm.monthly_price}
                    onChange={(e) => setBundleForm({ ...bundleForm, monthly_price: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                {calculateDiscount() > 0 && (
                  <p className="text-sm text-foreground mt-1">
                    {calculateDiscount()}% discount from original price
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={bundleForm.is_active}
                  onCheckedChange={(checked) => setBundleForm({ ...bundleForm, is_active: checked })}
                />
                <Label>Bundle is Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBundleModal(false); resetBundleForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={editingBundle ? handleUpdateBundle : handleCreateBundle}
              className="bg-primary hover:bg-primary/90"
            >
              {editingBundle ? 'Update Bundle' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Subscription Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Bundle Selection */}
            <div>
              <Label>Select Bundle *</Label>
              <Select 
                value={assignForm.bundle_id} 
                onValueChange={(v) => setAssignForm({ ...assignForm, bundle_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.filter(b => b.is_active).map(bundle => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name} (${bundle.monthly_price}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type */}
            <div>
              <Label>Assign To *</Label>
              <Select 
                value={assignForm.entity_type} 
                onValueChange={(v) => {
                  setAssignForm({ ...assignForm, entity_type: v, entity_id: '' });
                  setEntitySearchQuery('');
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Individual User</SelectItem>
                  <SelectItem value="company">Company/Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Selection with Search */}
            <div>
              <Label>{assignForm.entity_type === 'user' ? 'Select User *' : 'Select Company *'}</Label>
              <div className="mt-1 space-y-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={entitySearchQuery}
                    onChange={(e) => setEntitySearchQuery(e.target.value)}
                    placeholder={`Search by name${assignForm.entity_type === 'user' ? ', email, or company' : ''}...`}
                    className="pl-9"
                  />
                </div>
                
                {/* Selected Entity Display */}
                {assignForm.entity_id && (
                  <div className="flex items-center justify-between p-2 bg-muted border border-border rounded-md">
                    <div className="flex items-center gap-2">
                      {assignForm.entity_type === 'user' ? (
                        <Users className="w-4 h-4 text-foreground" />
                      ) : (
                        <Building2 className="w-4 h-4 text-foreground" />
                      )}
                      <span className="text-sm font-medium text-blue-900">
                        {assignForm.entity_type === 'user' 
                          ? users.find(u => u.id === assignForm.entity_id)?.full_name
                          : companies.find(c => c.id === assignForm.entity_id)?.name
                        }
                      </span>
                      {assignForm.entity_type === 'user' && (
                        <span className="text-xs text-foreground">
                          ({users.find(u => u.id === assignForm.entity_id)?.email})
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 text-foreground hover:text-foreground"
                      onClick={() => setAssignForm({ ...assignForm, entity_id: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Filtered Entity List */}
                {!assignForm.entity_id && (
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {assignForm.entity_type === 'user' ? (
                      users
                        .filter(user => {
                          if (!entitySearchQuery) return true;
                          const query = entitySearchQuery.toLowerCase();
                          return (
                            user.full_name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.company_name?.toLowerCase().includes(query) ||
                            user.mc_number?.toLowerCase().includes(query) ||
                            user.dot_number?.toLowerCase().includes(query)
                          );
                        })
                        .slice(0, 50) // Limit to first 50 results
                        .map(user => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setAssignForm({ ...assignForm, entity_id: user.id });
                              setEntitySearchQuery('');
                            }}
                            className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            {user.company_name && (
                              <span className="ml-2 text-xs text-muted-foreground truncate max-w-[120px]">
                                {user.company_name}
                              </span>
                            )}
                          </div>
                        ))
                    ) : (
                      companies
                        .filter(company => {
                          if (!entitySearchQuery) return true;
                          const query = entitySearchQuery.toLowerCase();
                          return company.name?.toLowerCase().includes(query);
                        })
                        .slice(0, 50)
                        .map(company => (
                          <div
                            key={company.id}
                            onClick={() => {
                              setAssignForm({ ...assignForm, entity_id: company.id });
                              setEntitySearchQuery('');
                            }}
                            className="flex items-center p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          >
                            <Building2 className="w-4 h-4 text-muted-foreground mr-2" />
                            <span className="text-sm font-medium text-foreground">{company.name}</span>
                          </div>
                        ))
                    )}
                    {/* No results message */}
                    {entitySearchQuery && (
                      (assignForm.entity_type === 'user' 
                        ? users.filter(u => 
                            u.full_name?.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
                            u.email?.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
                            u.company_name?.toLowerCase().includes(entitySearchQuery.toLowerCase())
                          ).length === 0
                        : companies.filter(c => 
                            c.name?.toLowerCase().includes(entitySearchQuery.toLowerCase())
                          ).length === 0
                      ) && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No {assignForm.entity_type === 'user' ? 'users' : 'companies'} found matching "{entitySearchQuery}"
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Any notes about this subscription"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignBundle} className="bg-primary hover:bg-primary/90">
              Assign Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManager;
