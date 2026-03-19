'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

// Corrigindo o problema dos ícones do Leaflet no Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapProps {
  center?: [number, number]
  zoom?: number
}

function ChangeView({ center, zoom }: MapProps) {
  const map = useMap()
  if (center) map.setView(center, zoom)
  return null
}

export default function Map({ center = [-27.5954, -48.5480], zoom = 13 }: MapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }, [])

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={position || center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position || center} zoom={zoom} />
        {position && (
          <Marker position={position} icon={icon}>
            <Popup>Você está aqui!</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
