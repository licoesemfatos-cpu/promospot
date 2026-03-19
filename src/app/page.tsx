'use client'

import dynamic from 'next/dynamic'
import { Plus, Search, User, Map as MapIcon, Award, Loader2, Camera } from 'lucide-react'
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
  const [category, setCategory] = useState('mercado')
  const [spotName, setSpotName] = useState('')

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
      alert('Por favor, preencha todos os campos e permita a geolocalização.')
      return
    }

    setIsLoading(true)
    try {
      // 1. Criar ou buscar o Spot
      const { data: spot, error: spotError } = await supabase
        .from('spots')
        .insert({
          name: spotName,
          category,
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
          category
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
    <main className="flex flex-col h-screen bg-white">
      {/* Header com Busca */}
      <header className="p-4 bg-white border-b sticky top-0 z-50 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar ofertas em Florianópolis..." 
            className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full text-orange-600 font-bold text-xs">
          <Award className="w-3 h-3" />
          <span>Nível 1</span>
        </div>
      </header>

      {/* Área Principal */}
      <section className="flex-1 relative overflow-hidden bg-slate-50">
        {activeTab === 'map' ? (
          <>
            <Map deals={deals} />
            
            <button 
              onClick={() => setIsRegistering(true)}
              className="absolute bottom-6 right-6 z-50 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2 group"
            >
              <Plus className="w-6 h-6" />
              <span className="hidden group-hover:inline pr-2 font-medium">Registrar Promoção</span>
            </button>

            {deals.length === 0 && !isLoading && (
              <div className="absolute top-4 left-4 right-4 z-40 bg-white/90 backdrop-blur p-3 rounded-xl border border-orange-200 shadow-sm flex items-start gap-3 animate-in fade-in duration-500">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Seja o primeiro Caçador!</h3>
                  <p className="text-xs text-slate-600 leading-tight">Poste uma oferta em Florianópolis e ganhe o Selo de Fundador.</p>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'deals' ? (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 px-1">Ofertas Recentes</h2>
            {isLoading ? (
              <div className="flex justify-center p-8 text-orange-500"><Loader2 className="animate-spin w-8 h-8" /></div>
            ) : deals.length === 0 ? (
              <p className="text-center text-slate-400 text-sm p-10">Nenhuma oferta encontrada na região.</p>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold">
                    {deal.spots?.category?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">{deal.spots?.category}</span>
                      <span className="text-xs text-slate-400 italic">há pouco</span>
                    </div>
                    <h4 className="font-bold text-slate-800 leading-tight">{deal.item_name}</h4>
                    <p className="text-sm text-slate-500">{deal.spots?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900">R$ {deal.price.toFixed(2)}</span>
                      <button className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <span>👍</span>
                        <span>Confirmar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
             <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-orange-600" />
             </div>
             <h2 className="text-xl font-bold text-slate-800">Seu Perfil de Caçador</h2>
             <p className="text-slate-500 mt-2 mb-6 text-sm">Entre para começar a ganhar XP e medalhas salvando a comunidade!</p>
             <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Acessar com Email</button>
          </div>
        )}
      </section>

      {/* Modal de Registro */}
      {isRegistering && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <button onClick={() => setIsRegistering(false)} className="text-slate-500 font-medium">Cancelar</button>
            <h2 className="font-bold">Nova Promoção</h2>
            <button 
              onClick={handlePost} 
              disabled={isLoading}
              className="text-orange-500 font-bold disabled:opacity-50"
            >
              {isLoading ? 'Postando...' : 'Postar'}
            </button>
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">O que você encontrou?</label>
                <input 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)}
                  type="text" 
                  placeholder="Ex: Gasolina Comum, Leite Integral..." 
                  className="w-full p-4 bg-slate-100 rounded-xl focus:ring-2 ring-orange-500 outline-none" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Onde? (Nome do Local)</label>
                <input 
                  value={spotName} 
                  onChange={(e) => setSpotName(e.target.value)}
                  type="text" 
                  placeholder="Ex: Posto Shell, Angeloni Centro..." 
                  className="w-full p-4 bg-slate-100 rounded-xl focus:ring-2 ring-orange-500 outline-none" 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Preço (R$)</label>
                  <input 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    className="w-full p-4 bg-slate-100 rounded-xl focus:ring-2 ring-orange-500 outline-none" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Categoria</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 bg-slate-100 rounded-xl focus:ring-2 ring-orange-500 outline-none appearance-none"
                  >
                    <option value="mercado">Mercado</option>
                    <option value="posto">Posto</option>
                    <option value="atacado">Atacado</option>
                    <option value="outro">Outro</option>
                  </select>
               </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Foto do Cupom (XP Dobrado!)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                   <Camera className="w-8 h-8" />
                   <span className="text-xs font-medium">Toque para tirar foto</span>
                </div>
             </div>
             <p className="text-[10px] text-slate-400 text-center">Localização será salva via GPS: {userPos ? 'Ativada ✅' : 'Buscando... ⏳'}</p>
          </div>
        </div>
      )}

      {/* Navegação Inferior */}
      <nav className="bg-white border-t px-6 py-3 flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Mapa</span>
        </button>
        <button 
          onClick={() => setActiveTab('deals')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'deals' ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Lista</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
        </button>
      </nav>
    </main>
  )
}
