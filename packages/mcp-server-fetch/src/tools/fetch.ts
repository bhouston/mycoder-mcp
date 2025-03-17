import { z } from 'zod';

// Define the parameter schema for the fetch tool
export const fetchParameters = {
  method: z.string().describe('HTTP method to use (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)'),
  url: z.string().describe('URL to make the request to'),
  params: z.record(z.any()).optional().describe('Optional query parameters to append to the URL'),
  body: z
    .record(z.any())
    .optional()
    .describe('Optional request body (for POST, PUT, PATCH requests)'),
  headers: z.record(z.string()).optional().describe('Optional request headers'),
};

// Define the parameter schema using z.object
export const parameterSchema = z.object(fetchParameters);

// Define the return schema for the fetch tool
export const returnSchema = z
  .object({
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.union([z.string(), z.record(z.any())]),
  })
  .describe('HTTP response including status, headers, and body');

// Type inference for parameters
type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Define the content response type to match SDK expectations
type ContentResponse = {
  content: {
    type: 'text';
    text: string;
  }[];
  isError?: boolean;
};

// Helper function to build consistent responses
const buildContentResponse = (result: ReturnType | { error: string }): ContentResponse => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
    ...('error' in result && { isError: true }),
  };
};

// Export the handler function
export async function fetchExecute(
  { method, url, params, body, headers }: Parameters,
  extra: any,
): Promise<ContentResponse> {
  const logger = extra.logger || {
    verbose: console.debug,
    info: console.info,
  };
  try {
    logger.verbose(`Starting ${method} request to ${url}`);
    const urlObj = new URL(url);

    // Add query parameters
    if (params) {
      logger.verbose('Adding query parameters:', params);
      Object.entries(params).forEach(([key, value]) =>
        urlObj.searchParams.append(key, value as string),
      );
    }

    // Prepare request options
    const options = {
      method,
      headers: {
        ...(body &&
          !['GET', 'HEAD'].includes(method) && {
            'content-type': 'application/json',
          }),
        ...headers,
      },
      ...(body &&
        !['GET', 'HEAD'].includes(method) && {
          body: JSON.stringify(body),
        }),
    };

    logger.verbose('Request options:', options);
    const response = await fetch(urlObj.toString(), options);
    logger.verbose(`Request completed with status ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    const responseBody = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    logger.verbose('Response content-type:', contentType);

    return buildContentResponse({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      body: responseBody as ReturnType['body'],
    });
  } catch (error) {
    return buildContentResponse({
      error: error instanceof Error ? error.message : `Unknown error occurred: ${String(error)}`,
    });
  }
}

export function logParameters(
  params: Parameters,
  { logger }: { logger: { info: (message: string, ...args: any[]) => void } },
) {
  const { method, url, params: queryParams } = params;
  logger.info(
    `${method} ${url}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''}`,
  );
}

export function logReturns(
  result: ReturnType,
  { logger }: { logger: { info: (message: string, ...args: any[]) => void } },
) {
  const { status, statusText } = result;
  logger.info(`${status} ${statusText}`);
}