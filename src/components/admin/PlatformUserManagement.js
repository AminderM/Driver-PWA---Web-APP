import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Edit, MessageSquare, ChevronDown, Plus, Trash2, X, Search, CheckCircle, AlertTriangle } from 'lucide-react';

const USER_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-muted text-foreground' },
  { value: 'inactive', label: 'Inactive', color: 'bg-muted text-foreground' },
  { value: 'declined', label: 'Declined', color: 'bg-muted text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted text-orange-800' }
];

const USER_TYPES = [
  { value: 'carrier', label: 'Carrier' },
  { value: 'broker', label: 'Broker' },
  { value: 'shipper', label: 'Shipper' },
  { value: 'driver', label: 'Driver' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'owner_operator', label: 'Owner Operator' },
  { value: 'other', label: 'Other' }
];

// System roles that control access to the TMS Web App and Driver Mobile App
const USER_ROLES = [
  { value: 'platform_admin', label: 'Platform Admin', description: 'Full system access', app: 'TMS Web App' },
  { value: 'company_admin', label: 'Company Admin', description: 'Company-level admin access', app: 'TMS Web App' },
  { value: 'manager', label: 'Manager', description: 'Team management access', app: 'TMS Web App' },
  { value: 'dispatcher', label: 'Dispatcher', description: 'Load dispatch & tracking', app: 'TMS Web App' },
  { value: 'accountant', label: 'Accountant', description: 'Financial & billing access', app: 'TMS Web App' },
  { value: 'hr_manager', label: 'HR Manager', description: 'Employee management', app: 'TMS Web App' },
  { value: 'sales_manager', label: 'Sales Manager', description: 'Sales & CRM access', app: 'TMS Web App' },
  { value: 'fleet_manager', label: 'Fleet Manager', description: 'Fleet & vehicle management', app: 'TMS Web App' },
  { value: 'driver', label: 'Driver', description: 'Driver mobile app access', app: 'Driver Mobile App' },
];

const PlatformUserManagement = ({ BACKEND_URL, fetchWithAuth }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    phone: '',
    mc_number: '',
    dot_number: '',
    company_name: '',
    company_website: '',
    role: 'company_admin',
    user_type: 'other',
    status: 'active'
  });
  
  // Edit user form
  const [editUser, setEditUser] = useState({
    full_name: '',
    phone: '',
    mc_number: '',
    dot_number: '',
    company_name: '',
    company_website: '',
    user_type: 'other',
    status: 'active',
    password: ''
  });

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // FMCSA Carrier Lookup for Create User
  const [carrierSearchQuery, setCarrierSearchQuery] = useState('');
  const [carrierSearchLoading, setCarrierSearchLoading] = useState(false);
  const [carrierInfo, setCarrierInfo] = useState(null);

  const lookupCarrier = async () => {
    if (!carrierSearchQuery.trim()) {
      toast.error('Please enter a DOT#, MC#, or company name');
      return;
    }

    setCarrierSearchLoading(true);
    setCarrierInfo(null);

    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/api/fmcsa/carrier/lookup?query=${encodeURIComponent(carrierSearchQuery.trim())}`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Handle single carrier result
        if (data.carrier) {
          setCarrierInfo(data.carrier);
          // Auto-fill form fields
          setNewUser(prev => ({
            ...prev,
            full_name: data.carrier.legal_name || prev.full_name,
            phone: data.carrier.phone || prev.phone,
            mc_number: data.carrier.mc_number ? `MC-${data.carrier.mc_number}` : prev.mc_number,
            dot_number: data.carrier.dot_number ? `DOT-${data.carrier.dot_number}` : prev.dot_number,
            company_name: data.carrier.legal_name || prev.company_name
          }));
          toast.success('Carrier found! Form fields auto-filled.');
        } 
        // Handle multiple results - take the first one
        else if (data.carriers && data.carriers.length > 0) {
          const carrier = data.carriers[0];
          setCarrierInfo(carrier);
          setNewUser(prev => ({
            ...prev,
            full_name: carrier.legal_name || prev.full_name,
            phone: carrier.phone || prev.phone,
            mc_number: carrier.mc_number ? `MC-${carrier.mc_number}` : prev.mc_number,
            dot_number: carrier.dot_number ? `DOT-${carrier.dot_number}` : prev.dot_number,
            company_name: carrier.legal_name || prev.company_name
          }));
          toast.success(`Found ${data.carriers.length} carrier(s). First result auto-filled.`);
        } else {
          toast.info('No carrier found matching your search');
        }
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.info('No carrier found matching your search');
        } else {
          toast.error(error.detail || 'Carrier lookup failed');
        }
      }
    } catch (error) {
      console.error('Carrier lookup error:', error);
      toast.error('Failed to lookup carrier');
    } finally {
      setCarrierSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.full_name || !newUser.password) {
        toast.error('Please fill in all required fields (Name, Email, Password)');
        return;
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        setNewUser({
          email: '',
          full_name: '',
          password: '',
          phone: '',
          mc_number: '',
          dot_number: '',
          company_name: '',
          company_website: '',
          role: 'company_admin',
          user_type: 'other',
          status: 'active'
        });
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
      console.error(error);
    }
  };

  const handleEditUser = async () => {
    try {
      const updateData = {};
      if (editUser.full_name) updateData.full_name = editUser.full_name;
      if (editUser.phone) updateData.phone = editUser.phone;
      if (editUser.mc_number !== undefined) updateData.mc_number = editUser.mc_number;
      if (editUser.dot_number !== undefined) updateData.dot_number = editUser.dot_number;
      if (editUser.company_name !== undefined) updateData.company_name = editUser.company_name;
      if (editUser.company_website !== undefined) updateData.company_website = editUser.company_website;
      if (editUser.user_type) updateData.user_type = editUser.user_type;
      if (editUser.status) updateData.status = editUser.status;
      if (editUser.password) updateData.password = editUser.password;

      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deactivated successfully');
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to deactivate user');
      }
    } catch (error) {
      toast.error('Failed to deactivate user');
      console.error(error);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      full_name: user.full_name || '',
      phone: user.phone || '',
      mc_number: user.mc_number || '',
      dot_number: user.dot_number || '',
      company_name: user.company_name || '',
      company_website: user.company_website || '',
      user_type: user.user_type || 'other',
      status: user.status || 'active',
      password: ''
    });
    setShowEditModal(true);
  };

  const openCommentsModal = async (user) => {
    setSelectedUser(user);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${user.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = USER_STATUSES.find(s => s.value === status) || USER_STATUSES[0];
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total_users}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{stats.active_users}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{stats.inactive_users}</div>
              <div className="text-sm text-muted-foreground">Inactive Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total_companies_with_users}</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">User Management</CardTitle>
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, email, company, MC#, or DOT#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table - Spreadsheet Style */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-5xl mb-4">👥</div>
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">User Type</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">Phone#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">Subscription</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">MC#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">DOT#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-r border-gray-300">Company Name</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted'}>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.full_name}</td>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.email}</td>
                      <td className="px-3 py-3 text-sm border-r border-border whitespace-nowrap">
                        <Badge variant="outline" className="capitalize">
                          {USER_TYPES.find(t => t.value === user.user_type)?.label || user.user_type || 'Other'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.phone || '-'}</td>
                      <td className="px-3 py-3 text-sm border-r border-border whitespace-nowrap">
                        {user.subscriptions?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {user.subscriptions.filter(s => s.status === 'active').map((sub, idx) => (
                              <Badge key={idx} className="bg-muted text-purple-800 text-xs">
                                {sub.bundle_name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.mc_number || '-'}</td>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.dot_number || '-'}</td>
                      <td className="px-3 py-3 text-sm text-foreground border-r border-border whitespace-nowrap">{user.company_name || '-'}</td>
                      <td className="px-3 py-3 text-sm border-border">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                            className="h-8 px-2"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Status Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 px-2 min-w-[100px]">
                                {getStatusBadge(user.status || 'active')}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {USER_STATUSES.map(status => (
                                <DropdownMenuItem 
                                  key={status.value}
                                  onClick={() => handleUpdateStatus(user.id, status.value)}
                                  className={user.status === status.value ? 'bg-muted' : ''}
                                >
                                  <Badge className={`${status.color} mr-2`}>{status.label}</Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Comments Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCommentsModal(user)}
                            className="h-8 px-2"
                            title="View Comments"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {user.comments?.length > 0 && (
                              <span className="ml-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                                {user.comments.length}
                              </span>
                            )}
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

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) {
          setCarrierSearchQuery('');
          setCarrierInfo(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          
          {/* FMCSA Carrier Lookup Section */}
          <div className="border rounded-lg p-4 bg-muted mb-4">
            <Label className="text-sm font-medium text-foreground mb-2 block">
              <Search className="w-4 h-4 inline mr-1" />
              FMCSA Carrier Lookup (Auto-fill from DOT#, MC#, or company name)
            </Label>
            <div className="flex gap-2">
              <Input
                value={carrierSearchQuery}
                onChange={(e) => setCarrierSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupCarrier()}
                placeholder="Enter DOT#, MC#, or company name..."
                className="flex-1 bg-card"
              />
              <Button 
                type="button" 
                onClick={lookupCarrier}
                disabled={carrierSearchLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {carrierSearchLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {carrierInfo && (
              <div className="mt-3 p-3 bg-card rounded border text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{carrierInfo.legal_name}</span>
                  {carrierInfo.allow_to_operate === 'Y' && !carrierInfo.out_of_service ? (
                    <Badge className="bg-muted text-foreground text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />Authorized
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-red-800 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />Not Authorized
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {carrierInfo.dot_number && <span className="mr-3">DOT# {carrierInfo.dot_number}</span>}
                  {carrierInfo.mc_number && <span className="mr-3">MC# {carrierInfo.mc_number}</span>}
                </div>
                {carrierInfo.physical_address && (
                  <div className="text-muted-foreground text-xs mt-1">{carrierInfo.physical_address}</div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-sm font-medium">Name *</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="Full Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone#</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">MC#</Label>
              <Input
                value={newUser.mc_number}
                onChange={(e) => setNewUser({...newUser, mc_number: e.target.value})}
                placeholder="MC-123456"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DOT#</Label>
              <Input
                value={newUser.dot_number}
                onChange={(e) => setNewUser({...newUser, dot_number: e.target.value})}
                placeholder="DOT-1234567"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                value={newUser.company_name}
                onChange={(e) => setNewUser({...newUser, company_name: e.target.value})}
                placeholder="Company LLC"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Website</Label>
              <Input
                value={newUser.company_website}
                onChange={(e) => setNewUser({...newUser, company_website: e.target.value})}
                placeholder="www.company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">User Type</Label>
              <Select 
                value={newUser.user_type} 
                onValueChange={(value) => setNewUser({...newUser, user_type: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium">System Role *</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({...newUser, role: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({role.app})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {USER_ROLES.find(r => r.value === newUser.role)?.description || 'Select a role to see description'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Password *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setNewUser({...newUser, password: generatePassword()})}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={newUser.status} 
                onValueChange={(value) => setNewUser({...newUser, status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-primary hover:bg-primary/90">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={editUser.full_name}
                onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone#</Label>
              <Input
                value={editUser.phone}
                onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">MC#</Label>
              <Input
                value={editUser.mc_number}
                onChange={(e) => setEditUser({...editUser, mc_number: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DOT#</Label>
              <Input
                value={editUser.dot_number}
                onChange={(e) => setEditUser({...editUser, dot_number: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                value={editUser.company_name}
                onChange={(e) => setEditUser({...editUser, company_name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Website</Label>
              <Input
                value={editUser.company_website}
                onChange={(e) => setEditUser({...editUser, company_website: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">User Type</Label>
              <Select 
                value={editUser.user_type} 
                onValueChange={(value) => setEditUser({...editUser, user_type: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={editUser.status} 
                onValueChange={(value) => setEditUser({...editUser, status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">New Password (leave empty to keep)</Label>
              <Input
                type="text"
                value={editUser.password}
                onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditUser} className="bg-primary hover:bg-primary/90">Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments for {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment about this customer's history..."
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddComment} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {loadingComments ? (
                <div className="p-4 text-center text-muted-foreground">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No comments yet</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 hover:bg-muted">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {comment.created_by_name} • {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlatformUserManagement;
