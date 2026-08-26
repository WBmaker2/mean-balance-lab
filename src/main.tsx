import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <main>평균 균형 조정실</main>;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
