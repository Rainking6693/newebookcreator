import React from 'react';
import { X, Home, BookOpen, Settings, User, CreditCard } from 'lucide-react';

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

interface MobileNavProps {
  onClose: () => void;
  user?: User | null;
  subscription?: Subscription | null;
}

const MobileNav: React.FC<MobileNavProps> = ({ onClose, user, subscription }) => {

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <a 
            href="#" 
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </a>
          <a 
            href="#" 
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            My Ebooks
          </a>
          <a 
            href="#" 
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            Subscription
          </a>
          <a 
            href="#" 
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <User className="h-5 w-5 mr-3" />
            Profile
          </a>
          <a 
            href="#" 
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </a>
        </nav>
      </div>
    </div>
  );
};

export default MobileNav;