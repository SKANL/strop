import { redirect } from 'next/navigation';

// Redirect to profile settings by default
export default function SettingsPage() {
  redirect('/settings/profile');
}
