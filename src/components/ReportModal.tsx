import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ReportReason } from '@/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  { value: 'scam', label: 'Scam or Fraud', description: 'Suspicious pricing, fake listings, or fraud attempts' },
  { value: 'spam', label: 'Spam', description: 'Promotional content, repeated postings, or unrelated items' },
  { value: 'misleading', label: 'Misleading Information', description: 'False claims, inaccurate descriptions, or clickbait' },
  { value: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive language, harassment, or inappropriate images' },
  { value: 'counterfeit', label: 'Counterfeit Item', description: 'Fake parts or items sold as genuine' },
  { value: 'other', label: 'Other', description: 'Other policy violation not listed above' },
];

export function ReportModal({ isOpen, onClose, listingId, listingTitle }: ReportModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to report listings');
      return;
    }

    if (!selectedReason) {
      toast.error('Please select a reason for your report');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          listing_id: listingId,
          reason: selectedReason,
          description: description.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reported this listing');
        } else if (error.message.includes('own listing')) {
          toast.error('You cannot report your own listing');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Report submitted successfully. Our team will review it.');
      onClose();
      setSelectedReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Listing
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Report "{listingTitle}" for violating our policies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this listing?</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value as ReportReason)}
              className="space-y-2"
            >
              {reportReasons.map((reason) => (
                <div
                  key={reason.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{reason.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional information that might help our review..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
