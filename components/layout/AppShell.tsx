import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
}

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white">
      {title && (
        <header className="sticky top-0 bg-white border-b border-gray-100 z-40 px-4 py-4">
          <h1 className="text-lg font-bold text-center">{title}</h1>
        </header>
      )}
      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
