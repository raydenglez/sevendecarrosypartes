import { BadgeCelebrationModal } from './BadgeCelebrationModal';
import { useBadgeCelebration } from '@/hooks/useBadgeCelebration';

export const BadgeCelebrationProvider = () => {
  const { newBadge, isOpen, closeCelebration } = useBadgeCelebration();

  if (!newBadge) return null;

  return (
    <BadgeCelebrationModal
      isOpen={isOpen}
      onClose={closeCelebration}
      badgeType={newBadge.badgeType}
      badgeName={newBadge.badgeName}
    />
  );
};
