import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const getSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useArticleView = (articleId: string) => {
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const registerView = async () => {
      try {
        const { error } = await supabase.rpc('register_article_view', {
          p_article_id: articleId,
          p_session_id: getSessionId(),
          p_referrer: document.referrer || null,
          p_user_agent: navigator.userAgent
        });
        
        if (error) console.error('[useArticleView] Error registering view:', error);
      } catch (err) {
        console.error('[useArticleView] Failed to register view:', err);
      }
    };
    
    // Aguardar 3 segundos antes de registrar
    timeout = setTimeout(registerView, 3000);
    
    return () => clearTimeout(timeout);
  }, [articleId]);
};
