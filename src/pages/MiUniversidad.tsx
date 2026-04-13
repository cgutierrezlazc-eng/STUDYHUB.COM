import React from 'react'
import Profile from './Profile'

interface Props {
  onNavigate?: (path: string) => void
}

export default function MiUniversidad({ onNavigate }: Props) {
  return (
    <div className="page-body" style={{ maxWidth: 820 }}>
      <Profile embedded initialSection="universidad" onNavigate={onNavigate} />
    </div>
  )
}
