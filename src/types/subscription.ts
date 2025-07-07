export interface SubscriptionDowngradeInfo {
  wasRecentlyDowngraded: boolean;
  previousSubscriptionType?: string;
  downgradeDate?: string;
  currentSubscriptionType?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  type: string;
  endDate?: Date | null;
  cancelled: boolean;
}