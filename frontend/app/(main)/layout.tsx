import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
