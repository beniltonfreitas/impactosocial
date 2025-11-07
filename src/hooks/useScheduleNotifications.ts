import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes } from 'date-fns';

export function useScheduleNotifications() {
  useEffect(() => {
    const checkScheduledArticles = async () => {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

      const { data: schedules } = await supabase
        .from('article_schedule')
        .select(`
          id,
          scheduled_for,
          notification_sent_at,
          articles (
            id,
            title,
            author
          )
        `)
        .eq('status', 'pending')
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', thirtyMinutesLater.toISOString())
        .is('notification_sent_at', null);

      if (!schedules || schedules.length === 0) return;

      for (const schedule of schedules) {
        const minutesUntil = differenceInMinutes(
          new Date(schedule.scheduled_for),
          now
        );

        const { data: admins } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['admin', 'moderator']);

        if (admins) {
          for (const admin of admins) {
            await supabase
              .from('system_notifications')
              .insert({
                user_id: admin.user_id,
                type: 'warning',
                title: '⏰ Artigo será publicado em breve',
                message: `"${schedule.articles.title}" será publicado em ${minutesUntil} minutos.`,
                action: {
                  label: 'Ver artigo',
                  href: `/admin/articles?id=${schedule.articles.id}`
                },
                read: false,
              });
          }
        }

        await supabase
          .from('article_schedule')
          .update({ notification_sent_at: now.toISOString() })
          .eq('id', schedule.id);
      }
    };

    checkScheduledArticles();
    const interval = setInterval(checkScheduledArticles, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
