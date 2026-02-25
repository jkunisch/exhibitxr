import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { 
  LayoutDashboard, 
  Box, 
  BarChart3, 
  CreditCard,
  User,
  Settings
} from "lucide-react";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  const navLinks = [
    { href: "/dashboard", label: "Studio", icon: LayoutDashboard },
    { href: "/dashboard/exhibitions", label: "Modelle", icon: Box },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#050505] text-white selection:bg-white/20">
      {/* Background Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none -z-10 opacity-50" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,170,255,0.03)_0%,transparent_70%)] pointer-events-none -z-10" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-8">
        
        {/* Fancy Top Navigation / Header */}
        <header className="rounded-[2.5rem] border border-white/5 bg-zinc-900/10 px-8 py-6 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-black tracking-tighter">
                3D-SNAP<span className="text-zinc-700 italic">.studio</span>
              </Link>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <div className="hidden flex-col sm:flex">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tenant Workspace</span>
                <span className="text-xs font-bold text-zinc-300">{sessionUser.tenantId}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 rounded-full bg-white/5 border border-white/5 px-4 py-2 sm:flex">
                <User size={14} className="text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">{sessionUser.email}</span>
              </div>
              <SignOutButton />
            </div>
          </div>

          <nav className="mt-8 flex flex-wrap gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 rounded-full border border-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-white/5 hover:text-white"
                >
                  <Icon size={14} className="group-hover:scale-110 transition-transform" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="min-h-[60vh]">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
          <span>&copy; 2026 ExhibitXR Studio</span>
          <div className="flex gap-6">
            <Link href="/was-ist-3d-snap" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
