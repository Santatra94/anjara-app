'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Truck,
  Wallet,
  Users,
  History
} from 'lucide-react';

const navigation = [
  { name: 'Tournée', href: '/tournee', icon: Truck },
  { name: 'Caisse', href: '/caisse', icon: Wallet },
  { name: 'Clients', href: '/mes-clients', icon: Users },
  { name: 'Histo.', href: '/historique', icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 z-50 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
