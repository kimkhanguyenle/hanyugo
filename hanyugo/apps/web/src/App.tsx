import { useEffect, useState } from "react";
import type { HealthResponse } from "@hanyugo/shared";

type ApiStatus = "checking" | "online" | "offline";

function useApiHealth(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json() as Promise<HealthResponse>)
      .then((data) => {
        if (!cancelled) setStatus(data.ok ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

function StatusPill({ status }: { status: ApiStatus }) {
  const label =
    status === "checking" ? "Checking API…" : status === "online" ? "API online" : "API offline";
  const color =
    status === "online"
      ? "bg-brand-green/10 text-brand-greenDark"
      : status === "offline"
      ? "bg-red-100 text-red-700"
      : "bg-slate-200 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function App() {
  const apiStatus = useApiHealth();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green text-xl font-bold text-white">
            你
          </div>
          <div>
            <h1 className="text-lg font-semibold">HanyuGo</h1>
            <p className="text-sm text-slate-500">Learn Mandarin at your own pace</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-slate-50 p-4">
          <p className="mb-1 text-sm font-medium text-slate-700">你好 (nǐ hǎo)</p>
          <p className="text-xs text-slate-500">hello — your first HSK 1 word</p>
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-0 rounded-full bg-brand-green transition-all" />
        </div>

        <div className="flex items-center justify-between">
          <StatusPill status={apiStatus} />
          <span className="text-xs text-slate-400">Stage 1 · HSK 1 scaffold</span>
        </div>
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-slate-400">
        This is the project skeleton. Lessons, pinyin practice, and the review notebook get built
        on top of this in the steps that follow.
      </p>
    </div>
  );
}
