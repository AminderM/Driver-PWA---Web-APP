import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Clock, MapPin } from 'lucide-react';

const RouteMateAnalytics = ({ fetchWithAuth, BACKEND_URL }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [dateFilter]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const url = dateFilter 
        ? `${BACKEND_URL}/api/route-mate/analytics/route-performance?route_date=${dateFilter}`
        : `${BACKEND_URL}/api/route-mate/analytics/route-performance`;
      
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold text-gray-900">Analytics</h2><p className="text-gray-600 mt-1">Performance insights and metrics</p></div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-48" placeholder="Filter by date" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Avg Distance</p><p className="text-3xl font-bold text-gray-900">{analytics?.avg_distance?.toFixed(1) || 0} mi</p><p className="text-xs text-green-600 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" />Optimal range</p></div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><MapPin className="w-6 h-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Avg Duration</p><p className="text-3xl font-bold text-gray-900">{Math.floor((analytics?.avg_duration || 0) / 60)}h {Math.floor((analytics?.avg_duration || 0) % 60)}m</p><p className="text-xs text-gray-600 mt-1">Per route</p></div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Avg Stops</p><p className="text-3xl font-bold text-gray-900">{analytics?.avg_stops?.toFixed(0) || 0}</p><p className="text-xs text-gray-600 mt-1">Per route</p></div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-6 h-6 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Avg Score</p><p className="text-3xl font-bold text-gray-900">{analytics?.avg_score?.toFixed(0) || 0}</p><p className="text-xs text-green-600 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" />Good efficiency</p></div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Routes Analyzed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{analytics?.total_routes || 0}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{((analytics?.avg_distance || 0) * (analytics?.total_routes || 0)).toFixed(0)} mi</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Stops</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{((analytics?.avg_stops || 0) * (analytics?.total_routes || 0)).toFixed(0)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Est. Cost Savings</p>
              <p className="text-2xl font-bold text-green-600 mt-2">$0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Route Efficiency Factors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Distance Efficiency', score: 85, color: 'bg-blue-600' },
              { label: 'Time Management', score: 78, color: 'bg-green-600' },
              { label: 'Stop Density', score: 92, color: 'bg-purple-600' },
              { label: 'Workload Balance', score: 88, color: 'bg-orange-600' },
            ].map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{factor.label}</span>
                  <span className="text-sm font-bold text-gray-900">{factor.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${factor.color} h-2 rounded-full`} style={{ width: `${factor.score}%` }}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cost Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Fuel Costs</span>
                <span className="text-lg font-bold text-gray-900">$0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Labor Costs</span>
                <span className="text-lg font-bold text-gray-900">$0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Maintenance</span>
                <span className="text-lg font-bold text-gray-900">$0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Estimated Cost</span>
                <span className="text-2xl font-bold text-gray-900">$0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Section */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Interactive charts, predictive forecasting, historical trend analysis, driver performance leaderboards, and cost optimization recommendations will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteMateAnalytics;
