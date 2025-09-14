import React from 'react';

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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: User | null;
  subscription?: Subscription | null;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, user, subscription, onToggle }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="p-4">
        <div className="space-y-2">
          <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">
            Dashboard
          </a>
          <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">
            Projects
          </a>
          <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">
            Settings
          </a>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;