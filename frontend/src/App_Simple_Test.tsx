import SimpleMap from './SimpleMap';
import './App.css';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>MapVue - Simple Map Test</h1>
      <p>Testing basic OpenLayers functionality:</p>
      <SimpleMap />
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ccc' }}>
        <h3>🔍 Debug Checklist:</h3>
        <ol>
          <li><strong>Open browser console (F12)</strong> to see map initialization logs</li>
          <li><strong>Look for a blue-bordered container</strong> above with gray background</li>
          <li><strong>Check for OpenStreetMap tiles</strong> loading inside the container</li>
          <li><strong>Network tab</strong>: Look for requests to tile.openstreetmap.org</li>
        </ol>
        
        <h4>🎯 Expected Results:</h4>
        <ul>
          <li>✅ If you see tiles: OpenLayers works! Issue is in complex layout.</li>
          <li>❌ If no tiles: Network/configuration issue needs fixing.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;