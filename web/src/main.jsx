import { createRoot } from 'react-dom/client';
import { Application } from './app/App.jsx';
import { registerServiceWorker } from './app/serviceWorker.js';
import './styles/index.css';

registerServiceWorker();
createRoot(document.getElementById('root')).render(<Application />);
