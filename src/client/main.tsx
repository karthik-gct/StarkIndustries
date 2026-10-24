import React from 'react';
import ReactDOM from 'react-dom/client';
<<<<<<< HEAD
=======
import { BrowserRouter } from 'react-router-dom';
>>>>>>> origin/main
import App from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
<<<<<<< HEAD
    <App />
=======
    <BrowserRouter>
      <App />
    </BrowserRouter>
>>>>>>> origin/main
  </React.StrictMode>,
);
