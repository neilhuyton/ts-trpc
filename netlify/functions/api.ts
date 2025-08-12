import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

// Define the Netlify event type
type NetlifyEvent = {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string> | null;
  body?: string;
  multiValueHeaders?: Record<string, string[]>;
  multiValueQueryStringParameters?: Record<string, string[]>;
};

// Define the context type for Netlify
type NetlifyContext = {
  event: NetlifyEvent;
  context: {
    callbackWaitsForEmptyEventLoop?: boolean;
    functionName?: string;
    functionVersion?: string;
    invokedFunctionArn?: string;
    awsRequestId?: string;
    [key: string]: any;
  };
};

// Initialize tRPC
const t = initTRPC.context<NetlifyContext>().create();

// Create the tRPC router
export const appRouter = t.router({
  hello: t.procedure.input(z.string()).query(({ input }) => {
    return `Hello, ${input}!`;
  }),
});

// Export the Netlify handler
export const handler = async (
  event: NetlifyEvent,
  context: NetlifyContext["context"]
) => {
  try {
    // Strip '/trpc' from the path to get the procedure path
    const procedurePath = event.path.replace(/^\/trpc\/?/, "") || "";
    // Extract input from queryStringParameters or body
    let input: string | undefined;
    if (event.queryStringParameters?.input) {
      input = event.queryStringParameters.input;
    } else if (
      event.body &&
      event.httpMethod !== "GET" &&
      event.httpMethod !== "HEAD"
    ) {
      const body = JSON.parse(event.body);
      input = body.input;
    }

    // Build query parameters
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    // Include input in query parameters for GET requests if present
    if (input && (event.httpMethod === "GET" || event.httpMethod === "HEAD")) {
      queryParams.set("input", input);
    }

    const requestOptions: RequestInit = {
      method: event.httpMethod,
      headers: event.headers,
    };

    // Only include body for non-GET/HEAD requests
    if (input && event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
      requestOptions.body = JSON.stringify({ input });
    }

    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: new Request(
        `https://ts-trpc.netlify.app/trpc/${procedurePath}?${queryParams.toString()}`,
        requestOptions
      ),
      router: appRouter,
      createContext: () => ({ event, context }),
    });

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        ...Object.fromEntries(response.headers.entries()),
      },
      body: JSON.stringify(await response.json()),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

// Export the router type for client-side usage
export type AppRouter = typeof appRouter;
