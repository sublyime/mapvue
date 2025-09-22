import React from 'react';
import SimpleMap from './SimpleMap';
import './App.css';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>MapVue - Simple Map Test</h1>
      <p>Testing basic OpenLayers functionality:</p>
      <SimpleMap />
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9' }}>
        <h3>Debug Info:</h3>
        <p>1. Open browser console (F12) to see map initialization logs</p>
        <p>2. You should see a blue-bordered container above</p>
        <p>3. OpenStreetMap tiles should load inside the container</p>
      </div>
    </div>
  );
}

export default App;