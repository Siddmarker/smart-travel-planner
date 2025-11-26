import { UserSubmission, SubmissionStatus, CommunityPlace } from '@/types';
import { PlaceSubmissionValidator } from './submission-validator';

const SUBMISSIONS_STORAGE_KEY = 'user_place_submissions';
const COMMUNITY_PLACES_STORAGE_KEY = 'community_places';

export class SubmissionService {

    // Submit a new place
    static async submitPlace(submissionData: Omit<UserSubmission, 'id' | 'status' | 'qualityScore' | 'moderationNotes'>): Promise<{ success: boolean; submissionId?: string; error?: string }> {
        try {
            // 1. Validate
            const validation = PlaceSubmissionValidator.validateSubmission({
                placeName: submissionData.basicInfo.name,
                category: submissionData.basicInfo.category,
                description: submissionData.basicInfo.description,
                latitude: submissionData.location.coordinates.lat,
                longitude: submissionData.location.coordinates.lng,
                address: submissionData.location.address,
                photos: submissionData.media.photos,
                userRating: submissionData.details.userRating
            });

            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // 2. Create full submission object
            const newSubmission: UserSubmission = {
                ...submissionData,
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'pending',
                qualityScore: 0, // Will be calculated
                moderationNotes: []
            };

            // 3. Calculate Quality Score
            newSubmission.qualityScore = PlaceSubmissionValidator.calculateQualityScore(newSubmission);

            // 4. Store in LocalStorage (Simulating Backend)
            const submissions = this.getStoredSubmissions();
            submissions.push(newSubmission);
            this.saveSubmissions(submissions);

            // 5. Auto-approve if high quality (Simulation)
            if ((newSubmission.qualityScore || 0) >= 0.8) {
                await this.approveSubmission(newSubmission.id);
                return { success: true, submissionId: newSubmission.id }; // Return success but it's approved
            }

            return { success: true, submissionId: newSubmission.id };
        } catch (error) {
            console.error('Submission error:', error);
            return { success: false, error: 'Failed to submit place.' };
        }
    }

    // Get all pending submissions (For Moderation)
    static getPendingSubmissions(): UserSubmission[] {
        const submissions = this.getStoredSubmissions();
        return submissions.filter(s => s.status === 'pending');
    }

    // Approve a submission
    static async approveSubmission(submissionId: string): Promise<boolean> {
        const submissions = this.getStoredSubmissions();
        const index = submissions.findIndex(s => s.id === submissionId);

        if (index === -1) return false;

        // Update status
        submissions[index].status = 'approved';
        this.saveSubmissions(submissions);

        // Convert to Community Place and store
        const submission = submissions[index];
        const communityPlace: CommunityPlace = {
            id: `community_${submission.id}`,
            name: submission.basicInfo.name,
            category: submission.basicInfo.category as any,
            lat: submission.location.coordinates.lat,
            lng: submission.location.coordinates.lng,
            rating: submission.details.userRating,
            reviews: 1, // Start with 1 review (the submitter)
            priceLevel: submission.details.priceRange as any,
            image: submission.media.photos[0] || '', // Use first photo
            description: submission.basicInfo.description,
            vicinity: submission.location.address,
            photos: submission.media.photos,
            categoryTags: submission.basicInfo.tags,

            // Community specific fields
            source: 'community',
            submittedBy: submission.personal.submittedBy.name,
            submittedAt: submission.personal.submittedAt,
            upvotes: 0,
            verified: false,
            tags: submission.basicInfo.tags
        };

        const communityPlaces = this.getStoredCommunityPlaces();
        communityPlaces.push(communityPlace);
        this.saveCommunityPlaces(communityPlaces);

        return true;
    }

    // Reject a submission
    static async rejectSubmission(submissionId: string, reason: string): Promise<boolean> {
        const submissions = this.getStoredSubmissions();
        const index = submissions.findIndex(s => s.id === submissionId);

        if (index === -1) return false;

        submissions[index].status = 'rejected';
        submissions[index].moderationNotes = [...(submissions[index].moderationNotes || []), reason];
        this.saveSubmissions(submissions);

        return true;
    }

    // Get Community Places (For Discovery)
    static getCommunityPlaces(): CommunityPlace[] {
        return this.getStoredCommunityPlaces();
    }

    // Helpers for LocalStorage
    private static getStoredSubmissions(): UserSubmission[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private static saveSubmissions(submissions: UserSubmission[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    }

    private static getStoredCommunityPlaces(): CommunityPlace[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(COMMUNITY_PLACES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private static saveCommunityPlaces(places: CommunityPlace[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(COMMUNITY_PLACES_STORAGE_KEY, JSON.stringify(places));
    }
}
