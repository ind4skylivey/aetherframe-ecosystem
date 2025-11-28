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
  const { data: status, loading: loadStatus } = useFetch("/status", []);
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
        {loadStatus ? <span>Loading…</span> : <pre>{JSON.stringify(status, null, 2)}</pre>}
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
                  #{j.id} {j.status} target={j.target} plugin={j.plugin_id ?? "-"}
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
                  {e.event_type} job={e.job_id ?? "-"} payload={JSON.stringify(e.payload)}
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
