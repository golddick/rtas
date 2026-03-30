export default function DepartmentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { department: string }
}) {
  return <>
  <div className=" min-h-screen bg-background">

  {children}
  </div>
  </>
}
 