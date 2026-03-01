import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DispatchAnalytics = () => {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({
    totalLoads: 0,
    activeLoads: 0,
    deliveredLoads: 0,
    pendingLoads: 0,
    completionRate: 0,
    avgDeliveryTime: 0,
    totalRevenue: 0,
    loadsThisMonth: 0,
    loadsThisWeek: 0,
    overdueLoads: 0
  });
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all analytics data from the dedicated endpoint
      const res = await fetchWithAuth(`${BACKEND_URL}/api/analytics/dispatch/summary`);
      
      if (res.ok) {
        const data = await res.json();
        
        // Set KPIs from backend
        setKpis({
          totalLoads: data.kpis.totalLoads || 0,
          activeLoads: data.kpis.activeLoads || 0,
          deliveredLoads: data.kpis.deliveredLoads || 0,
          pendingLoads: data.kpis.pendingLoads || 0,
          completionRate: data.kpis.completionRate || 0,
          avgDeliveryTime: data.kpis.avgDeliveryTime || 0,
          totalRevenue: data.kpis.totalRevenue || 0,
          loadsThisMonth: data.kpis.loadsThisMonth || 0,
          loadsThisWeek: data.kpis.loadsThisWeek || 0,
          overdueLoads: data.kpis.overdueLoads || 0
        });
        
        // Set status distribution
        setStatusDistribution(data.statusDistribution || []);
        
        // Set monthly trend
        setMonthlyTrend(data.monthlyTrend || []);
        
        // Set recent activity
        setRecentActivity(data.recentActivity || []);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fas fa-spinner fa-spin text-4xl text-foreground"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <i className="fas fa-exclamation-triangle text-4xl text-primary"></i>
        <p className="text-foreground">{error}</p>
        <button 
          onClick={loadAnalytics}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            <i className="fas fa-chart-bar text-foreground mr-3"></i>
            Dispatch Analytics
          </h2>
          <p className="text-foreground text-sm mt-1">Real-time KPIs and performance metrics</p>
        </div>
        <button 
          onClick={loadAnalytics}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Total Loads</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis.totalLoads}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-truck-loading text-2xl text-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Active Loads</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis.activeLoads}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-truck text-2xl text-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Delivered</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis.deliveredLoads}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-check-circle text-2xl text-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis.pendingLoads}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-clock text-2xl text-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Overdue</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis.overdueLoads}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-exclamation-triangle text-2xl text-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">${kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-dollar-sign text-foreground text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.loadsThisMonth}</p>
                <p className="text-xs text-foreground">loads created</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-calendar-alt text-foreground text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.loadsThisWeek}</p>
                <p className="text-xs text-foreground">loads created</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-calendar-week text-foreground text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs uppercase tracking-wide">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.completionRate}%</p>
                <p className="text-xs text-foreground">delivered/total</p>
              </div>
              <div className="bg-muted p-3 rounded-full">
                <i className="fas fa-percentage text-foreground text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Status Distribution and Calendar */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-foreground">
              <i className="fas fa-chart-pie text-foreground mr-2"></i>
              Load Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-foreground">{item.status}</span>
                      <span className="text-sm text-foreground">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {statusDistribution.length === 0 && (
                <div className="text-center py-8 text-foreground">
                  <i className="fas fa-chart-pie text-4xl mb-2 opacity-50"></i>
                  <p>No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Calendar with Week Numbers */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-foreground">
              <i className="fas fa-calendar-alt text-foreground mr-2"></i>
              Dispatch Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DayPicker
              showWeekNumber
              showOutsideDays
              fixedWeeks
              className="p-3"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium text-foreground",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center text-foreground",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary [&:has([aria-selected])]:rounded-md",
                day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-muted rounded-md inline-flex items-center justify-center",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-muted text-foreground font-bold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
                weeknumber: "text-xs text-primary font-semibold w-9 h-9 flex items-center justify-center",
              }}
              formatters={{
                formatWeekNumber: (weekNumber) => `W${weekNumber}`
              }}
              components={{
                IconLeft: ({ className, ...props }) => (
                  <ChevronLeft className="h-4 w-4 text-foreground" {...props} />
                ),
                IconRight: ({ className, ...props }) => (
                  <ChevronRight className="h-4 w-4 text-foreground" {...props} />
                ),
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Load Trend - Full Width Row */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-foreground">
              <i className="fas fa-chart-line text-foreground mr-2"></i>
              Monthly Load Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {monthlyTrend.map((item, index) => {
                const maxCount = Math.max(...monthlyTrend.map(m => m.count), 1);
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <span className="text-xs font-semibold text-foreground mb-1">{item.count}</span>
                      <div 
                        className="w-full bg-primary transition-all duration-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-foreground mt-2">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center text-foreground">
            <i className="fas fa-history text-foreground mr-2"></i>
            Recent Load Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Load #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.map((item, index) => (
                  <tr key={index} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{item.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium">
                        {item.status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.created}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">${item.rate.toLocaleString()}</td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-foreground">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchAnalytics;
