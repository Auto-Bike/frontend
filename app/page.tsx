import Image from 'next/image'
import { Suspense } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<p>Loading ...</p>}>
        <nav className={styles.nav}>
          <Link href="/control" className={styles.link}>
            Bike Control
          </Link>
          <Link
            href="/map"
            style={{ backgroundColor: '#69b71e' }}
            className={styles.link}>
            Map
          </Link>
          <Link
            href="/navigation"
            style={{ backgroundColor: 'rgb(193 154 44)' }}
            className={styles.link}>
            Navigation
          </Link>
        </nav>
      </Suspense>
    </main>
  )
}
