import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AppsPage = () => {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState(null);

  const apps = [
    {
      id: 'tms',
      name: 'Transportation Management System',
      tagline: 'Complete Fleet & Logistics Solution',
      description: 'Manage your entire fleet operations with real-time tracking, order management, and comprehensive analytics. Perfect for trucking companies, fleet owners, and logistics providers.',
      icon: 'fa-truck',
      color: 'blue',
      features: [
        'Real-time GPS Tracking',
        'Order & Booking Management',
        'Fleet & Equipment Management',
        'Driver Management',
        'AI-Powered Rate Confirmation',
        'Live Location Tracking with Maps',
        'Automated Notifications',
        'Comprehensive Reporting'
      ],
      pricing: '$299/month',
      popular: true,
      route: '/dashboard'
    },
    {
      id: 'heavy-tms',
      name: 'Heavy Transportation Management System',
      tagline: 'Specialized Heavy Haul Operations',
      description: 'Purpose-built for oversized loads, heavy equipment hauling, and specialized transportation with permit management and route planning.',
      icon: 'fa-truck-monster',
      color: 'orange',
      features: [
        'Oversized Load Management',
        'Permit Tracking & Management',
        'Route Planning for Heavy Loads',
        'Equipment Specifications',
        'Weight & Dimension Tracking',
        'Specialized Documentation'
      ],
      pricing: '$399/month',
      popular: false,
      comingSoon: true
    },
    {
      id: 'broker',
      name: 'Broker Management System',
      tagline: 'Freight Brokerage Platform',
      description: 'Streamline freight brokerage operations with carrier management, load matching, and automated workflows for brokers and freight forwarders.',
      icon: 'fa-handshake',
      color: 'green',
      features: [
        'Carrier Network Management',
        'Load Board Integration',
        'Automated Load Matching',
        'Rate Management',
        'Invoice & Payment Processing',
        'Customer Portal'
      ],
      pricing: '$349/month',
      popular: false,
      comingSoon: true
    },
    {
      id: 'dispatch',
      name: 'Dispatch Management System',
      tagline: 'Intelligent Dispatch Operations',
      description: 'Optimize dispatching with real-time load assignment, driver communication, and route optimization for maximum efficiency.',
      icon: 'fa-route',
      color: 'purple',
      features: [
        'Real-time Dispatch Board',
        'Load Assignment & Optimization',
        'Driver Communication',
        'Route Optimization',
        'ETA Tracking',
        'Performance Analytics'
      ],
      pricing: '$279/month',
      popular: false,
      comingSoon: true
    },
    {
      id: 'freight',
      name: 'Freight Management System',
      tagline: 'End-to-End Freight Operations',
      description: 'Complete freight management solution covering shipment tracking, carrier selection, documentation, and freight audit & payment.',
      icon: 'fa-boxes',
      color: 'indigo',
      features: [
        'Shipment Tracking & Visibility',
        'Multi-Modal Transportation',
        'Carrier Selection & Rating',
        'BOL & Documentation',
        'Freight Audit & Payment',
        'Analytics & Reporting'
      ],
      pricing: '$329/month',
      popular: false,
      comingSoon: true
    },
    {
      id: 'vehicle',
      name: 'Vehicle Management System',
      tagline: 'Complete Fleet Maintenance & Asset Management',
      description: 'Comprehensive vehicle lifecycle management including maintenance scheduling, inspections, fuel management, and asset tracking.',
      icon: 'fa-tools',
      color: 'cyan',
      features: [
        'Preventive Maintenance Scheduling',
        'Vehicle Inspections (DVIR)',
        'Fuel Management & Tracking',
        'Service History & Records',
        'Asset Lifecycle Management',
        'Cost Analysis & Reporting'
      ],
      pricing: '$249/month',
      popular: false,
      comingSoon: true
    },
    {
      id: 'safety',
      name: 'Safety and Compliance System',
      tagline: 'DOT Compliance & Safety Management',
      description: 'Ensure full regulatory compliance with DOT, FMCSA, and safety regulations. Manage driver qualifications, HOS, drug testing, and safety programs.',
      icon: 'fa-shield-alt',
      color: 'red',
      features: [
        'DOT/FMCSA Compliance Tracking',
        'Driver Qualification Files (DQF)',
        'Hours of Service (HOS) Management',
        'Drug & Alcohol Testing Programs',
        'Safety Training & Certifications',
        'Accident & Incident Reporting'
      ],
      pricing: '$199/month',
      popular: false,
      comingSoon: true
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      red: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[color] || colors.blue;
  };

  const handleAppClick = (app) => {
    if (app.comingSoon) {
      setSelectedApp(app);
    } else {
      navigate(app.route);
    }
  };

  return (
    <div className="min-h-screen bg-card">
      {/* Header with Logo */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_supplylinker/artifacts/c5dzns89_Integrated%20-%20Emblem.jpg" 
                alt="Integrated Supply Chain Solutions" 
                className="h-16 w-16 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Integrated Supply Chain Solutions LLC
                </h1>
                <p className="text-gray-600">Enterprise Supply Chain Software Solutions</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Modular Supply Chain Solutions
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Choose the apps that fit your business needs. Pay only for what you use.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge className="bg-white text-blue-700 px-4 py-2 text-lg">
              <i className="fas fa-check-circle mr-2"></i>
              No Long-term Contracts
            </Badge>
            <Badge className="bg-white text-blue-700 px-4 py-2 text-lg">
              <i className="fas fa-sync mr-2"></i>
              Cancel Anytime
            </Badge>
            <Badge className="bg-white text-blue-700 px-4 py-2 text-lg">
              <i className="fas fa-headset mr-2"></i>
              24/7 Support
            </Badge>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Our Application Suite
          </h3>
          <p className="text-xl text-gray-600">
            Select individual apps or combine them for a complete solution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apps.map((app) => (
            <Card 
              key={app.id} 
              className={`relative hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
                app.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'
              }`}
              onClick={() => handleAppClick(app)}
            >
              {app.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
                    <i className="fas fa-star mr-1"></i>
                    ACTIVE
                  </Badge>
                </div>
              )}
              
              {app.comingSoon && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gray-600 text-white">
                    Coming Soon
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-16 h-16 rounded-full ${getColorClasses(app.color)} flex items-center justify-center mb-4`}>
                  <i className={`fas ${app.icon} text-3xl`}></i>
                </div>
                <CardTitle className="text-xl mb-2">{app.name}</CardTitle>
                <CardDescription className="text-base font-semibold text-gray-700">
                  {app.tagline}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 mb-4 min-h-[60px]">
                  {app.description}
                </p>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {app.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <i className="fas fa-check text-foreground mr-2 mt-1"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {app.features.length > 4 && (
                      <li className="text-sm text-gray-500 italic">
                        + {app.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-gray-900">{app.pricing}</span>
                    <span className="text-sm text-gray-500">per month</span>
                  </div>
                  
                  {app.comingSoon ? (
                    <Button className="w-full bg-gray-400 hover:bg-gray-500" disabled>
                      <i className="fas fa-clock mr-2"></i>
                      Notify Me
                    </Button>
                  ) : (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-arrow-right mr-2"></i>
                      Launch App
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 text-white py-16 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Need a Custom Solution?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            We can tailor our applications to meet your specific business requirements
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <i className="fas fa-phone mr-2"></i>
              Schedule a Demo
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
              <i className="fas fa-envelope mr-2"></i>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2025 Integrated Supply Chain Solutions LLC. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            Enterprise Software Solutions for Modern Supply Chains
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppsPage;
