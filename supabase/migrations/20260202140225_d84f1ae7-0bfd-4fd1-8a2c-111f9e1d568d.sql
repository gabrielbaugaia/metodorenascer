-- Remover conversas duplicadas (manter apenas a mais recente por user_id + tipo)
DELETE FROM conversas a
USING conversas b
WHERE a.user_id = b.user_id
  AND a.tipo = b.tipo
  AND a.created_at < b.created_at;

-- Adicionar constraint UNIQUE para prevenir duplicatas futuras
ALTER TABLE conversas
ADD CONSTRAINT unique_user_tipo UNIQUE (user_id, tipo);

-- Adicionar campo status para controle de estado da conversa
ALTER TABLE conversas
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';