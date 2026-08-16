import { useParams, useNavigate } from 'react-router-dom';

function User() {
  // Extract the userId from the URL
  const { userId } = useParams();
  const navigate = useNavigate();

  // Mock user data
  const users = {
    '123': { name: 'Alice Johnson', role: 'Developer' },
    '456': { name: 'Bob Smith', role: 'Designer' },
  };

  const user = users[userId];

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="page">
      <h2>User Profile</h2>
      
      {user ? (
        <div>
          <p><strong>User ID:</strong> {userId}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      ) : (
        <div>
          <p><strong>User ID:</strong> {userId}</p>
          <p style={{ color: '#ff6b6b' }}>User not found in our system.</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleBack} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}

export default User;
