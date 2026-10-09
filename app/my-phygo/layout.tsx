import PortalNavbar from '@/components/PortalNavbar'

export default function MyPhygoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#f6f7f9] dark:bg-[#08090b] transition-colors">
      <PortalNavbar />
      {children}
    </div>
  )
}
