'use client'

import dynamic from 'next/dynamic'
import { Plus, Search, User, Map as MapIcon, Award, Loader2, Camera, Tag, MapPin, CheckCircle2, Navigation } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Carregando mapa...</div>
})

const supabase = createClient()

export default function Home() {
  const [activeTab, setActiveTab] = useState('map')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deals, setDeals] = useState<any[]>([])
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  // Form states
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [unitType, setUnitType] = useState('unidade')
  const [spotName, setSpotName] = useState('')
  const [spotCategory, setSpotCategory] = useState('mercado')

  useEffect(() => {
    fetchDeals()
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }, [])

  async function fetchDeals() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        spots (name, category, latitude, longitude)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setDeals(data)
    setIsLoading(false)
  }

  async function handlePost() {
    if (!itemName || !price || !spotName || !userPos) {
      alert('Por favor, preencha todos os campos.')
      return
    }

    setIsLoading(true)
    try {
      // 1. Criar ou buscar o Spot
      const { data: spot, error: spotError } = await supabase
        .from('spots')
        .insert({
          name: spotName,
          category: spotCategory,
          latitude: userPos[0],
          longitude: userPos[1]
        })
        .select()
        .single()

      if (spotError) throw spotError

      // 2. Criar o Deal
      const { error: dealError } = await supabase
        .from('deals')
        .insert({
          spot_id: spot.id,
          item_name: itemName,
          price: parseFloat(price),
          unit_type: unitType
        })

      if (dealError) throw dealError

      setIsRegistering(false)
      setItemName('')
      setPrice('')
      setSpotName('')
      fetchDeals()
    } catch (e: any) {
      alert('Erro ao postar: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col h-screen bg-[#F8F9FA] font-sans">
      
      {/* Search Header - Floating Style */}
      <div className="absolute top-4 left-4 right-4 z-[60] pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="flex-1 bg-white shadow-xl rounded-2xl flex items-center px-4 py-3 border border-slate-100">
            <Search className="text-slate-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="Buscar ofertas próximas..." 
              className="bg-transparent w-full text-slate-700 font-medium focus:outline-none placeholder:text-slate-400"
            />
          </div>
          <button className="bg-blue-500 shadow-xl rounded-2xl p-3 text-white">
            <User className="w-6 h-6" />
          </button>
        </div>

        {/* Floating Banner (Waze Style) */}
        {deals.length === 0 && !isLoading && (
          <div className="mt-3 bg-white/95 backdrop-blur shadow-lg p-4 rounded-2xl border border-orange-100 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
            <div className="bg-orange-500 p-2 rounded-xl">
              <Navigation className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">Florianópolis está vazia!</h3>
              <p className="text-xs text-slate-500">Seja o primeiro a alertar uma oferta.</p>
            </div>
            <button 
              onClick={() => setIsRegistering(true)}
              className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold text-xs"
            >
              Começar
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <section className="flex-1 relative overflow-hidden">
        {activeTab === 'map' ? (
          <>
            <Map deals={deals} />
            
            {/* Action Button (Waze FAB) */}
            <button 
              onClick={() => setIsRegistering(true)}
              className="absolute bottom-8 right-8 z-[60] bg-[#458CFF] text-white p-5 rounded-full shadow-[0_12px_40px_rgba(69,140,255,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-white"
            >
              <Plus className="w-8 h-8 stroke-[3]" />
            </button>
          </>
        ) : (
          <div className="h-full pt-28 pb-20 px-4 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Radar de Ofertas</h2>
              <span className="text-xs font-bold text-slate-400">{deals.length} itens encontrados</span>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-5 hover:shadow-md transition-shadow group">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden">
                     <Tag className="text-blue-200 w-10 h-10" />
                     <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] py-1 text-center font-bold uppercase">
                       {deal.unit_type}
                     </span>
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verificado</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deal.spots?.category}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mt-1 leading-tight group-hover:text-blue-600 transition-colors">{deal.item_name}</h4>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      <p className="text-sm font-medium">{deal.spots?.name}</p>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-400 mr-1">R$</span>
                        <span className="text-2xl font-black text-slate-900">{deal.price.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-500 ml-1">/{deal.unit_type}</span>
                      </div>
                      <button className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                        <Navigation className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Modal - Professional Form */}
      {isRegistering && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
            <button onClick={() => setIsRegistering(false)} className="text-slate-400 font-bold text-sm uppercase tracking-widest">Fechar</button>
            <h2 className="font-black text-slate-800 uppercase tracking-tight">Postar Oferta</h2>
            <div className="w-12"></div>
          </div>
          
          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
             {/* Product Details */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">O Produto</h3>
                </div>
                
                <input 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)}
                  type="text" 
                  placeholder="Nome do produto (ex: Cerveja Skol 350ml)" 
                  className="w-full p-5 bg-slate-50 rounded-3xl text-lg font-bold text-slate-800 placeholder:text-slate-300 border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                />

                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="w-full p-5 pl-12 bg-slate-50 rounded-3xl text-2xl font-black text-slate-800 focus:border-blue-500 border-2 border-transparent outline-none transition-all" 
                    />
                  </div>
                  <select 
                    value={unitType} 
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-40 p-5 bg-slate-50 rounded-3xl font-bold text-slate-600 focus:border-blue-500 border-2 border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="litro">por Litro</option>
                    <option value="kg">por Kg</option>
                    <option value="caixa">por Caixa</option>
                  </select>
                </div>
             </div>

             {/* Location Details */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">O Estabelecimento</h3>
                </div>
                
                <input 
                  value={spotName} 
                  onChange={(e) => setSpotName(e.target.value)}
                  type="text" 
                  placeholder="Nome do Local (ex: Posto Ipiranga)" 
                  className="w-full p-5 bg-slate-50 rounded-3xl text-lg font-bold text-slate-800 placeholder:text-slate-300 border-2 border-transparent focus:border-orange-500 outline-none transition-all" 
                />

                <select 
                  value={spotCategory} 
                  onChange={(e) => setSpotCategory(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-3xl font-bold text-slate-600 border-2 border-transparent focus:border-orange-500 outline-none"
                >
                  <option value="mercado">🛒 Supermercado</option>
                  <option value="posto">⛽ Posto de Gasolina</option>
                  <option value="farmacia">💊 Farmácia</option>
                  <option value="roupas">👗 Vestuário</option>
                  <option value="restaurante">🍔 Alimentação</option>
                </select>
             </div>

             {/* Photo (Fake) */}
             <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-slate-50 transition-all cursor-pointer group">
                <Camera className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-black uppercase text-xs tracking-widest">Tirar foto do cupom</span>
                <span className="text-[10px] mt-1 font-bold">+50 XP EXTRA</span>
             </div>
          </div>

          <div className="p-8 bg-white border-t">
             <button 
              onClick={handlePost}
              disabled={isLoading}
              className="w-full bg-[#458CFF] hover:bg-[#3476E3] disabled:bg-slate-300 text-white py-6 rounded-[2rem] font-black text-xl shadow-[0_12px_40px_rgba(69,140,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
             >
               {isLoading ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ALERTA'}
             </button>
             <p className="text-[10px] text-slate-300 text-center mt-6 font-bold uppercase tracking-[0.2em]">Sua localização será salva via GPS</p>
          </div>
        </div>
      )}

      {/* Footer Navigation (Waze Style) */}
      <nav className="bg-white border-t px-10 py-5 flex justify-around items-center z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'map' ? 'text-blue-500' : 'text-slate-300'}`}
        >
          <MapIcon className={`w-7 h-7 ${activeTab === 'map' ? 'fill-current opacity-20 absolute' : ''}`} />
          <MapIcon className="w-7 h-7 relative" />
          <span className="text-[10px] font-black uppercase tracking-widest">Mapa</span>
        </button>
        <div className="w-px h-6 bg-slate-100"></div>
        <button 
          onClick={() => setActiveTab('deals')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'deals' ? 'text-blue-500' : 'text-slate-300'}`}
        >
          <Search className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-widest">Radar</span>
        </button>
      </nav>
    </main>
  )
}
