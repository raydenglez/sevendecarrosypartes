import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  ChevronDown,
  Loader2,
  GripVertical,
  Trash2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { ImageCropModal } from '@/components/ImageCropModal';
import { LocationPicker } from '@/components/LocationPicker';
import { VinScanner } from '@/components/VinScanner';
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

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [listingType, setListingType] = useState<ListingType>('vehicle');
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Location state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
    state: string;
    address?: string;
  } | null>(null);

  // VIN scanner state
  const [vinScannerOpen, setVinScannerOpen] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Fetch existing listing data
  useEffect(() => {
    async function fetchListing() {
      if (!id || !user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          vehicle_attributes (*),
          part_attributes (*),
          service_attributes (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast.error('Listing not found');
        navigate('/profile');
        return;
      }

      // Check ownership
      if (data.owner_id !== user.id) {
        toast.error('You can only edit your own listings');
        navigate(`/listing/${id}`);
        return;
      }

      // Set listing type
      setListingType(data.type as ListingType);
      setDescription(data.description || '');
      setImages(data.images || []);
      
      if (data.location_lat && data.location_lng) {
        setLocation({
          lat: Number(data.location_lat),
          lng: Number(data.location_lng),
          city: data.location_city || '',
          state: data.location_state || '',
        });
      }

      // Populate form based on type
      if (data.type === 'vehicle' && data.vehicle_attributes) {
        vehicleForm.reset({
          title: data.title,
          price: Number(data.price) || 0,
          isNegotiable: data.is_negotiable || false,
          make: data.vehicle_attributes.make || '',
          model: data.vehicle_attributes.model || '',
          year: data.vehicle_attributes.year || new Date().getFullYear(),
          mileage: data.vehicle_attributes.mileage || 0,
          vin: data.vehicle_attributes.vin || '',
          fuelType: data.vehicle_attributes.fuel_type || '',
          transmission: data.vehicle_attributes.transmission || '',
          color: data.vehicle_attributes.color || '',
          condition: data.vehicle_attributes.condition || undefined,
        });
      } else if (data.type === 'part' && data.part_attributes) {
        partForm.reset({
          title: data.title,
          price: Number(data.price) || 0,
          isNegotiable: data.is_negotiable || false,
          partCategory: data.part_attributes.part_category || '',
          brand: data.part_attributes.brand || '',
          condition: data.part_attributes.condition || undefined,
        });
      } else if (data.type === 'service' && data.service_attributes) {
        serviceForm.reset({
          title: data.title,
          price: Number(data.price) || 0,
          isNegotiable: data.is_negotiable || false,
          serviceCategory: data.service_attributes.service_category || 'maintenance',
          priceStructure: data.service_attributes.price_structure || '',
        });
      }

      setLoading(false);
    }

    if (!authLoading) {
      fetchListing();
    }
  }, [id, user, authLoading, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    let newCoverIndex = coverIndex;
    if (coverIndex === draggedIndex) {
      newCoverIndex = dropIndex;
    } else if (draggedIndex < coverIndex && dropIndex >= coverIndex) {
      newCoverIndex = coverIndex - 1;
    } else if (draggedIndex > coverIndex && dropIndex <= coverIndex) {
      newCoverIndex = coverIndex + 1;
    }
    
    setImages(newImages);
    setCoverIndex(newCoverIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleVinDetected = (details: {
    make: string;
    model: string;
    year: number;
    fuelType?: string;
    transmission?: string;
    vin: string;
  }) => {
    vehicleForm.setValue('vin', details.vin);
    vehicleForm.setValue('make', details.make);
    vehicleForm.setValue('model', details.model);
    vehicleForm.setValue('year', details.year);
    if (details.fuelType) {
      vehicleForm.setValue('fuelType', details.fuelType);
    }
    if (details.transmission) {
      vehicleForm.setValue('transmission', details.transmission);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    
    setIsDeleting(true);
    try {
      // Delete type-specific attributes first (cascading delete handles this, but being explicit)
      if (listingType === 'vehicle') {
        await supabase.from('vehicle_attributes').delete().eq('listing_id', id);
      } else if (listingType === 'part') {
        await supabase.from('part_attributes').delete().eq('listing_id', id);
      } else if (listingType === 'service') {
        await supabase.from('service_attributes').delete().eq('listing_id', id);
      }

      // Delete images from storage
      for (const imageUrl of images) {
        try {
          const urlParts = imageUrl.split('/listings/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('listings').remove([filePath]);
          }
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

      // Delete the listing
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;

      toast.success('Listing deleted successfully');
      navigate('/profile');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: VehicleFormData | PartFormData | ServiceFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    try {
      // Update the listing
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          title: data.title,
          description: description || null,
          price: data.price,
          is_negotiable: data.isNegotiable,
          images: images.length > 0 ? images : null,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_city: location?.city || null,
          location_state: location?.state || null,
        })
        .eq('id', id);

      if (listingError) throw listingError;

      // Update type-specific attributes
      if (listingType === 'vehicle') {
        const vehicleData = data as VehicleFormData;
        const { error: attrError } = await supabase
          .from('vehicle_attributes')
          .update({
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            mileage: vehicleData.mileage || null,
            vin: vehicleData.vin || null,
            fuel_type: vehicleData.fuelType || null,
            transmission: vehicleData.transmission || null,
            color: vehicleData.color || null,
            condition: vehicleData.condition || null,
          })
          .eq('listing_id', id);
        if (attrError) throw attrError;
      } else if (listingType === 'part') {
        const partData = data as PartFormData;
        const { error: attrError } = await supabase
          .from('part_attributes')
          .update({
            part_category: partData.partCategory,
            brand: partData.brand || null,
            condition: partData.condition || null,
          })
          .eq('listing_id', id);
        if (attrError) throw attrError;
      } else if (listingType === 'service') {
        const serviceData = data as ServiceFormData;
        const { error: attrError } = await supabase
          .from('service_attributes')
          .update({
            service_category: serviceData.serviceCategory,
            price_structure: serviceData.priceStructure || null,
          })
          .eq('listing_id', id);
        if (attrError) throw attrError;
      }

      toast.success('Listing updated successfully!');
      navigate(`/listing/${id}`);
    } catch (error: any) {
      console.error('Error updating listing:', error);
      toast.error(error.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const currentForm = listingType === 'vehicle' ? vehicleForm : listingType === 'part' ? partForm : serviceForm;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Edit Listing</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this listing? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            <div>
              <h2 className="text-lg font-bold text-foreground">Visual Gallery</h2>
              {images.length > 1 && (
                <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder • First image is cover</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {images.length}/10 photos
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden bg-muted cursor-grab active:cursor-grabbing transition-all duration-200",
                  idx === 0 && "col-span-2 row-span-2",
                  draggedIndex === idx && "opacity-50 scale-95",
                  dragOverIndex === idx && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <img 
                  src={img} 
                  alt={`Listing image ${idx + 1}`} 
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-1 rounded bg-primary text-primary-foreground">
                    COVER
                  </span>
                )}
                
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
                
                <button 
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
                
                <span className="absolute bottom-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/80 text-foreground">
                  {idx + 1}
                </span>
              </div>
            ))}
            
            {images.length < 10 && (
              <button 
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50",
                  images.length === 0 && "col-span-2 row-span-2"
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Listing Type (read-only for edit) */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Listing Type</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
            {listingType === 'vehicle' && <Car className="w-6 h-6 text-primary" />}
            {listingType === 'part' && <Settings className="w-6 h-6 text-primary" />}
            {listingType === 'service' && <Wrench className="w-6 h-6 text-primary" />}
            <span className="font-medium text-foreground capitalize">{listingType}</span>
            <span className="text-xs text-muted-foreground ml-auto">Cannot be changed</span>
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
                            <button 
                              type="button" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
                              onClick={() => setVinScannerOpen(true)}
                            >
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

              {/* Location */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Location</h2>
                <div 
                  className="bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-colors"
                  onClick={() => setLocationPickerOpen(true)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        {location ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-green-500">SELECTED</span>
                            </div>
                            <p className="font-medium text-foreground">
                              {location.city}{location.state ? `, ${location.state}` : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Tap to add location</p>
                            <p className="font-medium text-foreground">Select on map</p>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {location ? 'Edit' : 'Add'}
                    </span>
                  </div>
                  {location && (
                    <div className="h-32">
                      <img
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(${location.lng},${location.lat})/${location.lng},${location.lat},13,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA`}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Update Button */}
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
                    Updating...
                  </>
                ) : (
                  <>
                    Save Changes
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

              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Part Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={partForm.control}
                    name="partCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Brakes" {...field} />
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
                          <Input placeholder="Ex: Bosch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={partForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
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

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Describe the part, compatibility, condition, etc."
                  className="h-32 resize-none"
                />
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Location</h2>
                <div 
                  className="bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-colors"
                  onClick={() => setLocationPickerOpen(true)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        {location ? (
                          <p className="font-medium text-foreground">
                            {location.city}{location.state ? `, ${location.state}` : ''}
                          </p>
                        ) : (
                          <p className="font-medium text-foreground">Select on map</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">{location ? 'Edit' : 'Add'}</span>
                  </div>
                </div>
              </section>

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
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        )}

        {listingType === 'service' && (
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onSubmit)} className="space-y-6">
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
                          <Input placeholder="Ex: Professional Oil Change Service" {...field} />
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

              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Service Details</h2>
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
                          <Input placeholder="Ex: Per hour, Fixed price, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Describe your services, experience, availability, etc."
                  className="h-32 resize-none"
                />
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Location</h2>
                <div 
                  className="bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-colors"
                  onClick={() => setLocationPickerOpen(true)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        {location ? (
                          <p className="font-medium text-foreground">
                            {location.city}{location.state ? `, ${location.state}` : ''}
                          </p>
                        ) : (
                          <p className="font-medium text-foreground">Select on map</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">{location ? 'Edit' : 'Add'}</span>
                  </div>
                </div>
              </section>

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
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>

      {/* Modals */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
      />

      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onLocationSelect={setLocation}
        initialLocation={location}
      />

      <VinScanner
        open={vinScannerOpen}
        onClose={() => setVinScannerOpen(false)}
        onVehicleDetected={handleVinDetected}
      />
    </div>
  );
}
