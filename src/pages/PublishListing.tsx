import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Camera, 
  Car, 
  Wrench, 
  Settings,
  MapPin,
  Scan,
  Upload,
  ChevronDown,
  Plus,
  Loader2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { ImageCropModal } from '@/components/ImageCropModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ListingType = 'vehicle' | 'part' | 'service';

const baseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  isNegotiable: z.boolean().default(false),
});

const vehicleSchema = baseSchema.extend({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0).optional(),
  vin: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
});

const partSchema = baseSchema.extend({
  partCategory: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
});

const serviceSchema = baseSchema.extend({
  serviceCategory: z.enum(['maintenance', 'bodywork', 'car_wash', 'tires', 'electrical', 'other']),
  priceStructure: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;
type PartFormData = z.infer<typeof partSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;

const typeOptions = [
  { id: 'vehicle' as const, label: 'Vehicle', icon: Car },
  { id: 'part' as const, label: 'Part', icon: Settings },
  { id: 'service' as const, label: 'Service', icon: Wrench },
];

const conditionOptions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const serviceCategoryOptions = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'bodywork', label: 'Bodywork' },
  { value: 'car_wash', label: 'Car Wash' },
  { value: 'tires', label: 'Tires' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'other', label: 'Other' },
];

export default function PublishListing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [listingType, setListingType] = useState<ListingType>('vehicle');
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  
  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Vehicle form
  const vehicleForm = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      title: '',
      price: 0,
      isNegotiable: false,
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
    },
  });

  // Part form
  const partForm = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      title: '',
      price: 0,
      isNegotiable: false,
      partCategory: '',
    },
  });

  // Service form
  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      price: 0,
      isNegotiable: false,
      serviceCategory: 'maintenance',
    },
  });

  const currentForm = listingType === 'vehicle' ? vehicleForm : listingType === 'part' ? partForm : serviceForm;

  const handleClearForm = () => {
    vehicleForm.reset();
    partForm.reset();
    serviceForm.reset();
    setImages([]);
    setDescription('');
    setCoverIndex(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview URL and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    
    setCropModalOpen(false);
    setIsUploading(true);

    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(fileName);

      setImages(prev => [...prev, publicUrl]);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setSelectedImageSrc('');
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extract file path from URL
    try {
      const urlParts = imageUrl.split('/listings/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('listings').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }

    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (coverIndex >= newImages.length) {
      setCoverIndex(Math.max(0, newImages.length - 1));
    }
  };

  const onSubmit = async (data: VehicleFormData | PartFormData | ServiceFormData) => {
    if (!user) {
      toast.error('Please sign in to publish a listing');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the listing first
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          type: listingType,
          title: data.title,
          description: description || null,
          price: data.price,
          is_negotiable: data.isNegotiable,
          images: images.length > 0 ? images : null,
          status: 'active',
        })
        .select()
        .single();

      if (listingError) throw listingError;

      // Insert type-specific attributes
      if (listingType === 'vehicle' && listing) {
        const vehicleData = data as VehicleFormData;
        const { error: attrError } = await supabase
          .from('vehicle_attributes')
          .insert({
            listing_id: listing.id,
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            mileage: vehicleData.mileage || null,
            vin: vehicleData.vin || null,
            fuel_type: vehicleData.fuelType || null,
            transmission: vehicleData.transmission || null,
            color: vehicleData.color || null,
            condition: vehicleData.condition || null,
          });
        if (attrError) throw attrError;
      } else if (listingType === 'part' && listing) {
        const partData = data as PartFormData;
        const { error: attrError } = await supabase
          .from('part_attributes')
          .insert({
            listing_id: listing.id,
            part_category: partData.partCategory,
            brand: partData.brand || null,
            condition: partData.condition || null,
          });
        if (attrError) throw attrError;
      } else if (listingType === 'service' && listing) {
        const serviceData = data as ServiceFormData;
        const { error: attrError } = await supabase
          .from('service_attributes')
          .insert({
            listing_id: listing.id,
            service_category: serviceData.serviceCategory,
            price_structure: serviceData.priceStructure || null,
          });
        if (attrError) throw attrError;
      }

      toast.success('Listing published successfully!');
      navigate(`/listing/${listing.id}`);
    } catch (error: any) {
      console.error('Error publishing listing:', error);
      toast.error(error.message || 'Failed to publish listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Publish Listing</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign in to publish</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            Create an account to list vehicles, parts, or services for sale
          </p>
          <Button variant="carnexo" size="lg" onClick={() => navigate('/auth')}>
            Sign In or Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Publish Listing</h1>
          <Button variant="ghost" className="text-muted-foreground" onClick={handleClearForm}>
            Clear
          </Button>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-6 animate-fade-in">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Image Gallery */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Visual Gallery</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {images.length}/10 photos
            </span>
          </div>
          <div className="flex gap-3">
            {/* Cover Image */}
            <div 
              className="relative w-32 aspect-[3/4] rounded-xl overflow-hidden bg-muted shrink-0 cursor-pointer"
              onClick={() => images.length === 0 && fileInputRef.current?.click()}
            >
              {images[coverIndex] ? (
                <>
                  <img
                    src={images[coverIndex]}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-1 rounded bg-primary text-primary-foreground">
                    COVER
                  </span>
                  <button 
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(coverIndex);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add cover</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {images.slice(1, 3).map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setCoverIndex(idx + 1)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx + 1);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button 
                  className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Show remaining images if more than 3 */}
          {images.length > 3 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.slice(3).map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setCoverIndex(idx + 3)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx + 3);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Listing Type */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Listing Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = listingType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setListingType(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Form based on listing type */}
        {listingType === 'vehicle' && (
          <Form {...vehicleForm}>
            <form onSubmit={vehicleForm.handleSubmit(onSubmit)} className="space-y-6">
              {/* General Information */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">General Information</h2>
                <div className="space-y-3">
                  <FormField
                    control={vehicleForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2020 Toyota Corolla XLE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Quick Key Data */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary">🔑</span>
                  <h2 className="text-lg font-bold text-foreground">Quick Key Data</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={vehicleForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Corolla" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-3">
                  <FormField
                    control={vehicleForm.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN / Serial Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="XXXXXXXXXXXXXXXXX" className="pr-16" {...field} />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary flex items-center gap-1">
                              <Scan className="w-4 h-4" />
                              SCAN
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Technical Specs */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-secondary">⚙️</span>
                  <h2 className="text-lg font-bold text-foreground">Technical Specs</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={vehicleForm.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gasoline">Gasoline</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="cvt">CVT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Red" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditionOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Description */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Describe important details, special features, etc."
                  className="h-32 resize-none"
                />
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnexo" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        {listingType === 'part' && (
          <Form {...partForm}>
            <form onSubmit={partForm.handleSubmit(onSubmit)} className="space-y-6">
              {/* General Information */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">General Information</h2>
                <div className="space-y-3">
                  <FormField
                    control={partForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: OEM Brake Pads for Honda Civic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={partForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Part Details */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary">🔧</span>
                  <h2 className="text-lg font-bold text-foreground">Part Details</h2>
                </div>
                <div className="space-y-3">
                  <FormField
                    control={partForm.control}
                    name="partCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Brakes, Engine, Suspension" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={partForm.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Bosch, ACDelco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={partForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditionOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Description */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Describe the part, compatibility, condition details..."
                  className="h-32 resize-none"
                />
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnexo" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        {listingType === 'service' && (
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onSubmit)} className="space-y-6">
              {/* General Information */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">General Information</h2>
                <div className="space-y-3">
                  <FormField
                    control={serviceForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Full Car Detail & Ceramic Coating" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={serviceForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Service Details */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary">🛠️</span>
                  <h2 className="text-lg font-bold text-foreground">Service Details</h2>
                </div>
                <div className="space-y-3">
                  <FormField
                    control={serviceForm.control}
                    name="serviceCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceCategoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={serviceForm.control}
                    name="priceStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Structure</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Per hour, Fixed price, Quote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Description */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Describe your service, what's included, experience..."
                  className="h-32 resize-none"
                />
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnexo" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImageSrc('');
        }}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
