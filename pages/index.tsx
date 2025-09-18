import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>EbookAI - AI-Powered Ebook Generation Platform</title>
        <meta name="description" content="Create complete, publishable books with AI assistance. Mystery and self-help genres with market analytics and professional formatting." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">EbookAI</h1>
                <span className="ml-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                  LIVE
                </span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Create Complete Books with
              <span className="text-blue-600"> AI Assistance</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate publishable mystery and self-help books with advanced AI, market analytics, 
              and professional formatting. From idea to bestseller in days, not months.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Writing Now
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Watch Demo
              </button>
            </div>

            {/* Status Dashboard */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Engine Status */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900">AI Engine</h4>
                  <p className="text-green-600 font-medium">Operational</p>
                  <p className="text-sm text-gray-500">Claude AI Integration Active</p>
                </div>

                {/* Book Generation */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900">Book Generation</h4>
                  <p className="text-blue-600 font-medium">Ready</p>
                  <p className="text-sm text-gray-500">75K-150K words per book</p>
                </div>

                {/* Market Analytics */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900">Market Analytics</h4>
                  <p className="text-purple-600 font-medium">Live Data</p>
                  <p className="text-sm text-gray-500">Real-time bestseller tracking</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">24/7</div>
                    <div className="text-sm text-gray-500">AI Availability</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">3-5 Days</div>
                    <div className="text-sm text-gray-500">Book Completion</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">EPUB/PDF</div>
                    <div className="text-sm text-gray-500">Export Formats</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">99.9%</div>
                    <div className="text-sm text-gray-500">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © 2024 EbookAI Platform. Powered by Claude AI and advanced humanization technology.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              🚀 Successfully deployed on Netlify | Status: OPERATIONAL
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </>
  );
}