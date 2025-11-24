"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="md:m-6 pt-5 px-4 md:px-6 lg:px-8 pb-20">
        <>{children}</>
      </main>
    </div>
  );
}
