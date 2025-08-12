import { useState } from "react";
import { trpc } from "./trpc";

function App() {
  const [name, setName] = useState("");
  const mutation = trpc.hello.useMutation();

  const handleSubmit = () => {
    mutation.mutate(name);
  };

  return (
    <div>
      <h1>tRPC + Netlify Functions</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={handleSubmit} disabled={mutation.isPending}>
        Submit
      </button>
      {mutation.isPending && <p>Loading...</p>}
      {mutation.error && <p>Error: {mutation.error.message}</p>}
      {mutation.data && <p>{mutation.data}</p>}
    </div>
  );
}

export default App;
