import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesAnalyticsNew = ({ tenants, fetchWithAuth, BACKEND_URL }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activationsTimeRange, setActivationsTimeRange] = useState('monthly');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/analytics`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (e) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [fetchWithAuth, BACKEND_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center text-muted-foreground py-16">No analytics data available</div>;
  }

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate average revenue
  const avgMonthlyRevenue = analyticsData.monthly_revenue.length > 0
    ? analyticsData.monthly_revenue.reduce((sum, item) => sum + item.revenue, 0) / analyticsData.monthly_revenue.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Sales Analytics</h2>
        <p className="text-muted-foreground mt-2">Comprehensive revenue tracking and customer insights</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Lifetime Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(analyticsData.total_lifetime_revenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analyticsData.total_customers}</p>
                <p className="text-xs text-foreground mt-1">{analyticsData.active_customers} active</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Monthly Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(avgMonthlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analyticsData.active_customers}</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month on Month Revenue Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Month on Month Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analyticsData.monthly_revenue.map(item => ({
              ...item,
              monthLabel: formatMonth(item.month)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthly_revenue.map(item => ({
              ...item,
              monthLabel: formatMonth(item.month)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#10b981" name="Growth %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* New Activations Revenue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>New Activations Revenue</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activationsTimeRange === 'monthly' ? 'default' : 'outline'}
                onClick={() => setActivationsTimeRange('monthly')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Monthly
              </Button>
              <Button
                size="sm"
                variant={activationsTimeRange === 'weekly' ? 'default' : 'outline'}
                onClick={() => setActivationsTimeRange('weekly')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Weekly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={
              activationsTimeRange === 'monthly' 
                ? analyticsData.new_activations.monthly.map(item => ({
                    ...item,
                    label: formatMonth(item.month)
                  }))
                : analyticsData.new_activations.weekly.map(item => ({
                    ...item,
                    label: item.week
                  }))
            }>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="New Customer Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Repeat Customers Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Retention - Month on Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.repeat_customers.monthly.map(item => ({
              ...item,
              monthLabel: formatMonth(item.month)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis />
              <Tooltip labelFormatter={(label) => `Month: ${label}`} />
              <Legend />
              <Bar dataKey="count" fill="#06b6d4" name="Customer Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.top_customers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.subscriptions} subscription{customer.subscriptions !== 1 ? 's' : ''} • 
                      <span className={`ml-1 ${
                        customer.status === 'active' ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {customer.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(customer.revenue)}</div>
                  <div className="text-xs text-muted-foreground">monthly revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalyticsNew;