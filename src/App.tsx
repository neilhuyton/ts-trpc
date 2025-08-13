import { useState } from "react";
import { trpc } from "./trpc";

function App() {
  const [name, setName] = useState("");
  const query = trpc.hello.useQuery({ input: name }, { enabled: false });

  const handleSubmit = () => {
    query.refetch();
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
      <button onClick={handleSubmit} disabled={query.isFetching}>
        Submit
      </button>
      {query.isFetching && <p>Loading...</p>}
      {query.error && <p>Error: {query.error.message}</p>}
      {query.data && <p>{query.data}</p>}
    </div>
  );
}

export default App;
