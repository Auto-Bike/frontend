'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function ControlPage() {
  const [status, setStatus] = useState('Disconnected')
  const [speed, setSpeed] = useState(30) // Speed control
  const [direction, setDirection] = useState(30) // Direction control
  const [isDebugMode, setIsDebugMode] = useState(true) // Debug mode useState
  const [directionParams, setDirectionParams] = useState(30.0) // Direction parameters state
  const backendUrl = 'https://3.15.51.67' // Change to your actual backend IP
  // const backendUrl = 'http://localhost:8000'
  const inactivityTimeout = 30 * 1000 // 30 seconds timeout
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null
  )

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    if (status === 'Disconnected') return // Don't reset timer if already disconnected

    // Clear existing timer if any
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      console.log('No actions detected for 30s. Disconnecting...')
      setStatus('Disconnected')
    }, inactivityTimeout)

    setInactivityTimer(timer)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
    }
  }, [inactivityTimer])

  // Function to send commands to the backend
  const sendCommand = async (command: string) => {
    // Check if bike is connected first
    if (status !== 'Connected') {
      alert('Please connect to the bike first before sending commands.')
      return
    }

    try {
      setStatus('Sending...') // Show status while sending request
      resetInactivityTimer() // Reset inactivity timer
      const time_duration = Number((direction / directionParams).toFixed(2))
      // console.log('time_duration:', time_duration)
      const response = await fetch(backendUrl + '/send-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // bike_id: 'bike1', // Ensure bike_id is included
          command: command,
          speed: speed,
          time_duration: time_duration,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send command')
      }

      const data = await response.json()
      console.log('Success:', data)
      setStatus('Connected') // Set status back after sending

      // Show success message with command details
      const commandDisplay = command.charAt(0).toUpperCase() + command.slice(1)
      let message = `Command "${commandDisplay}" executed successfully!`

      // Add relevant information based on command type
      if (command === 'forward' || command === 'backward') {
        message += `\nSpeed: ${speed}%`
      } else if (command === 'left' || command === 'right') {
        message += `\nAngle: ${direction}°`
      }

      alert(message)

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

  // Function to disconnect the bike
  const disconnectBike = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }
    setStatus('Disconnected')
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
        <div className={styles.controlSection}>
          <div className={styles.buttonGroup}>
            <button onClick={connectBike}>Connect</button>
            {isDebugMode && (
              <button onClick={disconnectBike}>Disconnect</button>
            )}
          </div>
          <div className={styles.statusIndicator}>System Status: {status}</div>

          {/* Speed Control */}
          <div className={styles.settingItem}>
            <label>Speed Control: {speed}% (0-80)</label>
            <input
              className={styles.speedControl}
              type="range"
              min="0"
              max="80"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Direction Control */}
          <div className={styles.settingItem}>
            <label>Angle Control: {direction}° (0-60)</label>
            <input
              className={styles.speedControl}
              type="range"
              min="0"
              max="60"
              value={direction}
              onChange={(e) => setDirection(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Direction Parameters Control */}
          {isDebugMode && (
            <div className={styles.settingItem}>
              <label>Direction Parameters: {directionParams}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={directionParams}
                onChange={(e) =>
                  setDirectionParams(Math.max(1, parseInt(e.target.value) || 1))
                }
                className={styles.numberInput}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          )}

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
            {/* <br /> */}
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
