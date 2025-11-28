import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}${path}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

function App() {
  const { data: status, loading: loadStatus } = useFetch("/status", []);
  const { data: plugins, loading: loadPlugins } = useFetch("/plugins", [status]);
  const { data: jobs, loading: loadJobs } = useFetch("/jobs", [status]);
  const { data: events, loading: loadEvents } = useFetch("/events", [status]);

  return (
    <div className="page">
      <header>
        <h1>Reveris Noctis</h1>
        <p>Thin web stub hooked to AetherFrame API ({API_BASE})</p>
      </header>

      <section>
        <h2>Status</h2>
        {loadStatus ? <span>Loading…</span> : <pre>{JSON.stringify(status, null, 2)}</pre>}
      </section>

      <section className="grid">
        <div>
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
        <div>
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
        <div>
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
