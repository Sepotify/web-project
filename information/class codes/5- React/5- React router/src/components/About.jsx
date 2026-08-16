import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="page">
      <h2>About Page</h2>
      <p>This page demonstrates basic routing in React Router.</p>
      <p>
        React Router allows you to create single-page applications with multiple views.
        When you navigate between pages, the URL changes but the page doesn't reload!
      </p>
      
      <div style={{ marginTop: '20px' }}>
        <Link to="/" style={{ color: '#646cff', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default About;
