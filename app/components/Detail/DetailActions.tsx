import type { DetailAction } from './types';

const ACTION_CLASSES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
} as const;

interface DetailActionsProps {
  actions: readonly DetailAction[];
}

export function DetailActions({ actions }: DetailActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ label, href, variant = 'primary' }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-4 py-2 rounded transition-colors ${ACTION_CLASSES[variant]}`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
