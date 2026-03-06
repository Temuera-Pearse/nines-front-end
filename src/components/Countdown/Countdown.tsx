import React, { useState, useEffect } from 'react'
import { countdownTo, formatCountdown } from '../../utils/time'

interface CountdownProps {
  targetUtc: string
  label?: string
  onComplete?: () => void
}

export const Countdown: React.FC<CountdownProps> = ({
  targetUtc,
  label,
  onComplete,
}) => {
  const [seconds, setSeconds] = useState<number>(countdownTo(targetUtc))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = countdownTo(targetUtc)
      setSeconds(remaining)

      if (remaining <= 0 && onComplete) {
        onComplete()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetUtc, onComplete])

  return (
    <div className="text-center">
      {label && <div className="text-sm text-gray-600 mb-2">{label}</div>}
      <div className="text-4xl font-bold text-blue-600">
        {formatCountdown(seconds)}
      </div>
    </div>
  )
}
