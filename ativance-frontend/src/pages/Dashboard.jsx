export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white">
          Welcome, {user.name || 'there'} 👋
        </h1>
        <p className="text-slate-400">Your dashboard is coming soon.</p>
      </div>
    </div>
  );
}
