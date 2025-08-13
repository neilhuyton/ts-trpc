import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

type NetlifyEvent = {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string> | null;
  body?: string;
  multiValueHeaders?: Record<string, string[]>;
  multiValueQueryStringParameters?: Record<string, string[]>;
};

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

const t = initTRPC.context<NetlifyContext>().create();

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ input: z.string() })).mutation(({ input }) => {
    // .query changed to .mutation
    console.log("Received input:", input);
    return `Hello, ${input}!`;
  }),
});

export const handler = async (
  event: NetlifyEvent,
  context: NetlifyContext["context"]
) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  try {
    // Strip '/.netlify/functions/api' from the path to get the procedure path
    const procedurePath =
      event.path.replace(/^\/\.netlify\/functions\/api\/?/, "") || "";

    // Use query parameters directly without JSON encoding
    const queryParams = new URLSearchParams(event.queryStringParameters || {});

    const requestOptions: RequestInit = {
      method: event.httpMethod,
      headers: {
        ...event.headers,
        "Content-Type": "application/json",
      },
    };

    if (
      event.body &&
      event.httpMethod !== "GET" &&
      event.httpMethod !== "HEAD"
    ) {
      requestOptions.body = event.body;
    }

    const response = await fetchRequestHandler({
      endpoint: "/.netlify/functions/api",
      req: new Request(
        `https://ts-trpc.netlify.app/.netlify/functions/api/${procedurePath}?${queryParams.toString()}`,
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
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
    };
  }
};

export type AppRouter = typeof appRouter;
