import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Falta el contenedor raíz de JACSA Gestión.');

createRoot(rootElement).render(<App />);
