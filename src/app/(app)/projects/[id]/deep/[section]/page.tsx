"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { getProject, type ProjectDetail } from "@/lib/project-data";
import { CampaignsDeepDive } from "@/components/project/deep-dive/campaigns-deep-dive";
import { PersonasDeepDive } from "@/components/project/deep-dive/personas-deep-dive";
import { LibraryDeepDive } from "@/components/project/deep-dive/library-deep-dive";
import { DashboardDeepDive } from "@/components/project/deep-dive/dashboard-deep-dive";
import { SpotSidePanel } from "@/components/project/deep-dive/spot-side-panel";

type Section = "campaigns" | "personas" | "library" | "dashboard";

const SECTION_TITLES: Record<Section, string> = {
  campaigns: "Campaigns",
  personas: "Personas",
  library: "Library",
  dashboard: "Dashboard",
};

export default function DeepDivePage() {
  const params = useParams<{ id: string; section: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const id = (params?.id || "").toString();
  const sectionParam = (params?.section || "").toString() as Section;
  const project = getProject(id);

  // Hide the global sidebar + spot dock while the deep-dive overlay is up
  // by toggling a data attribute on body. The CSS rule (added in
  // globals.css for this attribute) handles the hiding.
  useEffect(() => {
    document.body.setAttribute("data-deep-dive", "1");
    return () => document.body.removeAttribute("data-deep-dive");
  }, []);

  if (!project) {
    return (
      <DeepDiveShell
        title="Project not found"
        sub="—"
        section={sectionParam}
        onExit={() => router.push("/projects")}
      >
        <div className="card-base p-8 text-center text-[12.5px] text-text-tertiary">
          We couldn&apos;t find this project.
        </div>
      </DeepDiveShell>
    );
  }

  if (!isValidSection(sectionParam)) {
    return (
      <DeepDiveShell
        title="Unknown section"
        sub="Pick a valid section"
        section="campaigns"
        onExit={() => router.push(`/projects/${id}`)}
      >
        <div className="card-base p-8 text-center text-[12.5px] text-text-tertiary">
          The section &quot;{sectionParam}&quot; doesn&apos;t exist. Available sections:
          campaigns, personas, library, dashboard.
        </div>
      </DeepDiveShell>
    );
  }

  const focusSpot = search.get("focus") === "spot";

  return (
    <DeepDiveShell
      title={project.name.split(" · ")[0]}
      sub={`${SECTION_TITLES[sectionParam]} · Deep dive`}
      section={sectionParam}
      onExit={() => router.push(`/projects/${id}`)}
    >
      <SectionBody project={project} section={sectionParam} focusSpot={focusSpot} />
    </DeepDiveShell>
  );
}

function isValidSection(s: string): s is Section {
  return s === "campaigns" || s === "personas" || s === "library" || s === "dashboard";
}

function SectionBody({
  project,
  section,
  focusSpot,
}: {
  project: ProjectDetail;
  section: Section;
  focusSpot: boolean;
}) {
  return (
    <div
      className="grid h-full"
      style={{ gridTemplateColumns: "1fr 360px", gap: 0 }}
    >
      <div className="overflow-y-auto" style={{ padding: "20px 28px" }}>
        {section === "campaigns" && <CampaignsDeepDive project={project} />}
        {section === "personas" && <PersonasDeepDive project={project} />}
        {section === "library" && <LibraryDeepDive project={project} />}
        {section === "dashboard" && <DashboardDeepDive project={project} />}
      </div>
      <SpotSidePanel project={project} section={section} autoFocus={focusSpot} />
    </div>
  );
}

function DeepDiveShell({
  title,
  sub,
  section,
  onExit,
  children,
}: {
  title: string;
  sub: string;
  section: Section;
  onExit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-page)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-6 py-2.5"
        style={{
          background: "#FFF",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={12} /> Back to project
        </button>
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className="text-[13.5px] font-semibold truncate">{title}</span>
          <span className="text-[11.5px] text-text-tertiary">· {sub}</span>
        </div>
        <SectionSwitcher current={section} projectId={getProjectIdFromExit()} />
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary"
          title="Exit deep dive"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function SectionSwitcher({
  current,
  projectId,
}: {
  current: Section;
  projectId: string;
}) {
  const router = useRouter();
  const sections: Section[] = ["dashboard", "personas", "campaigns", "library"];
  return (
    <div
      className="inline-flex items-center rounded-button overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "#FFF" }}
    >
      {sections.map((s, i) => {
        const active = s === current;
        return (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/projects/${projectId}/deep/${s}`)}
            className="h-7 px-2.5 text-[11px] font-medium transition-colors"
            style={{
              background: active ? "#1A1A1A" : "transparent",
              color: active ? "#FFF" : "var(--text-2)",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            {SECTION_TITLES[s]}
          </button>
        );
      })}
    </div>
  );
}

// Helper: extracts the project id from the URL. The shell needs it to
// build the section-switch links, but doesn't receive it directly.
function getProjectIdFromExit(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/\/projects\/([^/]+)\//);
  return m?.[1] ?? "";
}
