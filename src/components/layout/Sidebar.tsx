'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard,
  MapPin,
  Store,
  Package,
  Users,
  Truck,
  ShoppingCart,
  TrendingDown,
  Landmark,
  Building2,
  ChefHat,
  Warehouse,
} from 'lucide-react';

const navigationBase = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, adminOnly: false },
  { name: 'Commandes', href: '/commandes', icon: ShoppingCart, adminOnly: false },
  { name: 'Finance', href: '/finance', icon: Landmark, adminOnly: false },
  { name: 'Stock', href: '/stock', icon: Warehouse, adminOnly: false },
  { name: 'Depenses', href: '/depenses', icon: TrendingDown, adminOnly: false },
  { name: 'Recettes', href: '/recettes', icon: ChefHat, adminOnly: false },
  { name: 'Gerants', href: '/gerants', icon: Building2, adminOnly: true },
  { name: 'Zones', href: '/zones', icon: MapPin, adminOnly: false },
  { name: 'Types de PDV', href: '/types-pdv', icon: Store, adminOnly: false },
  { name: 'Produits', href: '/produits', icon: Package, adminOnly: false },
  { name: 'Clients', href: '/clients', icon: Users, adminOnly: false },
  { name: 'Livreurs', href: '/livreurs', icon: Truck, adminOnly: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.utilisateur?.role ?? 'GERANT';

  const navigation = navigationBase.filter((item) => {
    if (item.adminOnly && role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}