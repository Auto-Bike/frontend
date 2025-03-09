'use client'

import { useEffect, useState, useRef } from 'react'
import styles from './page.module.css'
import dynamic from 'next/dynamic'
import { log } from 'node:console'

// Dynamically import the map component
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

// API endpoint
const LOCATION_API_ENDPOINT = 'http://localhost:8000/latest-gps/bike1'

export default function NavigationPage() {
  const [position, setPosition] = useState({ lat: 51.505, lng: -0.09 })
  const [destination, setDestination] = useState<{
    lat: number | null
    lng: number | null
  }>({ lat: null, lng: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showDestination, setShowDestination] = useState(false)
  const [formValues, setFormValues] = useState({ lat: '', lng: '' })

  useEffect(() => {
    // Function to fetch location data
    const fetchLocation = async () => {
      try {
        const response = await fetch(LOCATION_API_ENDPOINT)
        if (!response.ok) {
          throw new Error('Failed to fetch location data')
        }
        const data = await response.json()
        // console.log({ lat: data.latitude, lng: data.longitude })

        setPosition({ lat: data.latitude, lng: data.longitude })
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error fetching location:', err)
        setError(err.message || 'An error occurred')
        setIsLoading(false)
      }
    }

    // Fetch location immediately on component mount
    fetchLocation()

    // Set up interval to fetch location every second
    intervalRef.current = setInterval(fetchLocation, 1000)

    // Clean up interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDestinationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Only update destination and show it if both values are valid
    if (formValues.lat && formValues.lng) {
      const newDestination = {
        lat: parseFloat(formValues.lat),
        lng: parseFloat(formValues.lng),
      }
      setDestination(newDestination)
      setShowDestination(true)
    }
  }

  if (isLoading) {
    return <div className={styles.container}>Loading location data...</div>
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>
  }

  return (
    <div className={styles.container}>
      <h1>Map</h1>

      <form onSubmit={handleDestinationSubmit} className={styles.form}>
        <div>
          <label htmlFor="lat">Destination Latitude:</label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="0.00001"
            value={formValues.lat}
            onChange={handleInputChange}
            placeholder="Enter latitude"
          />
        </div>
        <div>
          <label htmlFor="lng">Destination Longitude:</label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="0.00001"
            value={formValues.lng}
            onChange={handleInputChange}
            placeholder="Enter longitude"
          />
        </div>
        <button type="submit">Set Destination</button>
      </form>

      <div className={styles.mapContainer}>
        <LeafletMap
          position={position}
          destinationPosition={destination}
          showDestination={showDestination}
        />
      </div>

      <div className={styles.coordinates}>
        Current Position: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
      </div>
    </div>
  )
}
