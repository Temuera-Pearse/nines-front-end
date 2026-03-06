import React from 'react'
import { Card } from '../components/UI/Card'

export const HistoryPage: React.FC = () => {
  // Placeholder for future implementation
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Race History</h1>
      <Card>
        <div className="text-center text-gray-600 py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl">Race history coming soon...</p>
          <p className="text-sm mt-2">
            This feature will display past races and betting history.
          </p>
        </div>
      </Card>
    </div>
  )
}
