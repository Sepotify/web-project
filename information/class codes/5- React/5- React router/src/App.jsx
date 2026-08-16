import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import User from './components/User';
import NotFound from './components/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* Navigation Bar */}
        <nav className="navbar">
          <h1>React Router Demo</h1>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/user/123">User 123</Link>
            </li>
            <li>
              <Link to="/user/456">User 456</Link>
            </li>
          </ul>
        </nav>

        {/* Route Definitions */}
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/user/:userId" element={<User />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
