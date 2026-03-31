select cron.schedule(
  'daily-pending-reminders',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://[TU-PROJECT-ID].supabase.co/functions/v1/check-pending-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )
  ) as request_id;
  $$
);
