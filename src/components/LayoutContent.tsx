'use client';
import { usePathname } from 'next/navigation';

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar removed from here because page.tsx handles it now! */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}