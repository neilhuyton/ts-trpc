import { useState } from "react";
import { trpc } from "./trpc";

function App() {
  const [name, setName] = useState("");
  const { data, error, isLoading } = trpc.hello.useQuery(name, {
    enabled: !!name,
  });

  return (
    <div>
      <h1>tRPC + Netlify Functions</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>{data}</p>}
    </div>
  );
}

export default App;
