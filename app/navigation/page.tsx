'use client'

import type { NextPage } from 'next'
import { useState, useEffect } from 'react'
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Autocomplete,
  Libraries,
  DirectionsRenderer,
} from '@react-google-maps/api'
import styles from './page.module.css'
import { log } from 'console'

// Types
interface GPSData {
  latitude: number
  longitude: number
}

interface LatLng {
  lat: number
  lng: number
}

// Constants
const DEFAULT_CENTER: LatLng = {
  lat: 43.259206,
  lng: -79.920806,
}

const CANADA_BOUNDS = {
  north: 83.0956,
  south: 41.6765,
  west: -141.0019,
  east: -52.6363,
}

const AUTOCOMPLETE_OPTIONS = {
  bounds: CANADA_BOUNDS,
  componentRestrictions: { country: 'ca' },
  fields: ['geometry', 'name', 'formatted_address'],
  strictBounds: true,
}

const libraries: Libraries = ['places', 'routes']

const NavigationPage: NextPage = () => {
  const { isLoaded: mapsLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  // Map and Navigation States
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null)
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [destination, setDestination] = useState<LatLng | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER)
  const [isNavigating, setIsNavigating] = useState(false)
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null)

  // Map Services States
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [originSearchBox, setOriginSearchBox] =
    useState<google.maps.places.Autocomplete | null>(null)
  const [destinationSearchBox, setDestinationSearchBox] =
    useState<google.maps.places.Autocomplete | null>(null)
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null)

  // Error and Loading States
  const [error, setError] = useState<string | null>(null)
  const [failureCount, setFailureCount] = useState(0)
  const [isFetchingStopped, setIsFetchingStopped] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Fetch GPS location
  useEffect(() => {
    // Set default bike location
    const defaultBikeLocation = {
      lat: 43.259206,
      lng: -79.920806,
    }
    setCurrentLocation(defaultBikeLocation)
    setMapCenter(defaultBikeLocation)
  }, []) // Empty dependency array means this runs once on mount

  // Map initialization
  const onMapLoad = (map: google.maps.Map) => {
    setIsMapLoaded(true)
    setMapInstance(map)
    setDirectionsService(new window.google.maps.DirectionsService())
    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      map: map,
    })
    setDirectionsRenderer(renderer)

    map.addListener('click', handleMapClick)
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return

    const clickedLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    }

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode(
      { location: clickedLocation },
      (
        results: google.maps.GeocoderResult[] | null,
        status: google.maps.GeocoderStatus
      ) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          const input =
            document.querySelector<HTMLInputElement>('.destinationInput')
          if (input) {
            input.value = address
          }
          setDestination(clickedLocation)
        }
      }
    )
  }

  // Send navigation data to backend
  const sendNavigation = async () => {
    if (!origin || !destination) {
      setError('Origin and destination are required')
      return false
    }

    try {
      const response = await fetch('https://3.15.51.67/send-navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: {
            lat: origin.lat,
            lon: origin.lng,
          },
          destination: {
            lat: destination.lat,
            lon: destination.lng,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send navigation data')
      }

      return true
    } catch (err) {
      console.error('Error sending navigation:', err)
      setError('Failed to start navigation')
      return false
    }
  }

  // Add this helper function to sleep
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  // Add this simulation function
  const simulateBikeMovement = async () => {
    console.log('test')
    console.log(currentLocation, isNavigating)

    // Simulate movement for 100 steps (about 1.6 minutes)
    for (let i = 0; i < 13 && isNavigating; i++) {
      setCurrentLocation((prevLocation) => {
        if (!prevLocation) return prevLocation
        const newLocation = {
          ...prevLocation,
          lng: prevLocation.lng - 0.00005,
        }
        console.log('New bike location:', newLocation)
        return newLocation
      })

      await sleep(1000)
    }
    for (let i = 0; i < 5 && isNavigating; i++) {
      setCurrentLocation((prevLocation) => {
        if (!prevLocation) return prevLocation
        const newLocation = {
          ...prevLocation,
          lat: prevLocation.lat - 0.000035,
        }
        console.log('New bike location:', newLocation)
        return newLocation
      })

      await sleep(1000)
    }
    alert('Navigation complete! Enjoy the ride!')
    setIsNavigating(false)
    setOrigin(null)
    setDestination(null)
    setDirections(null)
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
    }
    setError(null)
  }

  // Modify the navigation button click handler
  const startNavigation = () => {
    // Removed async since we don't need it
    setIsNavigating(true)
    // Use useEffect to watch for isNavigating changes
  }

  // Add this useEffect to start simulation when isNavigating changes
  useEffect(() => {
    if (isNavigating) {
      simulateBikeMovement()
    }
  }, [isNavigating])

  // Navigation functions
  const showRoute = () => {
    if (!origin || !destination) {
      setError('Please select both starting point and destination')
      return
    }
    if (!directionsService || !directionsRenderer || !mapInstance) {
      setError('Map services not initialized')
      return
    }

    setError(null)
    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.BICYCLING,
      })
      .then((result) => {
        setDirections(result)
        if (directionsRenderer) {
          directionsRenderer.setMap(null)
          directionsRenderer.setMap(mapInstance)
          directionsRenderer.setDirections(result)
        }
      })
      .catch((error) => {
        console.error('Error fetching directions:', error)
        setError('Error calculating route')
      })
  }

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
    }
    setDirections(null)
    setError(null)
    if (isNavigating) {
      setIsNavigating(false)
    }
  }

  const useCurrentLocationAsStart = () => {
    if (!isMapLoaded) return

    const defaultLocation = {
      lat: 43.259206,
      lng: -79.920806,
    }

    // Update both current location and origin
    setCurrentLocation(defaultLocation)

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode(
      { location: defaultLocation },
      (
        results: google.maps.GeocoderResult[] | null,
        status: google.maps.GeocoderStatus
      ) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          const input = document.querySelector<HTMLInputElement>('.originInput')
          if (input) {
            input.value = address
          }
          setOrigin(currentLocation)
        } else {
          setError('Could not find address for current location')
        }
      }
    )
  }

  const centerOnCurrentLocation = () => {
    const defaultLocation = {
      lat: 43.259206,
      lng: -79.920806,
    }
    setCurrentLocation(defaultLocation)
    setMapCenter(defaultLocation)
  }

  // Add this new function after useCurrentLocationAsStart
  const useCurrentLocationAsDestination = () => {
    if (!isMapLoaded) return

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const browserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode(
            { location: browserLocation },
            (
              results: google.maps.GeocoderResult[] | null,
              status: google.maps.GeocoderStatus
            ) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address
                const input =
                  document.querySelector<HTMLInputElement>('.destinationInput')
                if (input) {
                  input.value = address
                }
                setDestination(browserLocation)
              } else {
                setError('Could not find address for current location')
              }
            }
          )
        },
        (error) => {
          setError('Error getting your location: ' + error.message)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  // Autocomplete handlers
  const onOriginLoad = (autocomplete: google.maps.places.Autocomplete) =>
    setOriginSearchBox(autocomplete)
  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) =>
    setDestinationSearchBox(autocomplete)

  const onOriginChanged = () => {
    if (originSearchBox) {
      const place = originSearchBox.getPlace()
      if (place.geometry?.location) {
        setOrigin({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }
    }
  }

  const onDestinationChanged = () => {
    if (destinationSearchBox) {
      const place = destinationSearchBox.getPlace()
      if (place.geometry?.location) {
        setDestination({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }
    }
  }

  const markerIcon = (url: string) => ({
    url,
    scaledSize: new window.google.maps.Size(30, 30),
    anchor: new window.google.maps.Point(15, 15),
  })

  if (loadError) return <div>Error loading maps</div>
  if (!mapsLoaded) return <div>Loading maps...</div>

  return (
    <div className={styles.navigationContainer}>
      <div className={styles.navigationHeader}>
        <h1 className={styles.title}>Auto Bike Sharing Map</h1>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.navigationContent}>
        <div className={styles.searchContainer}>
          <div className={styles.inputWithButton}>
            <Autocomplete
              onLoad={onOriginLoad}
              onPlaceChanged={onOriginChanged}
              options={AUTOCOMPLETE_OPTIONS}>
              <input
                type="text"
                placeholder="Enter starting point"
                className={`${styles.searchInput} originInput`}
                onChange={(e) => !e.target.value && setOrigin(null)}
              />
            </Autocomplete>
            <button
              onClick={useCurrentLocationAsStart}
              className={styles.useLocationButton}
              title="Use current GPS location">
              <span className={styles.desktopOnly}>🚲 Find Nearest Bike</span>
              <span className={styles.mobileOnly}>🚲</span>
            </button>
          </div>
          <div className={styles.inputWithButton}>
            <Autocomplete
              onLoad={onDestinationLoad}
              onPlaceChanged={onDestinationChanged}
              options={AUTOCOMPLETE_OPTIONS}>
              <input
                type="text"
                placeholder="Enter destination"
                className={`${styles.searchInput} destinationInput`}
                onChange={(e) => !e.target.value && setDestination(null)}
              />
            </Autocomplete>
            <button
              onClick={useCurrentLocationAsDestination}
              className={styles.useLocationButton}
              title="Use current browser location">
              <span className={styles.desktopOnly}>📍 Locate me</span>
              <span className={styles.mobileOnly}>📍</span>
            </button>
            <button
              onClick={showRoute}
              className={styles.routeButton}
              disabled={!origin || !destination}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}>
                <path d="M3 12h18M3 12l4-4m-4 4l4 4" />
              </svg>
              Directions
            </button>
            <button
              onClick={startNavigation}
              className={`${styles.navigateButton} ${
                isNavigating ? styles.navigating : ''
              }`}
              disabled={!directions || isNavigating}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
                style={{ marginRight: '6px' }}>
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
              {isNavigating ? 'Navigating...' : 'Start Navigation'}
            </button>
          </div>
        </div>
        <div className={styles.mapContainer}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '600px' }}
            center={mapCenter}
            zoom={13}
            onLoad={onMapLoad}>
            {isMapLoaded && currentLocation && (
              <Marker
                position={currentLocation}
                icon={markerIcon('/bike-location.svg')}
              />
            )}
            {isMapLoaded && origin && (
              <Marker
                position={origin}
                icon={markerIcon('/current-location.svg')}
              />
            )}
            {isMapLoaded && destination && (
              <Marker
                position={destination}
                icon={markerIcon('/destination.svg')}
              />
            )}
            {isMapLoaded && directions && directionsRenderer && (
              <DirectionsRenderer
                options={{
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
          <button
            onClick={centerOnCurrentLocation}
            className={styles.mapCenterButton}
            title="Center on current location">
            <span className={styles.centerIcon}>⌖</span>
          </button>
          {directions && directions.routes[0]?.legs[0] && (
            <div className={styles.directionsInfo}>
              <button onClick={clearRoute} className={styles.closeButton}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <p>
                Total Distance: {directions.routes[0].legs[0].distance?.text}
              </p>
              <p>
                Estimated Time: {directions.routes[0].legs[0].duration?.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NavigationPage
