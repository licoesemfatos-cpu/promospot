-- Tabela de Perfis (Gamificação)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Spots (Estabelecimentos)
CREATE TABLE spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('posto', 'mercado', 'atacado', 'outro')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Deals (Ofertas)
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  photo_url TEXT, -- URL da foto do cupom
  verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Tabela de Validações (Joinhas)
CREATE TABLE validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, user_id) -- Um usuário só valida uma oferta uma vez
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Perfis visíveis para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Spots visíveis para todos" ON spots FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados criam spots" ON spots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Deals visíveis para todos" ON deals FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados criam deals" ON deals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Validations visíveis para todos" ON validations FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados validam deals" ON validations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Função para atualizar XP ao validar ou criar deal
CREATE OR REPLACE FUNCTION handle_new_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementa XP de quem validou (+10)
  UPDATE profiles SET xp = xp + 10 WHERE id = NEW.user_id;
  -- Incrementa XP de quem criou o deal (+5)
  UPDATE profiles SET xp = xp + 5 WHERE id = (SELECT created_by FROM deals WHERE id = NEW.deal_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_validation_added
  AFTER INSERT ON validations
  FOR EACH ROW EXECUTE FUNCTION handle_new_validation();
