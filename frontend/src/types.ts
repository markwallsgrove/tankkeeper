/** The shapes the panel reads from Home Assistant and from Tankkeeper's commands. */

export interface Message {
  type: string;
  [key: string]: unknown;
}

export interface HassConnection {
  sendMessagePromise<T>(message: Message): Promise<T>;
}

export interface HomeAssistant {
  connection: HassConnection;
  config?: { time_zone: string };
}

export type Values = Record<string, unknown>;

export interface Field {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "time" | "select" | "list";
  options?: string[];
  required?: boolean;
  step?: string;
}

export interface Change {
  collection: string;
  record_id: string;
  before: Values | null;
  after: Values | null;
}

export interface HistoryEntry {
  id: string;
  time: string;
  source: string;
  conversation_id: string | null;
  summary: string;
  proposal_id: string | null;
  user_id: string | null;
  changes: Change[];
}

export interface Changed {
  applied?: boolean;
  history?: HistoryEntry;
}

export interface Proposal {
  proposal_id: string;
  state: string;
  created: string;
  source: string;
  summary: string;
  reason: string;
  evidence?: string | null;
  changes: Change[];
  batch: boolean;
}

export type Level = "on_course" | "watch" | "act";

export type Stage = "cycling" | "cycled";

export interface RuleResult {
  rule: string;
  level: Level;
  reason: string;
  action: string | null;
}

export interface Status {
  status: Level | null;
  checked: string | null;
  rules: RuleResult[];
  stage: Stage | null;
  settings: Record<string, number>;
}

export interface Task {
  id: string;
  date: string;
  slot: string;
  time: string | null;
  text: string;
  state: "open" | "complete" | "skip";
  note: string | null;
}

export interface Reminders {
  notify: string[];
  status_notify: string[];
  task_time: string;
  dose_time: string;
  resend_time: string;
}

export interface Plan {
  start: string;
  end: string;
  tasks: Task[];
  reminders: Reminders;
}

export interface LogEntry {
  id: string;
  kind: string;
  time: string;
  source?: string;
  values?: Record<string, number>;
  product?: string;
  amount_ml?: number;
  why?: string | null;
  notes?: string | null;
  tasks?: string[];
  water_litres?: number | null;
  water_change_percent?: number | null;
}

export interface Tank {
  name: string;
  volume_litres: number;
  dosing_volume_litres: number | null;
  temperature_c: number | null;
  notes: string;
  stage?: string | null;
}

export interface Water {
  source?: string;
  ph?: number | null;
  gh?: number | null;
  kh?: number | null;
  nitrate?: number | null;
  phosphate?: number | null;
  notes?: string;
}

export interface TankInfo {
  tank: Tank;
  water: Water | null;
  proposals_waiting: number;
}

export interface Light {
  id: string;
  entity_id: string;
  model: string;
  control: string;
  on: string;
  off: string;
  brightness_pct: number | null;
  ramp_minutes: number;
  today: { day: string; on: string; off: string };
  state: string | null;
  problem: string | null;
  on_periods: [string, string][];
}

export interface LightInfo {
  today: string;
  lights: Light[];
  next_change: { time: string } | null;
}

export interface Conversation {
  id: string;
  source: string;
  started: string;
  updated: string;
  title: string;
  summary: string;
}

export interface ConversationDetail extends Conversation {
  messages: { role: string; text: string }[];
  changes: HistoryEntry[];
}

export interface Decision {
  number: number;
  title: string;
  date: string;
  status: string;
  replaced_by: number | null;
}

export interface DecisionDetail extends Decision {
  decision: string;
  why: string;
  open: string[];
  replaces: number[];
}
