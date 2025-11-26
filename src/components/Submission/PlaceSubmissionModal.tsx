import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationPicker } from './LocationPicker';
import { PlaceSubmissionValidator } from '@/lib/submission-validator';
import { SubmissionService } from '@/lib/submission-service';
import { Loader2, CheckCircle, MapPin, Camera, Star } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast'; // Assuming you have a toast hook

interface PlaceSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PlaceSubmissionModal({ isOpen, onClose }: PlaceSubmissionModalProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        placeName: '',
        category: '',
        description: '',
        address: '',
        city: '',
        state: '',
        latitude: 0,
        longitude: 0,
        priceRange: 2,
        dietary: [] as string[],
        bestTime: [] as string[],
        tags: '',
        photos: [] as string[], // For now just URLs or base64 placeholders
        personalTip: '',
        visitDate: '',
        userRating: 0
    });
    const [errors, setErrors] = useState<string[]>([]);
    // const { toast } = useToast(); // Uncomment if toast is available

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address,
            // Extract city/state from address if possible (simplified here)
            city: address.split(',').slice(-3)[0]?.trim() || '',
            state: address.split(',').slice(-2)[0]?.trim() || ''
        }));
    };

    const validateStep = () => {
        setErrors([]);
        if (step === 1) {
            if (!formData.placeName || formData.placeName.length < 3) return ['Name is too short'];
            if (!formData.category) return ['Please select a category'];
            if (!formData.description || formData.description.length < 20) return ['Description is too short'];
        }
        if (step === 2) {
            if (!formData.latitude || !formData.longitude) return ['Please pin the location on the map'];
            if (!formData.address) return ['Address is required'];
        }
        return [];
    };

    const handleNext = () => {
        const stepErrors = validateStep();
        if (stepErrors.length > 0) {
            setErrors(stepErrors);
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors([]);

        // Final validation
        const validation = PlaceSubmissionValidator.validateSubmission(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            setIsSubmitting(false);
            return;
        }

        // Prepare submission object
        const submissionPayload = {
            basicInfo: {
                name: formData.placeName,
                category: formData.category,
                description: formData.description,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            },
            location: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                coordinates: { lat: formData.latitude, lng: formData.longitude }
            },
            details: {
                priceRange: formData.priceRange,
                dietaryOptions: formData.dietary,
                bestTime: formData.bestTime,
                userRating: formData.userRating
            },
            media: {
                photos: formData.photos,
                hasPhotos: formData.photos.length > 0
            },
            personal: {
                tip: formData.personalTip,
                visitDate: formData.visitDate || null,
                submittedBy: { id: 'user_123', name: 'Current User', email: 'user@example.com' }, // Mock user
                submittedAt: new Date().toISOString()
            }
        };

        const result = await SubmissionService.submitPlace(submissionPayload);

        setIsSubmitting(false);
        if (result.success) {
            // toast({ title: "Success!", description: "Place submitted for review." });
            alert("Place submitted successfully! It will be reviewed shortly.");
            onClose();
            setStep(1); // Reset
            // Reset form data...
        } else {
            setErrors([result.error || 'Submission failed']);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: // Basic Info
                return (
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="placeName">Place Name *</Label>
                            <Input
                                id="placeName"
                                value={formData.placeName}
                                onChange={(e) => handleInputChange('placeName', e.target.value)}
                                placeholder="e.g. Sunset Viewpoint"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select onValueChange={(val) => handleInputChange('category', val)} value={formData.category}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                                    <SelectItem value="cafe">☕ Cafe</SelectItem>
                                    <SelectItem value="attraction">🏛️ Attraction</SelectItem>
                                    <SelectItem value="park">🌳 Park/Nature</SelectItem>
                                    <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                                    <SelectItem value="hotel">🏨 Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="What makes this place special?"
                            />
                        </div>
                    </div>
                );
            case 2: // Location
                return (
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Pin Location on Map *</Label>
                            <LocationPicker onLocationSelect={handleLocationSelect} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Full address will appear here"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3: // Details & Experience
                return (
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Your Rating</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-6 w-6 cursor-pointer ${star <= formData.userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        onClick={() => handleInputChange('userRating', star)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => handleInputChange('tags', e.target.value)}
                                placeholder="scenic, romantic, budget-friendly"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tip">Pro Tip</Label>
                            <Textarea
                                id="tip"
                                value={formData.personalTip}
                                onChange={(e) => handleInputChange('personalTip', e.target.value)}
                                placeholder="Best time to visit, what to order..."
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Place</DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Location' : 'Details'}
                    </DialogDescription>
                </DialogHeader>

                {renderStepContent()}

                {errors.length > 0 && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {errors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < 3 ? (
                        <Button onClick={handleNext}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Place'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
