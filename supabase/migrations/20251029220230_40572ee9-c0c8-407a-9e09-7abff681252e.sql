-- Corrigir search_path das funções PcD para evitar ataques de busca de schema
ALTER FUNCTION update_pcd_updated_at() SET search_path = public;