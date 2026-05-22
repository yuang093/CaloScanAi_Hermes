export interface FeedbackCreate {
  rating: number;
  feedback_type: "feature" | "bug" | "general";
  message: string;
}

export interface FeedbackResponse {
  id: string;
  user_id: string;
  rating: number;
  feedback_type: string;
  message: string;
  created_at: string;
}

export interface FeedbackStats {
  avg_rating: number;
  total_count: number;
  by_type: Record<string, number>;
}