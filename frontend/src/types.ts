/** The shapes the panel reads from Home Assistant and from TankKeeper's commands. */

export interface Message {
  type: string;
  [key: string]: unknown;
}

export interface HassConnection {
  sendMessagePromise<T>(message: Message): Promise<T>;
}

/** The panel Home Assistant registered. TankKeeper puts its config entry id in config. */
export interface PanelInfo {
  config?: { entry_id?: string };
}

/** Where Home Assistant's router has the panel. */
export interface Route {
  prefix: string;
  path: string;
}

export interface HomeAssistant {
  connection: HassConnection;
  config?: { time_zone: string };
}

export type Values = Record<string, unknown>;

export interface Field {
  name: string;
  label: string;
  type:
    "text" | "textarea" | "number" | "date" | "time" | "select" | "list" | "checkbox" | "weekdays";
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
  /** The conversation's name, or "deleted conversation" once it is gone. get_history alone gives it. */
  conversation_name?: string | null;
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
  conversation_id?: string | null;
  changes: Change[];
  batch: boolean;
}

/** The tank's Assist agent, and whether a conversation agent is chosen for it to pass chat to. */
export interface ChatAgent {
  agent_id: string | null;
  ready: boolean;
  /** The agent the chat goes through, or null when there is none to use. */
  chat_agent: string | null;
  chat_agent_name: string | null;
}

/** What Home Assistant's conversation/process answers. */
export interface ConverseResult {
  conversation_id: string | null;
  response: {
    response_type: string;
    speech?: { plain?: { speech?: string } };
  };
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
  series_id: string | null;
}

/** A repeating task. Its occurrences are the tasks with its id as series_id. */
export interface Series {
  id: string;
  start: string;
  slot: string;
  text: string;
  note: string;
  every_days: number | null;
  weekdays: string[];
  until: string | null;
  skipped: string[];
  repeat: string;
}

export interface Reminders {
  notify: string[];
  status_notify: string[];
  task_time: string;
  dose_time: string;
  resend_time: string;
}

export interface ClaudeSettings {
  agent: string | null;
  ai_task: string | null;
  review_on: string[];
  comments: boolean;
  daily_time: string | null;
  daily_cap: number;
  /** The agent the chat uses: the chosen one, or the only other agent when none is chosen. */
  chat_agent: string | null;
  model_note: string;
}

export interface Plan {
  start: string;
  end: string;
  tasks: Task[];
  series: Series[];
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
  source?: string | null;
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
  /** True until the light has an automation and helpers. Nothing is set then. */
  needs_helpers: boolean;
  /** What the helpers hold now. A value is null when its helper is missing or holds none. */
  schedule: LightSchedule | null;
  automation: { entity_id: string; state: string | null; id: string | null } | null;
  problem: boolean;
  /** Each problem in words. */
  problems: string[];
  on_periods: [string, string][];
}

export interface LightSchedule {
  on: string | null;
  off: string | null;
  brightness_pct: number | null;
  ramp_minutes: number | null;
}

export interface LightInfo {
  today: string;
  lights: Light[];
  next_change: { time: string } | null;
}

/** Where a search found its words: snippet[start:end] is the match. index is the message's, for a message. */
export interface SearchMatch {
  field: "message" | "title" | "summary";
  index: number | null;
  role: string | null;
  snippet: string;
  start: number;
  end: number;
}

export interface Conversation {
  id: string;
  source: string;
  started: string;
  updated: string;
  title: string;
  /** The title, or the first thing the owner said when there is none. */
  name: string;
  summary: string;
  /** Only in search results. */
  match?: SearchMatch;
}

/** What the first delete_conversation call answers: what goes, and the code that confirms it. */
export interface DeleteAsked {
  conversation_id: string;
  name: string;
  messages: number;
  changes: number;
  code: string;
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

export interface Review {
  id: string;
  time: string;
  triggers: string[];
  level: string;
  result: string;
  asked: boolean;
  comment: string | null;
  note: string | null;
  proposal_ids: string[];
}

export interface PhotoCheck {
  id: string;
  time: string;
  reason: "daily" | "test" | "manual" | "chat";
  content_type: string | null;
  asked: boolean;
  summary: string | null;
  issue: boolean;
  suggestion: string | null;
  seen: Record<string, string>;
  note: string | null;
  state: "open" | "dismissed" | "accepted" | "rejected" | null;
  proposal_ids: string[];
  photo_url: string | null;
  embed: string | null;
}

export interface CameraInfo {
  camera: string | null;
  check_time: string | null;
  after_test: boolean;
  alerts: boolean;
  keep_days: number;
  check_plants: boolean;
  check_fish: boolean;
  latest: PhotoCheck | null;
  open: PhotoCheck[];
}
