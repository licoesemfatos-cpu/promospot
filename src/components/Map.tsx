'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

// Ícones personalizados por categoria
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-pin',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const icons = {
  posto: createIcon('#ef4444'), // Vermelho
  mercado: createIcon('#3b82f6'), // Azul
  atacado: createIcon('#10b981'), // Verde
  outro: createIcon('#64748b'), // Cinza
  user: L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
}

interface Deal {
  id: string
  item_name: string
  price: number
  spots: {
    name: string
    category: 'posto' | 'mercado' | 'atacado' | 'outro'
    latitude: number
    longitude: number
  }
}

interface MapProps {
  center?: [number, number]
  zoom?: number
  deals?: Deal[]
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function Map({ center = [-27.5954, -48.5480], zoom = 14, deals = [] }: MapProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }, [])

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={userPos || center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={userPos || center} zoom={zoom} />
        
        {/* Marcador do Usuário */}
        {userPos && (
          <Marker position={userPos} icon={icons.user}>
            <Popup>Você está aqui!</Popup>
          </Marker>
        )}

        {/* Marcadores de Ofertas */}
        {deals.map((deal) => (
          <Marker 
            key={deal.id} 
            position={[deal.spots.latitude, deal.spots.longitude]}
            icon={icons[deal.spots.category] || icons.outro}
          >
            <Popup>
              <div className="p-1">
                <p className="text-[10px] font-bold text-orange-500 uppercase">{deal.spots.category}</p>
                <h3 className="font-bold text-slate-800 m-0">{deal.item_name}</h3>
                <p className="text-lg font-black text-slate-900 my-1">R$ {deal.price.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">{deal.spots.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
