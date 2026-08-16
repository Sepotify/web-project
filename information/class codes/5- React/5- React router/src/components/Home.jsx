import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleGoToAbout = () => {
    // Programmatic navigation example
    navigate('/about');
  };

  return (
    <div className="page">
      <h2>Home Page</h2>
      <p>Welcome to the React Router demo! 🎉</p>
      <p>This is the home page. Click the links in the navigation to explore different routes.</p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleGoToAbout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Go to About (Programmatic Navigation)
        </button>
      </div>
    </div>
  );
}

export default Home;
