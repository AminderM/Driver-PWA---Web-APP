import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Map, Plus, Play, Calendar, Upload, Download, Eye, 
  Truck, Clock, TrendingUp, MapPin, Check, X, Settings
} from 'lucide-react';

const RouteMateRoutes = ({ fetchWithAuth, BACKEND_URL }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, [selectedDate]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/route-mate/routes?route_date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (e) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/optimize`, {
        method: 'POST',
        body: JSON.stringify({
          input_params: {
            date: selectedDate,
            territory_ids: [],
            optimization_goals: ['minimize_distance', 'balance_workload'],
            constraints: {
              max_route_duration: 480,
              enforce_time_windows: true
            },
            goal_weights: {
              distance: 0.25,
              time: 0.20,
              capacity: 0.15,
              time_windows: 0.25,
              density: 0.10,
              balance: 0.05
            }
          }
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`Created ${result.routes_generated} optimized routes!`);
        setShowOptimizeModal(false);
        loadRoutes();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Optimization failed');
      }
    } catch (e) {
      toast.error('Failed to optimize routes');
    } finally {
      setOptimizing(false);
    }
  };

  const handlePublishRoute = async (routeId) => {
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/route-mate/routes/${routeId}/publish`,
        { method: 'POST' }
      );

      if (res.ok) {
        toast.success('Route published to driver!');
        loadRoutes();
      } else {
        toast.error('Failed to publish route');
      }
    } catch (e) {
      toast.error('Failed to publish route');
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-700',
      'B': 'bg-blue-100 text-blue-700',
      'C': 'bg-yellow-100 text-yellow-700',
      'D': 'bg-orange-100 text-orange-700',
      'F': 'bg-red-100 text-red-700'
    };
    return colors[grade] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Routes</h2>
          <p className="text-gray-600 mt-1">Optimize and manage delivery routes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowOptimizeModal(true)}
          >
            <Play className="w-4 h-4 mr-2" />
            Optimize Routes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              </div>
              <Map className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stops</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.reduce((sum, r) => sum + (r.metrics?.total_stops || 0), 0)}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.reduce((sum, r) => sum + (r.metrics?.total_distance_miles || 0), 0).toFixed(0)} mi
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.length > 0 
                    ? (routes.reduce((sum, r) => sum + (r.optimization_score?.total_score || 0), 0) / routes.length).toFixed(0)
                    : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Routes for {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stops</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Distance</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Map className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{route.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            {route.vehicle_id ? route.vehicle_id.substring(0, 8) : 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {route.metrics?.total_stops || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {route.metrics?.total_distance_miles?.toFixed(1) || 0} mi
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-900">
                          <Clock className="w-3 h-3" />
                          <span>{Math.floor((route.metrics?.total_duration_minutes || 0) / 60)}h {(route.metrics?.total_duration_minutes || 0) % 60}m</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {route.optimization_score ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {route.optimization_score.total_score}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(route.optimization_score.grade)}`}>
                              {route.optimization_score.grade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          route.status === 'completed' ? 'bg-green-100 text-green-700' :
                          route.status === 'published' ? 'bg-blue-100 text-blue-700' :
                          route.status === 'optimized' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {route.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRoute(route)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {route.status === 'optimized' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handlePublishRoute(route.id)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Map className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No routes found for {selectedDate}</p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowOptimizeModal(true)}
              >
                <Play className="w-4 h-4 mr-2" />
                Optimize Routes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimize Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Optimize Routes for {selectedDate}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Route optimization will:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Analyze all unassigned orders for {selectedDate}</li>
                    <li>Distribute orders across available vehicles</li>
                    <li>Create optimal delivery sequences</li>
                    <li>Minimize total distance and maximize efficiency</li>
                  </ul>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Optimization Goals</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked id="goal1" className="rounded" />
                      <label htmlFor="goal1" className="text-sm">Minimize Distance</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked id="goal2" className="rounded" />
                      <label htmlFor="goal2" className="text-sm">Balance Workload</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="goal3" className="rounded" />
                      <label htmlFor="goal3" className="text-sm">Minimize Time</label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Constraints</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked id="con1" className="rounded" />
                      <label htmlFor="con1" className="text-sm">Time Windows</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked id="con2" className="rounded" />
                      <label htmlFor="con2" className="text-sm">Vehicle Capacity</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="con3" className="rounded" />
                      <label htmlFor="con3" className="text-sm">Driver Skills</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowOptimizeModal(false)}
                  disabled={optimizing}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleOptimize}
                  disabled={optimizing}
                >
                  {optimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Optimization
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Route Detail Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedRoute.name}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedRoute(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Route Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Stops</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedRoute.metrics?.total_stops || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedRoute.metrics?.total_distance_miles?.toFixed(1) || 0} mi
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor((selectedRoute.metrics?.total_duration_minutes || 0) / 60)}h {(selectedRoute.metrics?.total_duration_minutes || 0) % 60}m
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${selectedRoute.metrics?.estimated_cost?.toFixed(2) || 0}
                  </p>
                </div>
              </div>

              {/* Optimization Score Breakdown */}
              {selectedRoute.optimization_score && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Optimization Score</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Distance', score: selectedRoute.optimization_score.distance_score },
                      { label: 'Time', score: selectedRoute.optimization_score.time_score },
                      { label: 'Capacity', score: selectedRoute.optimization_score.capacity_score },
                      { label: 'Time Windows', score: selectedRoute.optimization_score.time_window_score },
                      { label: 'Density', score: selectedRoute.optimization_score.density_score },
                      { label: 'Balance', score: selectedRoute.optimization_score.balance_score },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">{item.label}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.score.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stops List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Stops ({selectedRoute.stops?.length || 0})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedRoute.stops?.map((stop, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {stop.sequence}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{stop.customer_id.substring(0, 12)}</p>
                        <p className="text-sm text-gray-600">
                          {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{stop.planned_arrival || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{stop.planned_duration} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RouteMateRoutes;
