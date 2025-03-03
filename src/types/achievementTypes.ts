
export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  reward: string;
  icon: string;
  progress: number;
  unlocked: boolean;
  claimed?: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  claimed: boolean;
  created_at: string;
  updated_at: string;
}
