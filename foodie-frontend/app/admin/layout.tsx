import Link from "next/link";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Menu as MenuIcon, 
  CalendarDays, 
  Users, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-[#0f1012] text-[#f9fafb]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#16181d] border-r border-white/5 shadow-xl hidden md:flex flex-col">
          {/* ... sidebar content ... */}
          <div className="p-6 border-b border-white/5">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-[#ff7642]">
              <UtensilsCrossed className="h-6 w-6" />
              <span>Foodie Admin</span>
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem href="/admin/experiences" icon={<UtensilsCrossed size={20} />} label="Experiences" />
            <NavItem href="/admin/menus" icon={<MenuIcon size={20} />} label="Menus" />
            <NavItem href="/admin/bookings" icon={<CalendarDays size={20} />} label="Bookings" />
            <NavItem href="/admin/chefs" icon={<Users size={20} />} label="Chefs" />
            <NavItem href="/admin/users" icon={<Users size={20} />} label="Users" />
            <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
          </nav>

          <div className="p-4 border-t border-white/5">
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1012]">
          <header className="bg-[#16181d] border-b border-white/5 p-4 flex items-center justify-between md:hidden">
             <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-[#ff7642]">
              <UtensilsCrossed className="h-6 w-6" />
              <span>Foodie Admin</span>
            </Link>
          </header>

          <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-[#cbd5f5] rounded-lg hover:bg-[#ff7642]/10 hover:text-[#ff7642] transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
console.log("AdminLayout");
