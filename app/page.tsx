// app/page.tsx
import { redirect } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  description: string;
  budget: number;
}

// This function fetches tasks on the server side.
async function getTasks(): Promise<Task[]> {
  const res = await fetch('http://localhost:5000/api/tasks', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return res.json();
}

export default async function HomePage() {
  // Replace this with your actual authentication logic.
  // For example, you might check cookies or session data.
  const isAuthenticated = false; // Simulated check; set to true if authenticated.
  
  if (!isAuthenticated) {
    // Redirect unauthenticated users to the register page.
    redirect('/register');
  }

  // Fetch tasks on the server. This avoids hydration issues since all data is available before render.
  const tasks = await getTasks();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Task Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <div key={task._id} className="border p-4">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <p>{task.description}</p>
            <p>Budget: ₹{task.budget}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
