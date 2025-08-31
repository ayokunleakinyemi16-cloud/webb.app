
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  ArrowRightLeft,
  ScanLine,
  Repeat,
  PiggyBank,
  History,
  Users,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Target,
  Building,
  Landmark,
  Library,
  Briefcase,
  GraduationCap,
  FileText,
  PieChart,
} from 'lucide-react';
import { Button } from './ui/button';

function GameztarzIcon({ className }: { className?: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    )
}

const mainMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/transfer', label: 'Transfer', icon: ArrowRightLeft },
    { href: '/dashboard/scan', label: 'Scan & Pay', icon: ScanLine },
    { href: '/dashboard/exchange', label: 'Exchange', icon: Repeat },
    { href: '/dashboard/staking', label: 'Stake', icon: PiggyBank },
    { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard/education', label: 'Education', icon: GraduationCap },
    { href: '/dashboard/budget', label: 'Budget', icon: Target },
    { href: '/dashboard/spending', label: 'Spending', icon: PieChart },
    { href: '/dashboard/housing', label: 'Housing', icon: Building },
    { href: '/dashboard/my-properties', label: 'My Properties', icon: Library },
    { href: '/dashboard/loans', label: 'Loans', icon: Landmark },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/invoice', label: 'Invoice', icon: FileText },
    { href: '/dashboard/payees', label: 'Payees', icon: Users },
];

const accountMenuItems = [
    { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <GameztarzIcon className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">Gameztarz</span>
                <div className="flex-1" />
                <div className="hidden md:block">
                    <SidebarTrigger />
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
            <SidebarMenu>
                {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={state === 'collapsed' ? item.label : undefined}
                            >
                                <span>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
                
                {user?.username === 'testadmin' && (
                    <SidebarMenuItem>
                         <Link href="/dashboard/admin">
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === '/dashboard/admin'}
                                tooltip={state === 'collapsed' ? 'Admin' : undefined}
                            >
                                <span>
                                    <ShieldCheck />
                                    <span>Admin Panel</span>
                                </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                )}

            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-2">
            <SidebarMenu>
                {accountMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={state === 'collapsed' ? item.label : undefined}
                            >
                                <span>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
                 <SidebarMenuItem>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 p-2 h-8 text-sm"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </Button>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </>
  );
}
