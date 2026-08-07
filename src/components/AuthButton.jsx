export default function AuthButton({ user, authReady, isConfigured, onSignIn, onSignOut }) {
  if (!isConfigured || !authReady) return null;

  if (!user) {
    return (
      <button className="gc-auth-signin" onClick={onSignIn}>
        Sign in with Google
      </button>
    );
  }

  const firstName = (user.displayName || 'Player').split(' ')[0];

  return (
    <div className="gc-auth-user">
      {user.photoURL ? (
        <img className="gc-auth-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="gc-auth-avatar gc-auth-avatar-fallback">{firstName[0]}</span>
      )}
      <span className="gc-auth-name">{firstName}</span>
      <button className="gc-auth-signout" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
