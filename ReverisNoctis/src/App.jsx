import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // initial mount only
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const refetch = () => {
    if (!initialized) setLoading(true);
    else setRefreshing(true);
    fetch(`${API_BASE}${path}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(setError)
      .finally(() => {
        if (!initialized) {
          setInitialized(true);
          setLoading(false);
        }
        setRefreshing(false);
      });
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // simple auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tick > 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, refreshing, error, refetch };
}

function App() {
  const { data: status, loading: loadStatus, refreshing: refreshingStatus, refetch: refetchStatus } = useFetch("/status", []);
  const { data: plugins, loading: loadPlugins, refreshing: refreshingPlugins, refetch: refetchPlugins } = useFetch("/plugins", [status]);
  const { data: jobs, loading: loadJobs, refreshing: refreshingJobs, refetch: refetchJobs } = useFetch("/jobs", [status]);
  const { data: events, loading: loadEvents, refreshing: refreshingEvents, refetch: refetchEvents } = useFetch("/events", [status]);

  const [pluginForm, setPluginForm] = useState({ name: "", version: "0.1.0", description: "" });
  const [jobForm, setJobForm] = useState({ target: "", plugin_id: "" });
  const [busy, setBusy] = useState(false);

  const submitPlugin = async (e) => {
    e.preventDefault();
    setBusy(true);
    await fetch(`${API_BASE}/plugins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pluginForm.name,
        version: pluginForm.version,
        description: pluginForm.description || null,
      }),
    });
    setPluginForm({ name: "", version: "0.1.0", description: "" });
    refetchPlugins();
    setBusy(false);
    refetchStatus();
  };

  const submitJob = async (e) => {
    e.preventDefault();
    setBusy(true);
    await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: jobForm.target,
        plugin_id: jobForm.plugin_id ? Number(jobForm.plugin_id) : null,
      }),
    });
    setJobForm({ target: "", plugin_id: "" });
    refetchJobs();
    // allow worker to emit events
    setTimeout(() => {
      refetchEvents();
      refetchStatus();
    }, 1000);
    setBusy(false);
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Livey Operations Console</p>
          <h1>Reveris Noctis</h1>
          <p className="lede">
            Command surface for AetherFrame ({API_BASE}) — launch plugins, queue jobs, watch events and feel the current spike.
          </p>
          <div className="tags">
            <span className="chip">Celery {status?.celery || "…"}</span>
            <span className="chip">Env {status?.env || "…"}</span>
            <span className="chip">Auto-refresh 10s</span>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="label">Jobs</div>
            <div className="value">{status?.metrics?.jobs_total ?? "…"}</div>
          </div>
          <div className="hero-metric">
            <div className="label">Plugins</div>
            <div className="value">{status?.metrics?.plugins_total ?? "…"}</div>
          </div>
          <div className="hero-metric">
            <div className="label">Events</div>
            <div className="value">{status?.metrics?.events_total ?? "…"}</div>
          </div>
        </div>
      </header>

      <div className="section-title">
        <h2>Telemetry Stack</h2>
        <span className="meta">Refreshed every 10s</span>
      </div>
      {loadStatus && <span className="meta">Loading status…</span>}
      {!loadStatus && refreshingStatus && <span className="meta">Syncing…</span>}
      <div className="panel-grid">
        <div className="panel pulse">
          <strong>Celery link</strong>
          <div className="stat-grid">
            <div className="stat-pill">
              <span className="inline">
                <span className="status-dot" />
                Env
              </span>
              <span className="mono">{status?.env}</span>
            </div>
            <div className="stat-pill">
              <span className="inline">
                <span className="status-dot" />
                Celery
              </span>
              <span className={`pill pill-${status?.celery === "up" ? "completed" : "failed"}`}>{status?.celery}</span>
            </div>
          </div>
          <div className="divider" />
          <div className="tiny">Signals flow on host:8000</div>
        </div>

        <div className="panel">
          <strong>Counts</strong>
          <div className="stat-grid">
            <div className="stat-pill">
              Jobs <span className="mono">{status?.metrics?.jobs_total ?? 0}</span>
            </div>
            <div className="stat-pill">
              Plugins <span className="mono">{status?.metrics?.plugins_total ?? 0}</span>
            </div>
            <div className="stat-pill">
              Events <span className="mono">{status?.metrics?.events_total ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <strong>Job Health</strong>
          <div className="jobs-status">
            {status?.metrics?.jobs_by_status &&
              Object.entries(status.metrics.jobs_by_status).map(([k, v]) => (
                <div className="stat-pill" key={k}>
                  <span className={`pill pill-${k === "failed" ? "failed" : k === "completed" ? "completed" : k === "running" ? "running" : "pending"}`}>
                    <span className="pill-dot" /> {k}
                  </span>
                  <span className="mono">{v}</span>
                </div>
              ))}
          </div>
          <div className="section-foot">
            <span>Avg elapsed</span>
            <span className="mono">
              {status?.metrics?.avg_elapsed_sec !== null && status?.metrics?.avg_elapsed_sec !== undefined
                ? `${status.metrics.avg_elapsed_sec}s`
                : "n/a"}
            </span>
          </div>
        </div>
      </div>

      <div className="section-title">
        <h2>Launch Bay</h2>
        <span className="meta">Create plugins and queue jobs</span>
      </div>
      <div className="split">
        <div className="panel">
          <strong>Create Plugin</strong>
          <p className="meta lean">Register a payload or module; versions are free text.</p>
          <form onSubmit={submitPlugin}>
            <label>
              Name
              <input value={pluginForm.name} onChange={(e) => setPluginForm({ ...pluginForm, name: e.target.value })} required />
            </label>
            <label>
              Version
              <input value={pluginForm.version} onChange={(e) => setPluginForm({ ...pluginForm, version: e.target.value })} required />
            </label>
            <label>
              Description
              <input value={pluginForm.description} onChange={(e) => setPluginForm({ ...pluginForm, description: e.target.value })} />
            </label>
            <button type="submit" disabled={busy}>
              Save plugin
            </button>
          </form>
        </div>

        <div className="panel">
          <strong>Create Job</strong>
          <p className="meta lean">Targets accept anything—host, file, label. Plugin ID optional.</p>
          <form onSubmit={submitJob}>
            <label>
              Target
              <input value={jobForm.target} onChange={(e) => setJobForm({ ...jobForm, target: e.target.value })} required />
            </label>
            <label>
              Plugin ID (optional)
              <input
                value={jobForm.plugin_id}
                onChange={(e) => setJobForm({ ...jobForm, plugin_id: e.target.value })}
                placeholder="e.g., 1"
              />
            </label>
            <button type="submit" disabled={busy}>
              Launch job
            </button>
          </form>
        </div>
      </div>

      <div className="section-title">
        <h2>Live Deck</h2>
        <span className="meta">Latest artifacts</span>
      </div>
      <div className="split">
        <div className="panel">
          <strong>Plugins</strong>
          {loadPlugins ? <p className="meta">Loading…</p> : null}
          {!loadPlugins && refreshingPlugins ? <p className="meta">Syncing…</p> : null}
          <ul className="list">
            {plugins?.map((p) => (
              <li key={p.id}>
                <div className="row">
                  <div className="inline">
                    <span className="avatar" />
                    <strong>{p.name}</strong>
                  </div>
                  <span className="pill pill-ghost">v{p.version}</span>
                </div>
                <div className="meta">{p.description || "n/a"}</div>
              </li>
            )) || <p className="meta">None yet.</p>}
          </ul>
        </div>

        <div className="panel">
          <strong>Jobs</strong>
          {loadJobs ? <p className="meta">Loading…</p> : null}
          {!loadJobs && refreshingJobs ? <p className="meta">Syncing…</p> : null}
          <ul className="list">
            {jobs?.map((j) => (
              <li key={j.id}>
                <div className="row">
                  <span className="mono">#{j.id}</span>
                  <span className={`pill pill-${j.status}`}>{j.status}</span>
                </div>
                <div className="meta">target={j.target}</div>
                <div className="meta">plugin={j.plugin_id ?? "-"}</div>
                {j.result?.elapsed_sec && <div className="meta">elapsed={j.result.elapsed_sec}s</div>}
              </li>
            )) || <p className="meta">No jobs yet.</p>}
          </ul>
        </div>

        <div className="panel">
          <strong>Events</strong>
          {loadEvents ? <p className="meta">Loading…</p> : null}
          {!loadEvents && refreshingEvents ? <p className="meta">Syncing…</p> : null}
          <ul className="list events">
            {events?.map((e) => (
              <li key={e.id}>
                <div className="row">
                  <span className="pill pill-ghost">{e.event_type}</span>
                  <span className="meta">job={e.job_id ?? "-"}</span>
                </div>
                <div className="mono small payload">
                  {JSON.stringify(e.payload)?.slice(0, 180)}
                  {JSON.stringify(e.payload)?.length > 180 ? " …" : ""}
                </div>
              </li>
            )) || <p className="meta">Nothing yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
