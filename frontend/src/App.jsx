
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8081/api/emergencies";

const initialResources = [
  { id: 1, name: "Drinking water", quantity: 240, unit: "packs", location: "Kochi Relief Centre" },
  { id: 2, name: "First-aid kits", quantity: 36, unit: "kits", location: "Calicut Medical Hub" },
  { id: 3, name: "Food packets", quantity: 180, unit: "packets", location: "Wayanad Relief Centre" },
];

const activities = [
  { icon: "↗", title: "Response team dispatched", detail: "Kerala flood response", time: "12 min ago" },
  { icon: "＋", title: "New resource request", detail: "Drinking water · Kozhikode", time: "35 min ago" },
  { icon: "♡", title: "Volunteer signed up", detail: "Medical assistance team", time: "48 min ago" },
  { icon: "⌂", title: "Shelter capacity updated", detail: "Wayanad relief centre", time: "1 hour ago" },
];

const menu = [
  ["Dashboard", "⌂"],
  ["Emergencies", "⚠"],
  ["Resources", "▦"],
  ["Volunteers", "♧"],
  ["Shelters", "⌂"],
];

function App() {
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [emergencies, setEmergencies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEmergencies, setLoadingEmergencies] = useState(true);
  const [resources, setResources] = useState(initialResources);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  // Load emergency reports saved in the backend database.
  async function loadEmergencies() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load emergency reports");
      }

      const data = await response.json();

      setEmergencies(
        data.map((item) => ({
          ...item,
          name: item.title,
          time: "Saved in database",
        }))
      );
    } catch (error) {
      console.error("Loading emergencies failed:", error);
      setNotice("Could not load emergencies. Check the backend on port 8081.");
    } finally {
      setLoadingEmergencies(false);
    }
  }

  useEffect(() => {
    loadEmergencies();
  }, []);

  const filteredEmergencies = useMemo(
    () =>
      emergencies.filter((item) =>
        `${item.name} ${item.location} ${item.type} ${item.severity}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [emergencies, search]
  );

  const filteredResources = useMemo(
    () =>
      resources.filter((item) =>
        `${item.name} ${item.location}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [resources, search]
  );

  async function submitForm(event) {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Save emergency reports to Spring Boot and PostgreSQL.
    if (modal === "Report an emergency") {
      setSaving(true);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: data.title,
            location: data.location,
            type: data.type,
            severity: data.severity,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const saved = await response.json();

        const item = {
          ...saved,
          name: saved.title,
          time: `Today, ${now}`,
        };

        setEmergencies((old) => [
          item,
          ...old.filter((existing) => existing.id !== item.id),
        ]);
        setReports((old) => [item, ...old]);
        setPage("Emergencies");
        setSearch("");
        setModal("");
        setSelectedEmergency(null);
        setNotice("Emergency report saved to the database.");
      } catch (error) {
        console.error("Saving emergency failed:", error);
        setNotice(
          "Could not save the emergency. Check the backend and try again."
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    // The following forms are still demo-only.
    if (modal === "Request resources") {
      setRequests((old) => [
        { ...data, id: Date.now(), time: now },
        ...old,
      ]);
      setPage("Resources");
    }

    if (modal === "Join as a volunteer") {
      setVolunteers((old) => [
        { ...data, id: Date.now(), time: now },
        ...old,
      ]);
      setPage("Volunteers");
    }

    if (modal === "Add a shelter") {
      setShelters((old) => [
        { ...data, id: Date.now(), time: now },
        ...old,
      ]);
      setPage("Shelters");
    }

    setModal("");
    setSearch("");
    setNotice(
      "Saved in this demo session. This form is not connected to the database yet."
    );
  }

  function openAction(action) {
    setSelectedEmergency(null);
    setModal(action);
  }

  function renderEmergencies() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Emergency reports</h2>
            <p>Review incidents and response status.</p>
          </div>
          <button
            className="button button-danger"
            onClick={() => openAction("Report an emergency")}
          >
            + Report incident
          </button>
        </div>

        {loadingEmergencies ? (
          <p className="muted">Loading saved emergencies...</p>
        ) : filteredEmergencies.length === 0 ? (
          <p className="empty">
            No matching emergencies. Try another search.
          </p>
        ) : (
          <div className="incident-list">
            {filteredEmergencies.map((item) => (
              <button
                className="incident-row"
                key={item.id}
                onClick={() => setSelectedEmergency(item)}
              >
                <span className={`severity-dot ${item.severity.toLowerCase()}`} />
                <span className="incident-main">
                  <strong>{item.name}</strong>
                  <small>
                    {item.location} · {item.type}
                  </small>
                </span>
                <span className={`pill ${item.severity.toLowerCase()}`}>
                  {item.severity}
                </span>
                <span className="incident-status">{item.status}</span>
                <span className="muted">{item.time}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        )}

        {selectedEmergency && (
          <div className="detail-box">
            <button
              className="close-button"
              onClick={() => setSelectedEmergency(null)}
            >
              ✕
            </button>
            <p className="eyebrow">INCIDENT DETAILS</p>
            <h3>{selectedEmergency.name}</h3>
            <p>{selectedEmergency.location}</p>
            <p>
              Type: {selectedEmergency.type} · Severity:{" "}
              {selectedEmergency.severity}
            </p>
            <p>Current status: {selectedEmergency.status}</p>
            <button
              className="button button-secondary"
              onClick={() => {
                setEmergencies((old) =>
                  old.map((item) =>
                    item.id === selectedEmergency.id
                      ? { ...item, status: "Team assigned" }
                      : item
                  )
                );
                setSelectedEmergency({
                  ...selectedEmergency,
                  status: "Team assigned",
                });
                setNotice(
                  "Status updated in the current page only; database status is unchanged."
                );
              }}
            >
              Mark team assigned
            </button>
          </div>
        )}
      </section>
    );
  }

  function renderResources() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Resource inventory</h2>
            <p>Relief supplies currently listed in the demo.</p>
          </div>
          <button
            className="button button-primary"
            onClick={() => openAction("Request resources")}
          >
            + Request supplies
          </button>
        </div>

        <div className="resource-grid">
          {filteredResources.map((item) => (
            <article className="resource-card" key={item.id}>
              <span className="resource-icon">▦</span>
              <h3>{item.name}</h3>
              <p>{item.location}</p>
              <strong>
                {item.quantity} <small>{item.unit}</small>
              </strong>
            </article>
          ))}
        </div>

        <h3 className="subheading">Requests submitted this session</h3>
        {requests.length === 0 ? (
          <p className="muted">No new requests yet.</p>
        ) : (
          requests.map((item) => (
            <div className="simple-row" key={item.id}>
              <strong>{item.item}</strong>
              <span>
                {item.quantity} {item.unit} · {item.location}
              </span>
            </div>
          ))
        )}
      </section>
    );
  }

  function renderVolunteers() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Volunteer coordination</h2>
            <p>People ready to help make a difference.</p>
          </div>
          <button
            className="button button-primary"
            onClick={() => openAction("Join as a volunteer")}
          >
            + Register volunteer
          </button>
        </div>

        <div className="people-grid">
          {[
            { name: "Ananya R.", role: "Medical support", initials: "AR" },
            { name: "Rahul K.", role: "Relief distribution", initials: "RK" },
            { name: "Meera S.", role: "Community outreach", initials: "MS" },
          ].map((person) => (
            <article className="person-card" key={person.name}>
              <span className="avatar">{person.initials}</span>
              <h3>{person.name}</h3>
              <p>{person.role}</p>
              <span className="online-dot">Available for assignment</span>
            </article>
          ))}
        </div>

        <h3 className="subheading">New registrations this session</h3>
        {volunteers.length === 0 ? (
          <p className="muted">No new registrations yet.</p>
        ) : (
          volunteers.map((item) => (
            <div className="simple-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.skill} · {item.phone}
              </span>
            </div>
          ))
        )}
      </section>
    );
  }

  function renderShelters() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Relief shelters</h2>
            <p>Keep track of safe places for affected families.</p>
          </div>
          <button
            className="button button-primary"
            onClick={() => openAction("Add a shelter")}
          >
            + Add shelter
          </button>
        </div>

        <div className="shelter-list">
          {[
            {
              name: "Community Hall",
              area: "Kochi, Kerala",
              capacity: "72 / 100 people",
            },
            {
              name: "Government School",
              area: "Wayanad, Kerala",
              capacity: "48 / 80 people",
            },
            {
              name: "Relief Centre",
              area: "Kozhikode, Kerala",
              capacity: "31 / 60 people",
            },
          ].map((item) => (
            <article className="shelter-row" key={item.name}>
              <span className="shelter-icon">⌂</span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.area}</p>
              </div>
              <span className="muted">{item.capacity}</span>
            </article>
          ))}
        </div>

        <h3 className="subheading">Shelters added this session</h3>
        {shelters.length === 0 ? (
          <p className="muted">No new shelters yet.</p>
        ) : (
          shelters.map((item) => (
            <div className="simple-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.location} · Capacity {item.capacity}
              </span>
            </div>
          ))
        )}
      </section>
    );
  }

  function renderDashboard() {
    return (
      <>
        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR COMMUNITY RESPONSE DESK</p>
            <h2>Good to have you here.</h2>
            <p>
              When things get difficult, getting the right help to the right
              place matters. Let's see what needs attention today.
            </p>
            <button
              className="button button-primary"
              onClick={() => openAction("Report an emergency")}
            >
              Report an emergency <span>→</span>
            </button>
          </div>
          <div className="welcome-mark">
            CA<span>+</span>
          </div>
        </section>

        <section className="stats-grid">
          {[
            {
              label: "Active emergencies",
              value: emergencies.length,
              color: "red",
              icon: "⚠",
              page: "Emergencies",
            },
            {
              label: "Resource items",
              value: resources.length,
              color: "blue",
              icon: "▦",
              page: "Resources",
            },
            {
              label: "New volunteers",
              value: volunteers.length,
              color: "green",
              icon: "♧",
              page: "Volunteers",
            },
            {
              label: "Shelters added",
              value: shelters.length,
              color: "purple",
              icon: "⌂",
              page: "Shelters",
            },
          ].map((item) => (
            <button
              className={`stat-card ${item.color}`}
              key={item.label}
              onClick={() => setPage(item.page)}
            >
              <span className="stat-icon">{item.icon}</span>
              <span className="stat-label">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="stat-link">Open section ↗</span>
            </button>
          ))}
        </section>

        <div className="dashboard-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Needs attention</h2>
                <p>Incidents that may need a response.</p>
              </div>
              <button
                className="text-button"
                onClick={() => setPage("Emergencies")}
              >
                View all →
              </button>
            </div>

            {emergencies.slice(0, 3).map((item) => (
              <button
                className="incident-row compact"
                key={item.id}
                onClick={() => {
                  setPage("Dashboard");
                  setSelectedEmergency(item);
                }}
              >
                <span className={`severity-dot ${item.severity.toLowerCase()}`} />
                <span className="incident-main">
                  <strong>{item.name}</strong>
                  <small>{item.location}</small>
                </span>
                <span className={`pill ${item.severity.toLowerCase()}`}>
                  {item.severity}
                </span>
              </button>
            ))}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Team activity</h2>
                <p>Recent updates from the desk.</p>
              </div>
            </div>

            {activities.map((item) => (
              <div className="activity-row" key={item.title}>
                <span className="activity-icon">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <time>{item.time}</time>
              </div>
            ))}
          </section>
        </div>

        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>What do you need to do?</h2>
              <p>Choose a task to get started.</p>
            </div>
          </div>

          <div className="quick-grid">
            <button onClick={() => openAction("Report an emergency")}>
              <span>⚠</span>
              <strong>Report an incident</strong>
              <small>Tell the response team what happened.</small>
            </button>
            <button onClick={() => openAction("Request resources")}>
              <span>▦</span>
              <strong>Request supplies</strong>
              <small>Ask for food, water, or medical kits.</small>
            </button>
            <button onClick={() => openAction("Join as a volunteer")}>
              <span>♡</span>
              <strong>Join the team</strong>
              <small>Offer your time or professional skills.</small>
            </button>
            <button onClick={() => openAction("Add a shelter")}>
              <span>⌂</span>
              <strong>Add a shelter</strong>
              <small>List a place that can support families.</small>
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            setPage("Dashboard");
          }}
        >
          <span className="brand-icon">
            C<span>+</span>
          </span>
          <span>
            <strong>CloudAid</strong>
            <small>Community response</small>
          </span>
        </a>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          {menu.map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => {
                setPage(name);
                setSearch("");
                setSelectedEmergency(null);
              }}
            >
              <span>{icon}</span>
              {name}
              {name === "Emergencies" && (
                <span className="nav-count">{emergencies.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>♡</span>
            <strong>Every helping hand counts.</strong>
            <p>Small actions can make a real difference.</p>
            <button onClick={() => openAction("Join as a volunteer")}>
              Get involved →
            </button>
          </div>
          <div className="profile">
            <span className="avatar">S</span>
            <div>
              <strong>Response desk</strong>
              <small>Demo workspace</small>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            CloudAid <span>+</span>
          </div>
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search emergencies, places, resources..."
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <div className="topbar-right">
            <span className="demo-label">
              <span /> Emergency database
            </span>
            <span className="top-avatar">S</span>
            <div className="user-label">
              <strong>Response desk</strong>
              <small>Coordinator</small>
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-title">
            <div>
              <p className="eyebrow">CLOUDAID / {page.toUpperCase()}</p>
              <h1>{page}</h1>
              <p className="page-subtitle">
                {page === "Dashboard"
                  ? "A clearer picture of what your community needs."
                  : `Keep track of ${page.toLowerCase()} and the people they support.`}
              </p>
            </div>
            <span className="today-label">● Workspace active</span>
          </div>

          {notice && (
            <button className="notice" onClick={() => setNotice("")}>
              ✓ {notice} <span>×</span>
            </button>
          )}

          {page === "Dashboard" && renderDashboard()}
          {page === "Emergencies" && renderEmergencies()}
          {page === "Resources" && renderResources()}
          {page === "Volunteers" && renderVolunteers()}
          {page === "Shelters" && renderShelters()}

          <footer className="footer">
            <span>CloudAid</span> · Built to help communities respond together.
            <span className="footer-note">Prototype · Other sections use demo data</span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModal("");
            }
          }}
        >
          <form className="modal" onSubmit={submitForm}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">CLOUDAID WORKSPACE</p>
                <h2>{modal}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                disabled={saving}
                onClick={() => setModal("")}
              >
                ×
              </button>
            </div>

            <p className="modal-intro">
              {modal === "Report an emergency" &&
                "Share the basic details so the response team can review the incident."}
              {modal === "Request resources" &&
                "Tell us what supplies are needed and where they should go."}
              {modal === "Join as a volunteer" &&
                "Let the team know how you would like to help."}
              {modal === "Add a shelter" &&
                "Add a potential safe place to the demo shelter list."}
            </p>

            {modal === "Report an emergency" && (
              <>
                <label>
                  What happened?
                  <input
                    name="title"
                    placeholder="e.g. Flooding near the main road"
                    required
                  />
                </label>
                <label>
                  Location
                  <input
                    name="location"
                    placeholder="Town, district, or landmark"
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Incident type
                    <select name="type">
                      <option>Flood</option>
                      <option>Landslide</option>
                      <option>Fire</option>
                      <option>Medical</option>
                      <option>Weather</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    Severity
                    <select name="severity">
                      <option>Moderate</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {modal === "Request resources" && (
              <>
                <label>
                  Supply needed
                  <input
                    name="item"
                    placeholder="e.g. Drinking water"
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Quantity
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      required
                    />
                  </label>
                  <label>
                    Unit
                    <select name="unit">
                      <option>items</option>
                      <option>packs</option>
                      <option>kits</option>
                      <option>boxes</option>
                      <option>litres</option>
                    </select>
                  </label>
                </div>
                <label>
                  Delivery location
                  <input
                    name="location"
                    placeholder="Town or relief centre"
                    required
                  />
                </label>
              </>
            )}

            {modal === "Join as a volunteer" && (
              <>
                <label>
                  Your name
                  <input name="name" placeholder="Full name" required />
                </label>
                <div className="form-row">
                  <label>
                    Area of help
                    <select name="skill">
                      <option>General support</option>
                      <option>Medical assistance</option>
                      <option>Food distribution</option>
                      <option>Transport</option>
                      <option>Logistics</option>
                    </select>
                  </label>
                  <label>
                    Phone number
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Contact number"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            {modal === "Add a shelter" && (
              <>
                <label>
                  Shelter name
                  <input
                    name="name"
                    placeholder="e.g. Community Hall"
                    required
                  />
                </label>
                <label>
                  Location
                  <input name="location" placeholder="Town, district" required />
                </label>
                <label>
                  Capacity (people)
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    required
                  />
                </label>
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={saving}
                onClick={() => setModal("")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save details →"}
              </button>
            </div>

            <p className="privacy-note">
              Emergency reports are saved to the database. Resource requests,
              volunteer registrations, and shelters are currently demo-only.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
