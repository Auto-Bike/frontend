import '@/styles/global.css'
export const metadata = {
  title: 'control',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
