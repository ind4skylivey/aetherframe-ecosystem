import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = () => {
    setLoading(true);
    fetch(`${API_BASE}${path}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
}

function App() {
  const { data: status, loading: loadStatus, refetch: refetchStatus } = useFetch("/status", []);
  const { data: plugins, loading: loadPlugins, refetch: refetchPlugins } = useFetch("/plugins", [status]);
  const { data: jobs, loading: loadJobs, refetch: refetchJobs } = useFetch("/jobs", [status]);
  const { data: events, loading: loadEvents, refetch: refetchEvents } = useFetch("/events", [status]);

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
      <header>
        <h1>Reveris Noctis</h1>
        <p>Thin web stub hooked to AetherFrame API ({API_BASE})</p>
      </header>

      <section className="status">
        <h2>Status</h2>
        {loadStatus ? (
          <span>Loading…</span>
        ) : (
          <div className="grid">
            <div className="card">
              <div className="row">
                <strong>Celery</strong>
                <span className={`pill ${status?.celery === "up" ? "pill-completed" : "pill-failed"}`}>
                  {status?.celery}
                </span>
              </div>
              <div className="meta">Env: {status?.env}</div>
            </div>
            <div className="card">
              <h4>Counts</h4>
              <ul>
                <li>Jobs: {status?.metrics?.jobs_total ?? 0}</li>
                <li>Plugins: {status?.metrics?.plugins_total ?? 0}</li>
                <li>Events: {status?.metrics?.events_total ?? 0}</li>
              </ul>
            </div>
            <div className="card">
              <h4>Jobs by status</h4>
              <ul>
                {status?.metrics?.jobs_by_status &&
                  Object.entries(status.metrics.jobs_by_status).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v}
                    </li>
                  ))}
              </ul>
              <div className="meta">
                Avg elapsed: {status?.metrics?.avg_elapsed_sec !== null ? `${status?.metrics?.avg_elapsed_sec}s` : "n/a"}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid">
        <div className="card">
          <h3>Create Plugin</h3>
          <form onSubmit={submitPlugin}>
            <label>
              Name
              <input value={pluginForm.name} onChange={(e) => setPluginForm({ ...pluginForm, name: e.target.value })} required />
            </label>
            <label>
              Version
              <input
                value={pluginForm.version}
                onChange={(e) => setPluginForm({ ...pluginForm, version: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <input
                value={pluginForm.description}
                onChange={(e) => setPluginForm({ ...pluginForm, description: e.target.value })}
              />
            </label>
            <button type="submit" disabled={busy}>
              Save
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Create Job</h3>
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
              Submit
            </button>
          </form>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Plugins</h3>
          {loadPlugins ? (
            "Loading…"
          ) : (
            <ul>
              {plugins?.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> {p.version} — {p.description || "n/a"}
                </li>
              )) || "None"}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Jobs</h3>
          {loadJobs ? (
            "Loading…"
          ) : (
            <ul>
              {jobs?.map((j) => (
                <li key={j.id}>
                  <div className="row">
                    <span>#{j.id}</span>
                    <span className={`pill pill-${j.status}`}>{j.status}</span>
                  </div>
                  <div>target={j.target}</div>
                  <div>plugin={j.plugin_id ?? "-"}</div>
                  {j.result?.elapsed_sec && <div>elapsed={j.result.elapsed_sec}s</div>}
                </li>
              )) || "None"}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Events</h3>
          {loadEvents ? (
            "Loading…"
          ) : (
            <ul>
              {events?.map((e) => (
                <li key={e.id}>
                  <div className="row">
                    <span>{e.event_type}</span>
                    <span className="meta">job={e.job_id ?? "-"}</span>
                  </div>
                  <div className="mono small">{JSON.stringify(e.payload)}</div>
                </li>
              )) || "None"}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
