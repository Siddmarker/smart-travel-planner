import { UserSubmission } from '@/types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class PlaceSubmissionValidator {
    static validateSubmission(formData: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Name validation
        if (!formData.placeName || formData.placeName.trim().length < 3) {
            errors.push('Place name must be at least 3 characters long');
        }

        if (this.hasSuspiciousName(formData.placeName)) {
            errors.push('Place name contains suspicious patterns');
        }

        // Category validation
        if (!formData.category) {
            errors.push('Please select a category');
        }

        // Description validation
        if (!formData.description || formData.description.trim().length < 20) {
            errors.push('Description must be at least 20 characters long');
        }

        // Location validation
        if (!formData.latitude || !formData.longitude) {
            errors.push('Please set location on map');
        }

        if (!formData.address || formData.address.trim().length < 10) {
            errors.push('Please provide a complete address');
        }

        // Photo validation
        if (formData.photos && formData.photos.length > 5) {
            errors.push('Maximum 5 photos allowed');
        }

        // Quality checks (warnings)
        if (formData.description && formData.description.trim().length < 50) {
            warnings.push('Consider providing a more detailed description (50+ characters)');
        }

        if (!formData.userRating || formData.userRating < 3) {
            warnings.push('Low ratings may require additional verification');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    static hasSuspiciousName(name: string): boolean {
        if (!name) return false;
        const suspiciousPatterns = [
            /^(test|demo|sample|example)/i,
            /[0-9]{10,}/, // Too many numbers
            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{3,}/, // Too many special chars
            /\.(com|net|org|in)$/i // Website-like
        ];

        return suspiciousPatterns.some(pattern => pattern.test(name));
    }

    static calculateQualityScore(submission: UserSubmission): number {
        let score = 0;
        const maxScore = 100;

        // 1. Completeness (30 points)
        if (submission.basicInfo.name) score += 10;
        if (submission.basicInfo.description?.length >= 50) score += 10;
        if (submission.location.coordinates) score += 10;

        // 2. Media Quality (20 points)
        if (submission.media.hasPhotos) score += 15;
        if (submission.media.photos?.length >= 3) score += 5;

        // 3. Detail Level (25 points)
        if (submission.details.userRating >= 4) score += 10;
        if (submission.personal.tip?.length >= 20) score += 10;
        if (submission.basicInfo.tags?.length >= 3) score += 5;

        // 4. User Trust Score (25 points)
        // Placeholder: In a real app, we'd check the user's history
        const userTrustScore = 15; // Default trust
        score += userTrustScore;

        return score / maxScore;
    }
}
