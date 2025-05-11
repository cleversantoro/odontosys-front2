// src/App.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

interface NavSubItem {
  id: number;
  name: string;
  path: string;
  is_pro: boolean;
  is_new: boolean;
}

interface NavItem {
  id: number;
  name: string;
  icon: string;
  path: string | null;
  subItems?: NavSubItem[];
}

function Config() {
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    axios.get('http://localhost:5000/navitems')
      .then(res => setNavItems(res.data))
      .catch(err => console.error('Erro ao buscar menus:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Menu de Navegação</h1>
      <ul className="space-y-4">
        {navItems.map((item) => (
          <li key={item.id} className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <span className="font-semibold">{item.icon}</span>
                <span className="text-lg font-medium">{item.name}</span>
              </div>
              {item.path && <a href={item.path} className="text-blue-500 hover:underline">Ir</a>}
            </div>

            {item.subItems && item.subItems.length > 0 && (
              <ul className="mt-3 pl-4 border-l-2 border-gray-200">
                {item.subItems.map((sub) => (
                  <li key={sub.id} className="py-1">
                    <div className="flex justify-between">
                      <a href={sub.path} className="text-gray-700 hover:text-blue-600">
                        {sub.name}
                      </a>
                      <div className="flex gap-2">
                        {sub.is_pro && <span className="text-xs bg-yellow-300 text-black px-2 rounded">PRO</span>}
                        {sub.is_new && <span className="text-xs bg-green-500 text-white px-2 rounded">NEW</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Config;
