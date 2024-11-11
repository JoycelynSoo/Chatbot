import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import FaqEditor from './faqEditor';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const handleLogin = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/faq-editor" />}
        />
        <Route
          path="/faq-editor"
          element={token ? <FaqEditor token={token} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;