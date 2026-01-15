import { OrganizationSettings } from '@/components/features/settings';
import { getOrganizationAction } from '@/app/actions/settings.actions';

export const dynamic = 'force-dynamic';

export default async function SettingsOrganizationPage() {
  const res = await getOrganizationAction();
  return <OrganizationSettings initialData={res.success ? res.data : undefined} />;
}
