import { useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SEO from '@/components/SEO';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Lazy load heavy modal components
const ImageCropModal = lazy(() => import('@/components/ImageCropModal').then(m => ({ default: m.ImageCropModal })));
const LocationPicker = lazy(() => import('@/components/LocationPicker').then(m => ({ default: m.LocationPicker })));
const VinScanner = lazy(() => import('@/components/VinScanner').then(m => ({ default: m.VinScanner })));

type ListingType = 'vehicle' | 'part' | 'service';

type VehicleFormData = {
  title: string;
  description?: string;
  price: number;
  isNegotiable: boolean;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  vin?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
};

type PartFormData = {
  title: string;
  description?: string;
  price: number;
  isNegotiable: boolean;
  partCategory: string;
  brand?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
};

type ServiceFormData = {
  title: string;
  description?: string;
  price: number;
  isNegotiable: boolean;
  serviceCategory: 'maintenance' | 'bodywork' | 'car_wash' | 'tires' | 'electrical' | 'other';
  priceStructure?: string;
};

export default function PublishListing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const baseSchema = z.object({
    title: z.string().min(5, t('publish.validation.titleMin')).max(100),
    description: z.string().max(1000, t('publish.validation.descriptionMax')).optional(),
    price: z.coerce.number().min(0, t('publish.validation.pricePositive')),
    isNegotiable: z.boolean().default(false),
  });

  const vehicleSchema = baseSchema.extend({
    make: z.string().min(1, t('publish.validation.makeRequired')),
    model: z.string().min(1, t('publish.validation.modelRequired')),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    mileage: z.coerce.number().min(0).optional(),
    vin: z.string().optional(),
    fuelType: z.string().optional(),
    transmission: z.string().optional(),
    color: z.string().optional(),
    condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  });

  const partSchema = baseSchema.extend({
    partCategory: z.string().min(1, t('publish.validation.categoryRequired')),
    brand: z.string().optional(),
    condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  });

  const serviceSchema = baseSchema.extend({
    serviceCategory: z.enum(['maintenance', 'bodywork', 'car_wash', 'tires', 'electrical', 'other']),
    priceStructure: z.string().optional(),
  });

  const typeOptions = [
    { id: 'vehicle' as const, labelKey: 'publish.vehicle', icon: Car },
    { id: 'part' as const, labelKey: 'publish.part', icon: Settings },
    { id: 'service' as const, labelKey: 'publish.service', icon: Wrench },
  ];

  const conditionOptions = [
    { value: 'new', labelKey: 'vehicle.new' },
    { value: 'like_new', labelKey: 'vehicle.likeNew' },
    { value: 'good', labelKey: 'vehicle.good' },
    { value: 'fair', labelKey: 'vehicle.fair' },
    { value: 'poor', labelKey: 'vehicle.poor' },
  ];

  const serviceCategoryOptions = [
    { value: 'maintenance', labelKey: 'categories.maintenance' },
    { value: 'bodywork', labelKey: 'categories.bodywork' },
    { value: 'car_wash', labelKey: 'categories.carWash' },
    { value: 'tires', labelKey: 'categories.tires' },
    { value: 'electrical', labelKey: 'categories.electrical' },
    { value: 'other', labelKey: 'vehicle.other' },
  ];
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

  const currentForm = listingType === 'vehicle' ? vehicleForm : listingType === 'part' ? partForm : serviceForm;

  const handleClearForm = () => {
    vehicleForm.reset();
    partForm.reset();
    serviceForm.reset();
    setImages([]);
    setDescription('');
    setCoverIndex(0);
    setLocation(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('publish.toast.imageError'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('publish.toast.imageSizeError'));
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
      toast.success(t('publish.toast.imageUploaded'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || t('publish.toast.uploadFailed'));
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
    
    // Update cover index if needed
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
    // Auto-generate title suggestion
    const suggestedTitle = `${details.year} ${details.make} ${details.model}`;
    if (!vehicleForm.getValues('title')) {
      vehicleForm.setValue('title', suggestedTitle);
    }
  };

  const onSubmit = async (data: VehicleFormData | PartFormData | ServiceFormData) => {
    if (!user) {
      toast.error(t('publish.toast.signInRequired'));
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
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_city: location?.city || null,
          location_state: location?.state || null,
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

      toast.success(t('publish.toast.publishSuccess'));
      navigate(`/listing/${listing.id}`);
    } catch (error: any) {
      console.error('Error publishing listing:', error);
      toast.error(error.message || t('publish.toast.publishFailed'));
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
            <h1 className="text-lg font-bold text-foreground">{t('publish.title')}</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('publish.signInToPublish')}</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            {t('publish.signInToPublishDesc')}
          </p>
          <Button variant="carnetworx" size="lg" onClick={() => navigate('/auth')}>
            {t('publish.signInOrCreate')}
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
          <h1 className="text-lg font-bold text-foreground">{t('publish.title')}</h1>
          <Button variant="ghost" className="text-muted-foreground" onClick={handleClearForm}>
            {t('publish.clear')}
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
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('publish.visualGallery')}</h2>
              {images.length > 1 && (
                <p className="text-xs text-muted-foreground mt-0.5">{t('publish.dragReorderHint')}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {t('publish.photosCount', { count: images.length })}
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
                onClick={() => idx !== 0 && setCoverIndex(idx)}
              >
                <img 
                  src={img} 
                  alt={`Listing image ${idx + 1}`} 
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                
                {/* Cover badge */}
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-1 rounded bg-primary text-primary-foreground">
                    {t('publish.cover')}
                  </span>
                )}
                
                {/* Drag handle indicator */}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
                
                {/* Remove button */}
                <button 
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Position indicator */}
                <span className="absolute bottom-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/80 text-foreground">
                  {idx + 1}
                </span>
              </div>
            ))}
            
            {/* Add image button */}
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
                    <span className="text-sm font-medium">{t('publish.addPhoto')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Listing Type */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">{t('publish.listingType')}</h2>
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
                  <span className="text-sm font-medium">{t(option.labelKey)}</span>
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
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
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
                            {location.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {location.address}
                              </p>
                            )}
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
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(${location.lng},${location.lat})/${location.lng},${location.lat},13,0/800x400@2x?access_token=pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWoyMmNmazMwN3dxM2ZxMWx6YWh6NWNpIn0.1ktomA51sIeX7o7QGB2y9w`}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnetworx" 
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
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
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
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(${location.lng},${location.lat})/${location.lng},${location.lat},13,0/800x400@2x?access_token=pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWoyMmNmazMwN3dxM2ZxMWx6YWh6NWNpIn0.1ktomA51sIeX7o7QGB2y9w`}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnetworx" 
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
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
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
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(${location.lng},${location.lat})/${location.lng},${location.lat},13,0/800x400@2x?access_token=pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWoyMmNmazMwN3dxM2ZxMWx6YWh6NWNpIn0.1ktomA51sIeX7o7QGB2y9w`}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Publish Button */}
              <Button 
                type="submit" 
                variant="carnetworx" 
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
      <Suspense fallback={null}>
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedImageSrc('');
          }}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
        />
      </Suspense>

      {/* Location Picker Modal */}
      <Suspense fallback={null}>
        <LocationPicker
          open={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onLocationSelect={setLocation}
          initialLocation={location}
        />
      </Suspense>

      {/* VIN Scanner Modal */}
      <Suspense fallback={null}>
        <VinScanner
          open={vinScannerOpen}
          onClose={() => setVinScannerOpen(false)}
          onVehicleDetected={handleVinDetected}
        />
      </Suspense>
    </div>
  );
}
