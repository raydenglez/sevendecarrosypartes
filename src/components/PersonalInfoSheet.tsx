import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PersonalInfoSheetProps {
  open: boolean;
  onClose: () => void;
  profileData: {
    email: string;
    phone: string;
    city: string;
    state: string;
  };
  onUpdate: (data: { phone: string; city: string; state: string }) => void;
}

export function PersonalInfoSheet({ open, onClose, profileData, onUpdate }: PersonalInfoSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: profileData.phone,
    city: profileData.city,
    state: profileData.state,
  });

  const handleSave = async (field: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const updateData: Record<string, string> = {};
      if (field === 'phone') updateData.phone = formData.phone;
      if (field === 'location') {
        updateData.location_city = formData.city;
        updateData.location_state = formData.state;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      onUpdate(formData);
      setEditing(null);
      toast({
        title: "Updated",
        description: "Your information has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      phone: profileData.phone,
      city: profileData.city,
      state: profileData.state,
    });
    setEditing(null);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Personal Information</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Email (Read-only) */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="text-foreground font-medium">{profileData.email || 'Not set'}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-13">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Phone */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                {editing === 'phone' ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="mt-1 h-9"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profileData.phone || 'Not set'}</p>
                )}
              </div>
              {editing === 'phone' ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success"
                    onClick={() => handleSave('phone')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing('phone')}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Location</Label>
                {editing === 'location' ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="h-9"
                    />
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                      className="h-9 w-24"
                    />
                  </div>
                ) : (
                  <p className="text-foreground font-medium">
                    {profileData.city && profileData.state
                      ? `${profileData.city}, ${profileData.state}`
                      : profileData.city || profileData.state || 'Not set'}
                  </p>
                )}
              </div>
              {editing === 'location' ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success"
                    onClick={() => handleSave('location')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing('location')}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
            <p className="text-sm text-muted-foreground">
              Your personal information is used to enhance your CarNetworx experience and help buyers/sellers contact you.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
