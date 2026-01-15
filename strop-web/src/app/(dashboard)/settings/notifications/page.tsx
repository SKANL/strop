import { NotificationSettings } from '@/components/features/settings';
import { getNotificationSettingsAction } from '@/app/actions/settings.actions';

export const dynamic = 'force-dynamic';

export default async function SettingsNotificationsPage() {
  const res = await getNotificationSettingsAction();
  return <NotificationSettings initialSettings={res.success ? res.data : []} />;
}
