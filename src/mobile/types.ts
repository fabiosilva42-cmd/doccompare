export type JobPhase = "download" | "convert" | "transcribe" | "summarize" | "upload";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface TopicSegment {
  topic: string;
  start_time: string;
  end_time: string;
  description: string;
}

export interface VideoSummaryResponse {
  video_url: string;
  audio_url: string;
  summary: string;
  topics: TopicSegment[];
  platform: string;
  video_title: string;
  duration: number;
  language: string;
  processed_at: string;
}

export interface UploadJobRef {
  job_id: string;
  filename: string;
  summary_id: string;
}

export interface UploadJobsResponse {
  jobs: UploadJobRef[];
}

export interface JobProgress {
  phase: JobPhase;
  percent: number;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  error: string | null;
  progress: JobProgress | null;
  result: VideoSummaryResponse | null;
  updated_at: string;
}

export interface HistoryRecord {
  _id: string;
  user_id: string;
  device_id: string;
  job_id: string;
  video_url: string;
  video_title: string;
  platform: string;
  summary: string;
  topics: TopicSegment[];
  video_file_url: string;
  audio_file_url: string;
  status: "completed" | "failed" | "processing";
  processing_error: string | null;
  created_at: string;
}

export type SseEvent =
  | { type: "heartbeat"; ok: boolean }
  | { type: "progress"; phase: JobPhase; percent: number; message: string }
  | ({ type: "complete" } & VideoSummaryResponse)
  | { type: "error"; message: string };
