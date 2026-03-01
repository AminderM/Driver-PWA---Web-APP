import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: User Registration, 2: Company Registration
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // User data
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: '',
    // Company data
    company_name: '',
    company_type: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    tax_id: ''
  });
  
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Login successful!');
        
        // Wait for localStorage to be updated, then check role
        // Use a small delay to ensure useEffect in AuthContext has run
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const isAdmin = userData.role === 'platform_admin';
        
        console.log('AuthPage: Login successful, user role:', userData.role, 'isAdmin:', isAdmin);
        
        if (isAdmin) {
          console.log('AuthPage: Redirecting to /admin');
          navigate('/admin');
        } else {
          console.log('AuthPage: Redirecting to /dashboard');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('User account created! Please complete company registration.');
        setStep(2);
      } else {
        toast.error(data.detail || 'Registration failed');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First login to get token
      const loginResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        toast.error('Authentication failed');
        return;
      }

      // Register company
      const companyResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.access_token}`
        },
        body: JSON.stringify({
          name: formData.company_name,
          company_type: formData.company_type,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          tax_id: formData.tax_id
        })
      });

      const companyData = await companyResponse.json();
      
      if (companyResponse.ok) {
        toast.success('Registration completed! Please wait for verification.');
        // Auto login after registration
        const success = await login(formData.email, formData.password);
        if (success) {
          toast.success('Welcome to Fleet Marketplace!');
        }
      } else {
        toast.error(companyData.detail || 'Company registration failed');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: '',
      company_name: '',
      company_type: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      tax_id: ''
    });
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="form-container">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isLogin ? (
                'Welcome Back'
              ) : step === 1 ? (
                'Create Account'
              ) : (
                'Company Information'
              )}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isLogin ? (
                'Sign in to your Fleet Marketplace account'
              ) : step === 1 ? (
                'Join the Fleet Marketplace community'
              ) : (
                'Complete your company registration'
              )}
            </p>
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                    data-testid="login-email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="login-password-input"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      resetForm();
                    }}
                    className="text-primary hover:text-blue-800 text-sm"
                    data-testid="switch-to-register"
                  >
                    Don't have an account? Register here
                  </button>
                </div>
              </form>
            ) : step === 1 ? (
              // Step 1: User Registration
              <form onSubmit={handleUserRegistration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                    data-testid="register-fullname-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                    data-testid="register-email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    data-testid="register-phone-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger data-testid="register-role-select">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fleet_owner">Fleet Owner</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="construction_company">Construction Company</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a password"
                    required
                    data-testid="register-password-input"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !formData.role}
                  data-testid="register-user-submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Continue to Company Registration'
                  )}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      resetForm();
                    }}
                    className="text-primary hover:text-blue-800 text-sm"
                    data-testid="switch-to-login"
                  >
                    Already have an account? Sign in here
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: Company Registration
              <form onSubmit={handleCompanyRegistration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    required
                    data-testid="company-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_type">Company Type</Label>
                  <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                    <SelectTrigger data-testid="company-type-select">
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trucking">Trucking</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="equipment_rental">Equipment Rental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter company address"
                    required
                    data-testid="company-address-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      required
                      data-testid="company-city-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      required
                      data-testid="company-state-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="ZIP Code"
                    required
                    data-testid="company-zip-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID (Optional)</Label>
                  <Input
                    id="tax_id"
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    placeholder="Enter tax ID"
                    data-testid="company-tax-input"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !formData.company_type}
                  data-testid="register-company-submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Completing Registration...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-primary hover:text-blue-800 text-sm"
                    data-testid="back-to-user-registration"
                  >
                    Back to User Information
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;