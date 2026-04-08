import React from 'react'
import CeoMail from '../../pages/CeoMail'

interface Props {
  onNavigate: (path: string) => void
}

export default function CeoEmailModule({ onNavigate }: Props) {
  return <CeoMail onNavigate={onNavigate} defaultAccount="ceo" />
}
