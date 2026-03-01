import React from 'react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const handleGetStarted = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white">
              Connect Your Fleet with the 
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {" "}Supply Chain
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              The ultimate marketplace connecting manufacturers, fleet owners, and drivers. 
              Streamline equipment rental, fleet management, and real-time tracking in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-4"
                data-testid="get-started-btn"
              >
                <i className="fas fa-rocket mr-2"></i>
                Get Started Today
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
                onClick={() => window.location.href = '/apps'}
              >
                <i className="fas fa-th mr-2"></i>
                Browse Apps
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for fleet owners, manufacturers, and drivers to collaborate efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Transportation Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-truck text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Transportation Management System</h3>
              <p className="text-gray-600 mb-4">
                Complete fleet operations with real-time tracking, order management, and comprehensive analytics.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Real-time GPS tracking</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Order management</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>AI-powered tools</li>
              </ul>
            </div>

            {/* Heavy Transportation Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-truck-monster text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Heavy Transportation Management System</h3>
              <p className="text-gray-600 mb-4">
                Specialized for oversized loads, heavy equipment hauling, and permit management.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Oversized load management</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Permit tracking</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Route planning</li>
              </ul>
            </div>

            {/* Broker Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-handshake text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Broker Management System</h3>
              <p className="text-gray-600 mb-4">
                Streamline freight brokerage with carrier management, load matching, and workflows.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Carrier network</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Load matching</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Rate management</li>
              </ul>
            </div>

            {/* Dispatch Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-route text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Dispatch Management System</h3>
              <p className="text-gray-600 mb-4">
                Optimize dispatching with real-time load assignment and driver communication.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Real-time dispatch</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Load optimization</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>ETA tracking</li>
              </ul>
            </div>

            {/* Freight Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-boxes text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Freight Management System</h3>
              <p className="text-gray-600 mb-4">
                End-to-end freight operations covering shipment tracking and documentation.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Shipment tracking</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Multi-modal transport</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Freight audit</li>
              </ul>
            </div>

            {/* Vehicle Management System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-tools text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Vehicle Management System</h3>
              <p className="text-gray-600 mb-4">
                Complete fleet maintenance including scheduling, inspections, and fuel management.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>Preventive maintenance</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>DVIR inspections</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Fuel tracking</li>
              </ul>
            </div>

            {/* Safety and Compliance System */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-shield-alt text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Safety and Compliance System</h3>
              <p className="text-gray-600 mb-4">
                Ensure full regulatory compliance with DOT, FMCSA, and safety regulations.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><i className="fas fa-check text-red-600 mr-2"></i>DOT/FMCSA compliance</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Driver qualification</li>
                <li><i className="fas fa-check text-red-600 mr-2"></i>Safety programs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Equipment We Support</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From box trucks to specialized equipment, find exactly what you need
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: 'fa-truck', name: 'Box Trucks', type: 'BOX_TRUCK' },
              { icon: 'fa-shuttle-van', name: 'Sprinter Vans', type: 'SPRINTER_VAN' },
              { icon: 'fa-tools', name: 'HVAC Trucks', type: 'HVAC_TRUCK' },
              { icon: 'fa-crane', name: 'Cranes', type: 'CRANE' },
              { icon: 'fa-truck-flatbed', name: 'Flatbed Trucks', type: 'FLATBED_TRUCK' },
              { icon: 'fa-truck-container', name: 'Dry Vans', type: 'DRY_VAN' },
              { icon: 'fa-snowflake', name: 'Reefers', type: 'REEFER' },
              { icon: 'fa-truck-moving', name: 'Big Rigs', type: 'BIG_RIG' },
              { icon: 'fa-forklift', name: 'Forklifts', type: 'FORKLIFT' },
              { icon: 'fa-hard-hat', name: 'Excavators', type: 'EXCAVATOR' }
            ].map((equipment, index) => (
              <div key={equipment.type} className="text-center p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="text-3xl mb-3 text-red-600">
                  <i className={`fas ${equipment.icon}`}></i>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{equipment.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Transform Your Fleet Operations?</h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of fleet owners, manufacturers, and drivers who trust our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-4"
              data-testid="cta-get-started-btn"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
              data-testid="contact-sales-btn"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Fleet Marketplace</h3>
              <p className="text-gray-400">
                Connecting the supply chain through intelligent fleet management and equipment rental solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fleet Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Equipment Rental</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Driver Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Real-time Tracking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Fleet Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;