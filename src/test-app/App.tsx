import React, { useState } from 'react'

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', padding: '40px 24px', maxWidth: 900, margin: '0 auto' },
  hint: {
    background: '#1a1a1a', color: '#fff', padding: '10px 16px', borderRadius: 8,
    marginBottom: 32, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
  },
  kbd: {
    background: '#333', border: '1px solid #555', borderRadius: 4,
    padding: '1px 6px', fontSize: 12, fontFamily: 'monospace',
  },
  section: { marginBottom: 48 },
  h1: { fontSize: 32, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#444' },
  lead: { fontSize: 16, color: '#555', marginBottom: 32, lineHeight: 1.6 },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  card: {
    background: '#fff', borderRadius: 10, padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e5e5',
  },
  cardTitle: { fontWeight: 600, marginBottom: 6, fontSize: 15 },
  cardText: { fontSize: 13, color: '#666', lineHeight: 1.5 },
  cardBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    fontSize: 11, fontWeight: 600, marginTop: 10,
  },
  btnRow: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 8 },
  btnPrimary: {
    padding: '8px 18px', borderRadius: 6, border: 'none',
    background: '#4a90d9', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
  },
  btnSecondary: {
    padding: '8px 18px', borderRadius: 6, border: '1px solid #ddd',
    background: '#fff', color: '#333', cursor: 'pointer', fontSize: 14,
  },
  btnDanger: {
    padding: '8px 18px', borderRadius: 6, border: 'none',
    background: '#e84040', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
  },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd',
    fontSize: 14, outline: 'none',
  },
  select: {
    padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd',
    fontSize: 14, background: '#fff', cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
  th: { padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #e5e5e5', fontWeight: 600 },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' },
  alert: {
    padding: '12px 16px', borderRadius: 8, border: '1px solid', marginBottom: 12, fontSize: 13,
  },
  navBar: {
    background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0 24px',
    height: 56, display: 'flex', alignItems: 'center', gap: 24,
    position: 'sticky' as const, top: 0, zIndex: 100, marginBottom: 32,
  },
  navLogo: { fontWeight: 700, fontSize: 16 },
  navLink: { fontSize: 14, color: '#555', cursor: 'pointer', textDecoration: 'none' },
}

const CARDS = [
  { title: 'Design Systems', text: 'Build consistent UIs with shared tokens and components.', badge: 'UI', badgeColor: '#e3f0ff', badgeTextColor: '#4a90d9' },
  { title: 'Accessibility', text: 'Ensure your product works for everyone, always.', badge: 'A11y', badgeColor: '#fff0e3', badgeTextColor: '#f5a623' },
  { title: 'Performance', text: 'Fast interfaces delight users and boost conversion.', badge: 'Perf', badgeColor: '#e6ffe3', badgeTextColor: '#52c41a' },
]

const TABLE_ROWS = [
  { name: 'Button', status: 'Done', priority: 'P1' },
  { name: 'Input', status: 'In progress', priority: 'P2' },
  { name: 'Modal', status: 'To do', priority: 'P1' },
  { name: 'Toast', status: 'To do', priority: 'P3' },
]

export function App() {
  const [inputVal, setInputVal] = useState('')

  return (
    <>

      {/* Nav */}
      <nav style={styles.navBar}>
        <span style={styles.navLogo}>Acme Design</span>
        <a style={styles.navLink}>Components</a>
        <a style={styles.navLink}>Tokens</a>
        <a style={styles.navLink}>Guidelines</a>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#aaa' }}>v2.4.1</span>
      </nav>

      <main style={styles.page}>
        {/* Hint banner */}
        <div style={styles.hint}>
          <span>Press</span>
          <kbd style={styles.kbd}>⌘⇧A</kbd>
          <span>to activate Design QA mode · Click elements or drag regions to annotate</span>
        </div>

        {/* Hero */}
        <section style={styles.section}>
          <h1 style={styles.h1}>Design QA Test Sandbox</h1>
          <p style={styles.lead}>
            This page contains varied UI elements to test the DesignQA annotation tool.
            Activate with <strong>⌘⇧A</strong> and start annotating.
          </p>
          <div style={styles.btnRow}>
            <button style={styles.btnPrimary}>Primary Action</button>
            <button style={styles.btnSecondary}>Secondary</button>
            <button style={styles.btnDanger}>Destructive</button>
          </div>
        </section>

        {/* Cards */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Feature Cards</h2>
          <div style={styles.cardGrid}>
            {CARDS.map((c) => (
              <div key={c.title} style={styles.card}>
                <div style={styles.cardTitle}>{c.title}</div>
                <div style={styles.cardText}>{c.text}</div>
                <span style={{ ...styles.cardBadge, background: c.badgeColor, color: c.badgeTextColor }}>
                  {c.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Alert States</h2>
          <div style={{ ...styles.alert, background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
            ⚠️ Warning: this feature is in beta.
          </div>
          <div style={{ ...styles.alert, background: '#d1ecf1', borderColor: '#17a2b8', color: '#0c5460' }}>
            ℹ️ Info: changes are saved automatically.
          </div>
          <div style={{ ...styles.alert, background: '#f8d7da', borderColor: '#dc3545', color: '#721c24' }}>
            ✕ Error: something went wrong. Please try again.
          </div>
        </section>

        {/* Form */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Form Elements</h2>
          <div style={{ maxWidth: 400 }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full name</label>
              <input
                style={styles.input}
                placeholder="Jane Doe"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select style={styles.select}>
                <option>Designer</option>
                <option>Engineer</option>
                <option>Product Manager</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                placeholder="Tell us about yourself…"
              />
            </div>
            <button style={styles.btnPrimary}>Submit</button>
          </div>
        </section>

        {/* Table */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Component Status</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Component</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row) => (
                <tr key={row.name}>
                  <td style={styles.td}>{row.name}</td>
                  <td style={styles.td}>{row.status}</td>
                  <td style={styles.td}>{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Typography */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Typography Scale</h2>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '4px 0' }}>Display — 32px Bold</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>Heading 1 — 24px Bold</p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: '4px 0' }}>Heading 2 — 18px Semibold</p>
          <p style={{ fontSize: 16, margin: '4px 0' }}>Body — 16px Regular</p>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0' }}>Secondary — 14px, Gray</p>
          <p style={{ fontSize: 12, color: '#999', margin: '4px 0' }}>Caption — 12px, Light Gray</p>
        </section>
      </main>
    </>
  )
}
