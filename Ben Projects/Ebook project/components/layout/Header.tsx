import React from 'react';
import { Menu, User, Settings, Bell } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Subscription {
  id: string;
  name: string;
  price: number;
}

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  user?: User | null;
  subscription?: Subscription | null;
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
  isMobile?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  title = "AI Ebook Platform", 
  user, 
  subscription, 
  onSidebarToggle, 
  sidebarOpen, 
  isMobile, 
  connectionStatus 
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <h1 className="ml-4 text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;