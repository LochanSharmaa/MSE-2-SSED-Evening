import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }));

    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <h1>🎓 CampusHub</h1>
      <h2>MSE-2 SSED Evening – Docker Exam</h2>

      <section>
        <h3>Backend Health</h3>
        {health ? (
          <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : <p>Checking...</p>}
      </section>

      <section>
        <h3>API Response</h3>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {data ? (
          <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : !error && <p>Loading...</p>}
      </section>
    </div>
  );
}

export default App;
