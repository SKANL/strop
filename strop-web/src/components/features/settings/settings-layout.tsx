import React from 'react';

interface SettingsLayoutProps {
	children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
	return (
		<div className="grid gap-8 md:grid-cols-[200px_1fr]">
			<main className="flex-1">{children}</main>
		</div>
	);
}
