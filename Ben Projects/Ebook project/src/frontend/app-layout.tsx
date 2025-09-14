/**
 * Main Application Layout
 * Root layout component with navigation, authentication, and global providers
 */

// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Hooks and Services
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTheme } from '@/hooks/useTheme';

// Store
import { useAppStore } from '@/store/appStore';

// Types
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Global state
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    mobileMenuOpen, 
    setMobileMenuOpen,
    notifications,
    addNotification
  } = useAppStore();
  
  // WebSocket connection for real-time features
  const { isConnected, connectionStatus } = useWebSocket({
    enabled: isAuthenticated,
    onMessage: (message) => {
      // Handle real-time notifications
      if (message.type === 'notification') {
        addNotification(message.payload);
      }
    }
  });
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if current route requires authentication
  const isPublicRoute = ['/login', '/register', '/forgot-password', '/'].includes(pathname);
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(pathname);
  
  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [setMobileMenuOpen]);
  
  // Handle authentication and routing
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated && isAuthRoute) {
        router.push('/app/dashboard');
      }
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, isPublicRoute, isAuthRoute, router]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      
      // Toggle theme with Ctrl/Cmd + Shift + T
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }
      
      // Close mobile menu with Escape
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen, toggleTheme, mobileMenuOpen, setMobileMenuOpen]);
  
  // Show loading spinner during initial load
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Public routes (landing page, auth pages)
  if (isPublicRoute) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white'
            }}
          />
        </div>
      </ErrorBoundary>
    );
  }
  
  // Authenticated app layout
  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* Mobile Navigation Overlay */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileNav 
                  user={user}
                  subscription={subscription}
                  onClose={() => setMobileMenuOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar 
              isOpen={sidebarOpen}
              user={user}
              subscription={subscription}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
          
          {/* Main Content Area */}
          <div className={`
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}
          `}>
            {/* Header */}
            <Header
              user={user}
              subscription={subscription}
              onMenuClick={() => setMobileMenuOpen(true)}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
              isMobile={isMobile}
              connectionStatus={connectionStatus}
            />
            
            {/* Page Content */}
            <main className="min-h-screen pt-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 sm:p-6 lg:p-8"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          
          {/* Global Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                color: theme === 'dark' ? '#f9fafb' : '#111827',
                border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
              }
            }}
          />
          
          {/* Connection Status Indicator */}
          {isAuthenticated && (
            <div className="fixed bottom-4 right-4 z-40">
              <AnimatePresence>
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
                  >
                    Reconnecting...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {/* Subscription Status Banner */}
          {subscription && subscription.status === 'past_due' && (
            <div className="fixed top-16 left-0 right-0 z-30 bg-red-500 text-white p-3 text-center">
              <p className="text-sm">
                Your payment is past due. Please update your payment method to continue using the platform.
                <button 
                  onClick={() => router.push('/app/settings/billing')}
                  className="ml-2 underline hover:no-underline"
                >
                  Update Payment
                </button>
              </p>
            </div>
          )}
          
          {/* Trial Ending Banner */}
          {subscription && subscription.status === 'trialing' && subscription.trialEnd && (
            (() => {
              const daysLeft = Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 3) {
                return (
                  <div className="fixed top-16 left-0 right-0 z-30 bg-blue-500 text-white p-3 text-center">
                    <p className="text-sm">
                      Your free trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
                      <button 
                        onClick={() => router.push('/app/settings/billing')}
                        className="ml-2 underline hover:no-underline"
                      >
                        Choose a Plan
                      </button>
                    </p>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;