import { useTranslation } from 'react-i18next';

interface TypingIndicatorProps {
  typingUsers: { id: string; name: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const { t } = useTranslation();

  if (typingUsers.length === 0) return null;

  const displayName = typingUsers[0].name || t('chat.user', 'User');

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
      <span className="text-xs text-muted-foreground">
        {t('chat.typing', '{{name}} is typing...', { name: displayName })}
      </span>
    </div>
  );
}
