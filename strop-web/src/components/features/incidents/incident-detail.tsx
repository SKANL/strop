'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { Incident } from '@/types'

interface Props {
  incident: Incident | null
  open: boolean
  onClose: () => void
}

export function IncidentDetail({ incident, open, onClose }: Props) {
  if (!incident) return null

  const statusLabel = incident.status ?? 'UNKNOWN'

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{incident.title}</h3>
        <Badge variant="default">{statusLabel}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{incident.description || 'Sin descripción'}</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}
