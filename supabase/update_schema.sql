-- Atualizando a tabela de Deals para incluir unidade de medida
ALTER TABLE deals ADD COLUMN unit_type TEXT CHECK (unit_type IN ('unidade', 'kg', 'litro', 'caixa', 'pacote')) DEFAULT 'unidade';

-- Ajuste na tabela de Spots para ser mais flexível
ALTER TABLE spots DROP CONSTRAINT IF EXISTS spots_category_check;
ALTER TABLE spots ADD CONSTRAINT spots_category_check CHECK (category IN ('posto', 'mercado', 'farmacia', 'roupas', 'eletronicos', 'restaurante', 'outro'));
