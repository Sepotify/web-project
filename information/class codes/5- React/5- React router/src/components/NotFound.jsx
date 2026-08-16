import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h2>404 - Page Not Found</h2>
      <p>Oops! The page you're looking for doesn't exist.</p>
      
      <div style={{ marginTop: '20px' }}>
        <Link to="/" style={{ color: '#646cff', textDecoration: 'none', fontSize: '18px' }}>
          Take me home →
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
