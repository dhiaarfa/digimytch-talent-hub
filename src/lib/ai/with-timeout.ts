export class AITimeoutError extends Error {
  constructor(message = "AI request timed out") {
    super(message);
    this.name = "AITimeoutError";
  }
}

export function isAITimeoutError(error: unknown): boolean {
  return error instanceof AITimeoutError;
}

export function withAITimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = "AI request"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AITimeoutError(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
