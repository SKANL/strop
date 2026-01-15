import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon: ActionIcon,
  onAction,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && (
          actionHref ? (
            <Button asChild>
              <Link href={actionHref}>
                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                {actionLabel}
              </Link>
            </Button>
          ) : (
            <Button onClick={onAction}>
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {actionLabel}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
