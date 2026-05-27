// Mock data for the /spot landing page: past chats + Spot's queue.
// In a real build these would come from the conversation store and
// the agent dispatch log respectively.

export type PastChat = {
  id: string;
  title: string;
  scope: string;
  when: string;
  preview: string;
};

export const PAST_CHATS: PastChat[] = [
  {
    id: "c1",
    title: "Launch campaign — Banerghatta",
    scope: "Godrej Banerghatta",
    when: "2h ago",
    preview: "Aligned on persona mix · approved 3 angles · briefing Creative Agent.",
  },
  {
    id: "c2",
    title: "Persona research — NRI buyers",
    scope: "Workspace",
    when: "Yesterday",
    preview: "Pulled 1,820 records into the Returning NRI graph.",
  },
  {
    id: "c3",
    title: "Diagnose week — CPL spike",
    scope: "Godrej Eternity",
    when: "Tue",
    preview: "CPL up ₹240 across Meta · recommended pausing 2 ad sets.",
  },
  {
    id: "c4",
    title: "Lookalike build — Top BOFU 30d",
    scope: "Workspace",
    when: "Mon",
    preview: "Built audience · pushed to Meta + Google.",
  },
];

export type QueueStatus = "needs-approval" | "running" | "done";

export type QueueItem = {
  id: string;
  status: QueueStatus;
  title: string;
  detail: string;
  when: string;
  /** Sub-agent that owns this work, surfaces as a tiny tag. */
  agent?: "Creative" | "Media" | "Voice" | "WhatsApp" | "Enrichment";
};

export const SPOT_QUEUE: QueueItem[] = [
  {
    id: "q1",
    status: "needs-approval",
    title: "3 angles ready · The Returning NRI",
    detail: "RERA-trust, Return-Home Asset, Parent-Care. Approve to brief the Creative Agent.",
    when: "4h ago",
    agent: "Creative",
  },
  {
    id: "q2",
    status: "needs-approval",
    title: "Media plan · Godrej Air — first week",
    detail: "₹4.2L across Meta (62%) · Google (28%) · WhatsApp (10%). Review allocation.",
    when: "Yesterday",
    agent: "Media",
  },
  {
    id: "q3",
    status: "running",
    title: "Enriching 318 NRI leads",
    detail: "Truecaller · Surepass · LinkedIn match in progress.",
    when: "Now",
    agent: "Enrichment",
  },
  {
    id: "q4",
    status: "done",
    title: "Built audience · Top BOFU 30d",
    detail: "Pushed to Meta + Google. Ready to use in any campaign.",
    when: "1h ago",
    agent: "Media",
  },
  {
    id: "q5",
    status: "done",
    title: "Generated 12 creative shells · Tech-Lead",
    detail: "Live on Creatives. 4 statics need final copy.",
    when: "3h ago",
    agent: "Creative",
  },
];
