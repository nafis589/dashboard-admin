import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  badge?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const VENDORS_URL = '/vendors';

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: 'Tableau de bord',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: 'Gestion',
    items: [
      {
        title: 'Vendeurs',
        url: VENDORS_URL,
        icon: Store,
        badge: true,
      },
      {
        title: 'Produits',
        url: '/products',
        icon: Package,
      },
      {
        title: 'Commandes',
        url: '/orders',
        icon: ShoppingBag,
      },
      {
        title: 'Utilisateurs',
        url: '/users',
        icon: Users,
      },
      {
        title: 'Catégories',
        url: '/categories',
        icon: Boxes,
      },
      {
        title: 'Statistiques',
        url: '/stats',
        icon: BarChart3,
      },
    ],
  },
];
