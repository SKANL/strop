import { ProfileSettings } from '@/components/features/settings';
import { getProfileAction } from '@/app/actions/settings.actions';

export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
  const res = await getProfileAction();
  return <ProfileSettings initialData={res.success ? res.data : undefined} />;
}
