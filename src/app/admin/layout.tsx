"use client";

import { useState } from "react";
import { AdminSidebar } from '@/app/admin/components/layout/AdminSidebar';
import { AdminHeader } from '@/app/admin/components/layout/AdminHeader';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="md:ml-64 pt-20 px-4 md:px-6 lg:px-8 pb-8">
        <>{children}</>
      </main>
    </div>
  );
}
