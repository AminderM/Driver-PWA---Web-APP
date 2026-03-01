import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UserPlus, Edit2, Trash2, Key, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UserManagement = ({ tenant, plans, fetchWithAuth, BACKEND_URL, onClose }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'dispatcher',
    password: '',
    assigned_products: []
  });

  const [editUserData, setEditUserData] = useState({
    full_name: '',
    phone: '',
    role: '',
    is_active: true,
    assigned_products: []
  });

  const [newPassword, setNewPassword] = useState('');

  const userRoles = [
    { value: 'company_admin', label: 'Company Admin', description: 'Full access to company resources', icon: '👤' },
    { value: 'dispatcher', label: 'Dispatcher', description: 'Manage loads and fleet operations', icon: '📋' },
    { value: 'driver', label: 'Driver', description: 'View assigned loads and update status', icon: '🚛' }
  ];

  useEffect(() => {
    if (tenant?.id) {
      loadUsers();
      loadStats();
    }
  }, [tenant]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/company/${tenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/stats/company/${tenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      // Validate
      if (!newUserData.email || !newUserData.full_name || !newUserData.phone || !newUserData.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (newUserData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }

      const payload = {
        ...newUserData,
        company_id: tenant.id
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('User created successfully!');
        setIsAddUserModalOpen(false);
        setNewUserData({
          email: '',
          full_name: '',
          phone: '',
          role: 'dispatcher',
          password: '',
          assigned_products: []
        });
        loadUsers();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      assigned_products: user.assigned_products || []
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editUserData)
      });

      if (res.ok) {
        toast.success('User updated successfully');
        setIsEditUserModalOpen(false);
        loadUsers();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('User deleted successfully');
        loadUsers();
        loadStats();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/admin/users/${selectedUser.id}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ new_password: newPassword })
        }
      );

      if (res.ok) {
        toast.success('Password reset successfully');
        setIsResetPasswordModalOpen(false);
        setNewPassword('');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      company_admin: 'bg-muted text-purple-800 border-purple-300',
      dispatcher: 'bg-muted text-foreground border-primary',
      driver: 'bg-muted text-foreground border-green-300'
    };
    return colors[role] || 'bg-muted text-foreground border-gray-300';
  };

  const getRoleIcon = (role) => {
    const role_obj = userRoles.find(r => r.value === role);
    return role_obj?.icon || '👤';
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users for {tenant?.name}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Tenants
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_users}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Company Admins</p>
                  <p className="text-2xl font-bold text-foreground">{stats.by_role.company_admin}</p>
                </div>
                <span className="text-3xl">👤</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dispatchers</p>
                  <p className="text-2xl font-bold text-foreground">{stats.by_role.dispatcher}</p>
                </div>
                <span className="text-3xl">📋</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-2xl font-bold text-foreground">{stats.by_role.driver}</p>
                </div>
                <span className="text-3xl">🚛</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seat Usage Alert */}
      {tenant && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seat Usage: <strong>{tenant.total_seats_used || 0} / {tenant.total_seats_allocated || 0}</strong> seats allocated
            {tenant.total_seats_used >= tenant.total_seats_allocated && (
              <span className="text-foreground ml-2 font-semibold">⚠️ No seats available</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Add User */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search users by name, email, phone, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for {tenant?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center">
                            <span className="mr-2">{role.icon}</span>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewUserData({ ...newUserData, password: generatePassword() })}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Assigned Products (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {tenant?.active_products?.map(product => (
                    <div key={product.product_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`product-${product.product_id}`}
                        checked={newUserData.assigned_products.includes(product.product_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserData({
                              ...newUserData,
                              assigned_products: [...newUserData.assigned_products, product.product_id]
                            });
                          } else {
                            setNewUserData({
                              ...newUserData,
                              assigned_products: newUserData.assigned_products.filter(p => p !== product.product_id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`product-${product.product_id}`} className="text-sm cursor-pointer">
                        {product.label} ({product.tier})
                      </label>
                    </div>
                  ))}
                  {(!tenant?.active_products || tenant.active_products.length === 0) && (
                    <p className="text-sm text-muted-foreground col-span-2">No active products for this company</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90">
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search query' : 'Get started by adding your first user'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xl">{getRoleIcon(user.role)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {userRoles.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.assigned_products && user.assigned_products.length > 0 ? (
                            user.assigned_products.map(productId => {
                              const product = tenant?.active_products?.find(p => p.product_id === productId);
                              return product ? (
                                <Badge key={productId} variant="outline" className="text-xs">
                                  {product.tier}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">No products assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={user.is_active ? 'bg-muted text-foreground' : 'bg-muted text-red-800'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordModalOpen(true);
                            }}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-foreground hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information for {selectedUser?.full_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editUserData.full_name}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center">
                        <span className="mr-2">{role.icon}</span>
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned Products</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {tenant?.active_products?.map(product => (
                  <div key={product.product_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-product-${product.product_id}`}
                      checked={editUserData.assigned_products.includes(product.product_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditUserData({
                            ...editUserData,
                            assigned_products: [...editUserData.assigned_products, product.product_id]
                          });
                        } else {
                          setEditUserData({
                            ...editUserData,
                            assigned_products: editUserData.assigned_products.filter(p => p !== product.product_id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`edit-product-${product.product_id}`} className="text-sm cursor-pointer">
                      {product.label} ({product.tier})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editUserData.is_active}
                onCheckedChange={(checked) => setEditUserData({ ...editUserData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active User</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-primary hover:bg-primary/90">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="new_password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewPassword(generatePassword())}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsResetPasswordModalOpen(false);
              setNewPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} className="bg-primary hover:bg-primary/90">
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
