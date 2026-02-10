export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <h1>EduOntology MVP</h1>
      <p>Next.js API endpoints are available under <code>/api</code>.</p>
      <ul>
        <li><code>/api/vocabularies</code></li>
        <li><code>/api/learning-paths</code></li>
        <li><code>/api/learning-paths/gap-analysis</code></li>
      </ul>
      <p>Express engine endpoints are proxied under <code>/engine</code> (via Next rewrites).</p>
    </main>
  )
}

