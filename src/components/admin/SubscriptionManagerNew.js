import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, Plus, Trash2, Package, ChevronDown, ChevronUp, Users } from 'lucide-react';
import UserManagement from './UserManagement';

const SubscriptionManagerNew = ({ tenants, plans, fetchWithAuth, BACKEND_URL, refreshTenants }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingTenant, setEditingTenant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [selectedTenantForProduct, setSelectedTenantForProduct] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [newProductData, setNewProductData] = useState({
    product_id: '',
    seats_allocated: 5,
    storage_allocated_gb: 10,
    discount_percentage: 0,
    discount_reason: ''
  });
  const [newTenantData, setNewTenantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    total_seats_allocated: 10,
    storage_limit_gb: 50
  });

  // Filter and sort tenants
  const filteredAndSortedTenants = useMemo(() => {
    let filtered = tenants.filter(tenant => {
      const query = searchQuery.toLowerCase();
      return (
        tenant.name?.toLowerCase().includes(query) ||
        tenant.company_email?.toLowerCase().includes(query) ||
        tenant.phone_number?.toLowerCase().includes(query)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'active_products') {
        aVal = a.active_products?.length || 0;
        bVal = b.active_products?.length || 0;
      } else if (sortConfig.key === 'total_seats_used') {
        aVal = a.total_seats_used || 0;
        bVal = b.total_seats_used || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tenants, searchQuery, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant({ ...tenant });
    setIsEditModalOpen(true);
  };

  const handleSaveTenant = async () => {
    try {
      const updates = {
        name: editingTenant.name,
        company_email: editingTenant.company_email,
        phone_number: editingTenant.phone_number,
        billing_email: editingTenant.billing_email,
        payment_method: editingTenant.payment_method,
        subscription_status: editingTenant.subscription_status
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants/${editingTenant.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        toast.success('Tenant updated successfully');
        setIsEditModalOpen(false);
        refreshTenants();
      } else {
        toast.error('Failed to update tenant');
      }
    } catch (error) {
      toast.error('Error updating tenant');
    }
  };

  const handleAddProduct = (tenant) => {
    setSelectedTenantForProduct(tenant);
    setNewProductData({ 
      product_id: '', 
      seats_allocated: 5, 
      storage_allocated_gb: 10,
      discount_percentage: 0,
      discount_reason: ''
    });
    setIsAddProductModalOpen(true);
  };

  const handleSaveNewProduct = async () => {
    if (!newProductData.product_id) {
      toast.error('Please select a product');
      return;
    }

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/admin/tenants/${selectedTenantForProduct.id}/subscriptions`,
        {
          method: 'POST',
          body: JSON.stringify(newProductData)
        }
      );

      if (res.ok) {
        toast.success('Product subscription added successfully');
        setIsAddProductModalOpen(false);
        refreshTenants();
      } else {
        toast.error('Failed to add product subscription');
      }
    } catch (error) {
      toast.error('Error adding product subscription');
    }
  };

  const handleRemoveSubscription = async (tenantId, subscriptionId) => {
    if (!confirm('Schedule this subscription for cancellation at end of billing period?')) return;

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/admin/tenants/${tenantId}/subscriptions/${subscriptionId}?schedule_removal=true`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Subscription cancellation scheduled');
        refreshTenants();
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Error canceling subscription');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-muted text-foreground',
      pending: 'bg-muted text-yellow-800',
      canceled: 'bg-muted text-red-800',
      trial: 'bg-muted text-foreground'
    };
    return <Badge className={variants[status] || 'bg-muted text-foreground'}>{status}</Badge>;
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  // Show User Management view if a tenant is selected
  if (showUserManagement && selectedTenantForUsers) {
    return (
      <UserManagement
        tenant={selectedTenantForUsers}
        plans={plans}
        fetchWithAuth={fetchWithAuth}
        BACKEND_URL={BACKEND_URL}
        onClose={() => {
          setShowUserManagement(false);
          setSelectedTenantForUsers(null);
          refreshTenants();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Subscription Manager</h2>
          <p className="text-muted-foreground mt-2">Manage tenants, products, and subscriptions</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsAddTenantModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedTenants.length} tenant{filteredAndSortedTenants.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left p-3 font-semibold text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('name')}
                  >
                    Tenant Name <SortIcon columnKey="name" />
                  </th>
                  <th className="text-left p-3 font-semibold text-foreground">Contact</th>
                  <th 
                    className="text-left p-3 font-semibold text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('active_products')}
                  >
                    Active Products <SortIcon columnKey="active_products" />
                  </th>
                  <th 
                    className="text-left p-3 font-semibold text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('subscription_status')}
                  >
                    Status <SortIcon columnKey="subscription_status" />
                  </th>
                  <th 
                    className="text-left p-3 font-semibold text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('total_seats_used')}
                  >
                    Seats <SortIcon columnKey="total_seats_used" />
                  </th>
                  <th className="text-left p-3 font-semibold text-foreground">Storage</th>
                  <th className="text-left p-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-muted">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {tenant.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-foreground">{tenant.company_email || '—'}</div>
                      <div className="text-xs text-muted-foreground">{tenant.phone_number || '—'}</div>
                    </td>
                    <td className="p-3">
                      {tenant.active_products?.length > 0 ? (
                        <div className="space-y-1">
                          {tenant.active_products.map((product) => (
                            <div key={product.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {product.tier || product.label}
                              </Badge>
                              {product.discount_percentage > 0 && (
                                <Badge className="bg-muted text-foreground text-xs">
                                  -{product.discount_percentage}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No products</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(tenant.subscription_status || 'pending')}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <span className="font-medium">{tenant.total_seats_used || 0}</span>
                        <span className="text-muted-foreground"> / {tenant.total_seats_allocated || 0}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <span className="font-medium">{(tenant.total_storage_used || 0).toFixed(1)}</span>
                        <span className="text-muted-foreground"> / {tenant.total_storage_allocated || 0} GB</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTenant(tenant)}
                          title="Edit Tenant"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddProduct(tenant)}
                          title="Add Product"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-muted hover:bg-muted"
                          onClick={() => {
                            setSelectedTenantForUsers(tenant);
                            setShowUserManagement(true);
                          }}
                          title="Manage Users"
                        >
                          <Users className="w-4 h-4" />
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

      {/* Add Tenant Modal */}
      <Dialog open={isAddTenantModalOpen} onOpenChange={setIsAddTenantModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Create a new tenant company in the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={newTenantData.name}
                  onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                  placeholder="Acme Trucking Co."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Company Email *</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={newTenantData.email}
                  onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                  placeholder="contact@acmetrucking.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newTenantData.phone}
                  onChange={(e) => setNewTenantData({ ...newTenantData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newTenantData.address}
                  onChange={(e) => setNewTenantData({ ...newTenantData, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats">Total Seats Allocated *</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  value={newTenantData.total_seats_allocated}
                  onChange={(e) => setNewTenantData({ ...newTenantData, total_seats_allocated: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-muted-foreground">Number of user accounts allowed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage">Storage Limit (GB) *</Label>
                <Input
                  id="storage"
                  type="number"
                  min="1"
                  value={newTenantData.storage_limit_gb}
                  onChange={(e) => setNewTenantData({ ...newTenantData, storage_limit_gb: parseInt(e.target.value) || 50 })}
                />
                <p className="text-xs text-muted-foreground">Total storage space in gigabytes</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddTenantModalOpen(false);
              setNewTenantData({
                name: '',
                email: '',
                phone: '',
                address: '',
                total_seats_allocated: 10,
                storage_limit_gb: 50
              });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                try {
                  if (!newTenantData.name || !newTenantData.email || !newTenantData.phone) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants`, {
                    method: 'POST',
                    body: JSON.stringify(newTenantData)
                  });

                  if (res.ok) {
                    toast.success('Tenant created successfully!');
                    setIsAddTenantModalOpen(false);
                    setNewTenantData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      total_seats_allocated: 10,
                      storage_limit_gb: 50
                    });
                    refreshTenants();
                  } else {
                    const error = await res.json();
                    toast.error(error.detail || 'Failed to create tenant');
                  }
                } catch (error) {
                  toast.error('Error creating tenant');
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant Profile</DialogTitle>
            <DialogDescription>
              Update tenant information and billing details. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          {editingTenant && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={editingTenant.name || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subscription Status</Label>
                  <Select
                    value={editingTenant.subscription_status || 'active'}
                    onValueChange={(val) => setEditingTenant({ ...editingTenant, subscription_status: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Email</Label>
                  <Input
                    type="email"
                    value={editingTenant.company_email || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, company_email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={editingTenant.phone_number || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone_number: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Billing Email</Label>
                  <Input
                    type="email"
                    value={editingTenant.billing_email || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, billing_email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={editingTenant.payment_method || 'card'}
                    onValueChange={(val) => setEditingTenant({ ...editingTenant, payment_method: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="ach">ACH Transfer</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Subscriptions */}
              <div>
                <Label className="text-base font-semibold">Active Subscriptions</Label>
                <div className="mt-2 space-y-2">
                  {editingTenant.subscriptions?.length > 0 ? (
                    editingTenant.subscriptions.map((sub) => {
                      const product = plans.find(p => p.id === sub.product_id);
                      const basePrice = product?.price || 0;
                      const discount = sub.discount_percentage || 0;
                      const discountedPrice = basePrice * (1 - discount / 100);
                      
                      return (
                        <div key={sub.id} className="border rounded p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{product?.label || sub.product_id}</div>
                              {discount > 0 && (
                                <Badge className="bg-muted text-foreground text-xs">
                                  {discount}% OFF
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Seats: {sub.seats_used}/{sub.seats_allocated} • 
                              Storage: {sub.storage_used_gb?.toFixed(1) || 0}/{sub.storage_allocated_gb} GB
                            </div>
                            {discount > 0 && (
                              <div className="text-xs text-foreground mt-1 flex items-center gap-2">
                                <span className="line-through text-muted-foreground">${basePrice}/mo</span>
                                <span className="font-semibold text-foreground">${discountedPrice.toFixed(2)}/mo</span>
                                {sub.discount_reason && (
                                  <span className="text-muted-foreground">• {sub.discount_reason}</span>
                                )}
                              </div>
                            )}
                            {sub.status === 'pending_cancellation' && (
                              <div className="text-xs text-foreground mt-1">Scheduled for cancellation</div>
                            )}
                            {sub.pending_changes && (
                              <div className="text-xs text-foreground mt-1">
                                Pending changes at next billing cycle
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(sub.status)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveSubscription(editingTenant.id, sub.id)}
                            >
                              <Trash2 className="w-4 h-4 text-foreground" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded">No active subscriptions</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTenant}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product Subscription</DialogTitle>
            <DialogDescription>
              Assign a new product to {selectedTenantForProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Product</Label>
              <Select
                value={newProductData.product_id}
                onValueChange={(val) => setNewProductData({ ...newProductData, product_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.label} {plan.tier ? `- ${plan.tier}` : ''} (${plan.price}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seats</Label>
                <Input
                  type="number"
                  min={1}
                  value={newProductData.seats_allocated}
                  onChange={(e) => setNewProductData({ ...newProductData, seats_allocated: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Storage (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newProductData.storage_allocated_gb}
                  onChange={(e) => setNewProductData({ ...newProductData, storage_allocated_gb: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Discount Override Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Discount Override</Label>
                <span className="text-xs text-muted-foreground">For clients with special pricing</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={newProductData.discount_percentage}
                    onChange={(e) => setNewProductData({ ...newProductData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                    placeholder="0.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter 0-100</p>
                </div>
                <div>
                  <Label>Discount Reason</Label>
                  <Input
                    value={newProductData.discount_reason}
                    onChange={(e) => setNewProductData({ ...newProductData, discount_reason: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Partner discount, Beta customer"
                  />
                </div>
              </div>

              {/* Price Calculation Display */}
              {newProductData.product_id && (
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="text-sm font-medium text-foreground mb-2">Pricing Summary</div>
                  {(() => {
                    const selectedPlan = plans.find(p => p.id === newProductData.product_id);
                    const basePrice = selectedPlan?.price || 0;
                    const discount = newProductData.discount_percentage || 0;
                    const discountedPrice = basePrice * (1 - discount / 100);
                    const savings = basePrice - discountedPrice;

                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="font-medium">${basePrice.toFixed(2)}/month</span>
                        </div>
                        {discount > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Discount ({discount}%):</span>
                              <span className="text-foreground font-medium">-${savings.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                              <span className="text-foreground">Final Price:</span>
                              <span className="text-foreground">${discountedPrice.toFixed(2)}/month</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewProduct}>Add Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagerNew;