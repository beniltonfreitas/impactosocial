-- Remover trigger e função existentes com CASCADE
DROP TRIGGER IF EXISTS notify_breaking_news_trigger ON articles CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_breaking_news ON articles CASCADE;
DROP FUNCTION IF EXISTS notify_breaking_news() CASCADE;

-- Criar função para notificações de breaking news
CREATE OR REPLACE FUNCTION notify_breaking_news()
RETURNS TRIGGER AS $$
BEGIN
  -- Só notificar se o artigo for breaking e estiver sendo publicado agora
  IF NEW.breaking = true 
     AND NEW.published_at IS NOT NULL 
     AND (OLD IS NULL OR OLD.published_at IS NULL OR OLD.breaking = false) THEN
    
    -- Inserir notificação do sistema para todos os usuários
    INSERT INTO system_notifications (
      user_id,
      type,
      title,
      message,
      action,
      read
    )
    SELECT 
      p.id,
      'alert',
      '🚨 URGENTE: ' || NEW.title,
      COALESCE(LEFT(NEW.summary, 100), LEFT(NEW.title, 100)) || '...',
      jsonb_build_object(
        'label', 'Ler agora',
        'href', '/news/' || NEW.slug
      ),
      false
    FROM profiles p;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trigger_notify_breaking_news
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION notify_breaking_news();