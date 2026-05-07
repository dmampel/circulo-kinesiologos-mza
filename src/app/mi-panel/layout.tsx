import Sidebar from "@/components/socio/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-50 overflow-y-auto">
      <Sidebar />
      <main className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-6xl h-full py-5 px-5">{children}</div>
      </main>
    </div>
  );
}
