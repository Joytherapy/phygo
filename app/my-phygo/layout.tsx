import PortalNavbar from '@/components/PortalNavbar'

export default function MyPhygoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
      <PortalNavbar />
      {children}
    </div>
  )
}
