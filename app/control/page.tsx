'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

//To do
// Turn Right, Turn Left logic control, probably need another angle control

export default function ControlPage() {
  const [status, setStatus] = useState('Disconnected')
  const [speed, setSpeed] = useState(50) // Speed control
  const backendUrl = 'http://3.15.51.67' // Change to your actual backend IP
  const inactivityTimeout = 30 * 1000 // 30 seconds timeout
  let inactivityTimer: NodeJS.Timeout | null = null

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      console.log('No actions detected for 30s. Disconnecting...')
      setStatus('Disconnected')
    }, inactivityTimeout)
  }

  // Function to send commands to the backend
  const sendCommand = async (command: string) => {
    try {
      setStatus('Sending...') // Show status while sending request
      resetInactivityTimer() // Reset inactivity timer

      const response = await fetch(backendUrl + '/send-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // bike_id: 'bike1', // Ensure bike_id is included
          command: command,
          speed: speed,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send command')
      }

      const data = await response.json()
      console.log('Success:', data)
      setStatus('Connected') // Set status back after sending
      return data
    } catch (error) {
      console.error('Error sending request:', error)
      setStatus('Error') // Display error status
    }
  }

  // Function to send connection request
  const connectBike = async () => {
    try {
      setStatus('Connecting...') // Show status while connecting
      resetInactivityTimer() // Reset inactivity timer

      const response = await fetch(`${backendUrl}/test-bike-connection/bike1`, {
        method: 'GET',
      })

      const data = await response.json()
      console.log('Connect Response:', data)

      if (data.status === 'success') {
        setStatus('Connected') // Connection successful
      } else {
        setStatus('Connection Failed') // If no response within 5 seconds
      }
    } catch (error) {
      console.error('Error connecting to bike:', error)
      setStatus('Connection Error') // Handle errors
    }
  }

  useEffect(() => {
    if (status === 'Connected') {
      resetInactivityTimer()
    }
  }, [status])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Bike Control Panel</h1>

        {/* Connect Button */}
        <button onClick={connectBike}>Connect</button>

        {/* System Status */}
        <div className={styles.controlSection}>
          <h2>System Status</h2>
          <div className={styles.statusIndicator}>Status: {status}</div>

          {/* Speed Control */}
          <div className={styles.settingItem}>
            <label>Speed Control: {speed}%</label>
            <input
              className={styles.speedControl}
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Control Buttons */}
          <div className={styles.controls}>
            <button
              onClick={() => sendCommand('forward')}
              disabled={status === 'Sending...'}
              className={styles.actionButton}>
              Forward
            </button>

            <button
              onClick={() => sendCommand('backward')}
              disabled={status === 'Sending...'}
              className={styles.actionButton}>
              Backward
            </button>
            <br />
            <button
              onClick={() => sendCommand('right')}
              disabled={status === 'Sending...'}
              className={styles.actionButton}>
              Turn Right
            </button>

            <button
              onClick={() => sendCommand('left')}
              disabled={status === 'Sending...'}
              className={styles.actionButton}>
              Turn Left
            </button>

            <button
              onClick={() => sendCommand('stop')}
              disabled={status === 'Sending...'}
              className={styles.actionButton}
              style={{ backgroundColor: 'red', color: 'white' }}>
              Stop
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
