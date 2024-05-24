import React from 'react'
import { User } from '@supabase/supabase-js'
import FriendRecommendations from './components/FriendRecommendations/FriendRecommendations'

const FriendRecommendationsPage: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="mb-4 text-2xl font-bold">Friend Recommendations</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FriendRecommendations user={user} />
      </div>
    </div>
  )
}

export default FriendRecommendationsPage
