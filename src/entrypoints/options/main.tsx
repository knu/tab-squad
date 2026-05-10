import React from 'react';
import ReactDOM from 'react-dom/client';
import { OptionsApp } from './OptionsApp';
import './style.css';

const container = document.getElementById('root');
if (!container) throw new Error('TabSquad: #root not found');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
