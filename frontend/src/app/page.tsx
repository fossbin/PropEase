import Link from 'next/link';
import { Search, MapPin, Home, Building2, Users, Star, TrendingUp, Shield, Clock, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Home
              </span>
            </h1>
            {/* <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Discover thousands of properties for rent, sale, and PG accommodations. 
              Your dream home is just a click away.
            </p> */}
            
            {/* Search Bar */}
            {/* <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Enter location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <select className="px-4 py-3 border border-gray-200 rounded-lg  text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                    <option>Property Type</option>
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Commercial</option>
                    <option>PG/Hostel</option>
                  </select>
                  <select className="px-4 py-3 border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                    <option>Budget Range</option>
                    <option>₹10k - ₹25k</option>
                    <option>₹25k - ₹50k</option>
                    <option>₹50k - ₹1L</option>
                    <option>₹1L+</option>
                  </select>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Property Options
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're looking to buy, rent, or find a PG, we have the perfect match for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all p-8 text-center hover:border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                <Home className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Buy Property</h3>
              <p className="text-gray-600 mb-6">
                Find your dream home from our extensive collection of apartments, villas, and independent houses.
              </p>
              <Link 
                href="/properties"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
              >
                Browse Properties <TrendingUp className="ml-2 w-4 h-4" />
              </Link>
            </div>
            
            <div className="group bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all p-8 text-center hover:border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                <Building2 className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rent Property</h3>
              <p className="text-gray-600 mb-6">
                Discover rental properties that fit your budget and lifestyle. From studios to family homes.
              </p>
              <Link 
                href="/rent"
                className="inline-flex items-center text-green-600 font-semibold hover:text-green-700"
              >
                View Rentals <TrendingUp className="ml-2 w-4 h-4" />
              </Link>
            </div>
            
            <div className="group bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all p-8 text-center hover:border-orange-200">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 transition-colors">
                <Users className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">PG & Hostels</h3>
              <p className="text-gray-600 mb-6">
                Find comfortable paying guest accommodations and hostels perfect for students and professionals.
              </p>
              <Link 
                href="/pg"
                className="inline-flex items-center text-orange-500 font-semibold hover:text-orange-600"
              >
                Find PG <TrendingUp className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why PropEase?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your trusted partner in finding the perfect property with unmatched service and support
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verified Properties</h3>
              <p className="text-gray-600">
                All properties are verified and authenticated for your safety and peace of mind.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Response</h3>
              <p className="text-gray-600">
                Get instant responses and connect with property owners within minutes.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Expert Support</h3>
              <p className="text-gray-600">
                Our property experts are here to guide you through every step of your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your Dream Property?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who found their perfect home with PropEase
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <button className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>List Your Property</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}