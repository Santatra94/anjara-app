'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  MoreHorizontal,
  Package,
  MapPin,
  Store,
  LogOut,
  X,
  Route,
  TrendingDown,
  Landmark,
  Building2,
  ChefHat,
  Warehouse,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Commandes', href: '/commandes', icon: ShoppingCart },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Livreurs', href: '/livreurs', icon: Truck },
];

const menuPlusBase = [
  { name: 'Finance', href: '/finance', icon: Landmark, adminOnly: false },
  { name: 'Stock', href: '/stock', icon: Warehouse, adminOnly: false },
  { name: 'Depenses', href: '/depenses', icon: TrendingDown, adminOnly: false },
  { name: 'Recettes', href: '/recettes', icon: ChefHat, adminOnly: false },
  { name: 'Gerants', href: '/gerants', icon: Building2, adminOnly: true },
  { name: 'Tournee du jour', href: '/tournee-admin', icon: Route, adminOnly: false },
  { name: 'Produits', href: '/produits', icon: Package, adminOnly: false },
  { name: 'Zones', href: '/zones', icon: MapPin, adminOnly: false },
  { name: 'Types de PDV', href: '/types-pdv', icon: Store, adminOnly: false },
];

export function BottomNavAdmin() {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { user, signOut } = useAuth();
  const role = user?.utilisateur?.role ?? 'GERANT';

  const menuPlus = menuPlusBase.filter((item) => {
    if (item.adminOnly && role !== 'ADMIN') return false;
    return true;
  });

  const handleLogout = async () => {
    await signOut();
  };

  const fermerMenu = () => {
    setMenuOuvert(false);
  };

  const ouvrirMenu = () => {
    setMenuOuvert(true);
  };

  return (
    <>
      {menuOuvert && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={fermerMenu} />
      )}

      {menuOuvert && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between p-4 border-b">
            <p className="text-sm font-bold uppercase text-gray-500">Plus</p>
            <button onClick={fermerMenu} className="p-1">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="p-2">
            {menuPlus.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={fermerMenu}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50',
                    isActive && 'bg-blue-50'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isActive ? 'bg-blue-600' : 'bg-blue-50'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isActive ? 'text-white' : 'text-blue-600'
                    )} />
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-blue-600 font-bold' : 'text-gray-900'
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-red-50"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">Deconnexion</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-1 z-30 md:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          onClick={ouvrirMenu}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
            menuOuvert ? 'text-blue-600' : 'text-gray-400'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Plus</span>
        </button>
      </nav>
    </>
  );
}