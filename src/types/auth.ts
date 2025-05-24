
// Common types for authentication and user profiles
export interface UserProfile {
  userId: string;
  email: string | undefined;
  userType: string | null;
  subscriptionType?: string;
  accessToken?: string;
  // Adding fields to match the Supabase schema
  id?: string; // For compatibility with Supabase profiles table
}

// Export other common types that might be needed
export interface SubscriptionStatus {
  type: string;
  isActive: boolean;
  endDate: string | null;
  usageCount: number;
  usageLimit: number | null;
}
