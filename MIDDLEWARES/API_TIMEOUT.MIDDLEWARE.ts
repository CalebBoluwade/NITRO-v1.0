import { NextFunction, Request } from "express";

const APItimeoutMiddleware = (
  Request: Request,
  Response: Response,
  Next: NextFunction
) => {
  const timeoutMs = 10000; // Replace with your desired timeout in milliseconds (e.g., 10000ms = 10 seconds)

  const abortController = new AbortController();
  const timeoutInterval = setTimeout(() => {
    abortController.abort(); // Abort the request after the timeout period
  }, timeoutMs);

  // Attach the `abortController` to the request object for access in the route handlers
  (Request as any).abortController = { abortController, timeoutInterval };

  // Call the next middleware in the chain
  Next();
};
