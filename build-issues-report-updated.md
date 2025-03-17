# MyCoder-MCP Build Issues Report

## Summary

The project is experiencing TypeScript build errors in the `mcp-server-agent` package. The errors are related to tool registration in the MCP server and type incompatibilities with the `@modelcontextprotocol/sdk` library. Our investigation revealed multiple issues that need to be fixed to make the build successful.

## Project Structure

This is a TypeScript monorepo managed by PNPM with several MCP server packages:
- `mcp-server-text-editor`: Working correctly, serves as a model for other packages
- `mcp-server-agent`: Failing with TypeScript errors
- `mcp-server-fetch`: Also needs to be fixed
- `mcp-server-shell`: Also needs to be fixed
- `cli`: Main CLI package

## Identified Issues

### 1. Tool Registration Method Mismatch

**Error:**
```
No overload matches this call.
Argument of type 'ZodObject<...>' is not assignable to parameter of type 'string'.
```

**Root Cause:**
The `mcp-server-agent` package is trying to pass Zod schema objects directly to the `server.tool()` method, but the SDK expects different parameters. 

In the working package (`mcp-server-text-editor`), tools are registered with:
```typescript
server.tool(
  'text_editor',
  "Description string",
  toolParameters,  // An object of Zod validators, not a ZodObject
  textEditorExecute  // The handler function
);
```

However, in the failing package (`mcp-server-agent`), tools are registered with:
```typescript
server.tool('agentStart', agentStartTool.schema, agentStartTool.handler);
```

where `agentStartTool.schema` is a `ZodObject` instance, not a raw schema object of Zod validators.

### 2. Tool Implementation Structure Differences

The tool implementations in the failing package use a different structure than the working package:

**Working Package (`mcp-server-text-editor`):**
- Exports `toolParameters` as an object containing Zod validators (not a ZodObject)
- Exports `textEditorExecute` as a handler function
- Uses a `buildContentResponse` helper function to format responses correctly

**Failing Package (`mcp-server-agent`):**
- Exports tools as objects with `schema` (ZodObject) and `handler` properties
- Returns content directly without using a consistent helper function

### 3. Content Type Compatibility

**Error:**
```
Type '{ type: string; text: string; }[]' is not assignable to type 
'({ [x: string]: unknown; type: "text"; text: string; } | { [x: string]: unknown; type: "image"; data: string; mimeType: string; } | { [x: string]: unknown; type: "resource"; resource: ... })[]'
```

**Root Cause:**
The content type returned by the handlers needs to match the exact type expected by the MCP SDK. The working package correctly types the content as:

```typescript
type ContentResponse = {
  content: {
    type: 'text';  // Note the literal type 'text' not string
    text: string;
  }[];
};
```

### 4. File Extension Issues

When attempting to fix the issues, we encountered problems with TypeScript not properly recognizing imports from `.ts` vs `.js` files. In a TypeScript project using ES modules, imports should use the `.js` extension even for TypeScript files (TypeScript will resolve them correctly).

## Recommended Fixes

### 1. Restructure Tool Implementations

Each tool in the `mcp-server-agent` package should be restructured to match the pattern used in the working package:

```typescript
// Export the parameters as a plain object of Zod validators
export const toolParameters = {
  param1: z.string().describe('Description of param1'),
  param2: z.number().describe('Description of param2'),
  // ...
};

// Define a parameter schema for internal use
const parameterSchema = z.object(toolParameters);

// Type for the parameters
type Parameters = z.infer<typeof parameterSchema>;

// Define the content response type
type ContentResponse = {
  content: {
    type: 'text';  // Use literal type
    text: string;
  }[];
};

// Helper function to build consistent responses
const buildContentResponse = (result: any): ContentResponse => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
};

// Export the handler function
export const toolExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  try {
    // Implementation
    return buildContentResponse({ success: true, /* other data */ });
  } catch (error) {
    return buildContentResponse({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

### 2. Update Tool Registration

Update the tool registration in `index.ts` to match the SDK's expected format:

```typescript
server.tool(
  'toolName',
  'Tool description string',
  toolParameters,  // Object of Zod validators
  toolExecute     // Handler function
);
```

### 3. Fix File Extensions

Ensure all imports use the correct extension pattern:

```typescript
// For TypeScript files in ES modules projects
import { something } from './file.js';  // Use .js even for .ts files
```

### 4. Maintain Backward Compatibility

To maintain backward compatibility with existing code, you can still export the original tool interface:

```typescript
// For backward compatibility
export const toolName = {
  schema: toolParameters,
  handler: toolExecute,
};
```

## Implementation Plan

1. Create a template for the new tool structure based on the working package
2. Convert one tool at a time, starting with `agentStart`
3. Update the `index.ts` file to use the new tool structure
4. Run `pnpm -r typecheck` after each tool conversion to verify the fix
5. Once all tools are fixed in `mcp-server-agent`, apply the same pattern to other packages

## Detailed Steps for Fixing One Tool

1. Rename the current tool file (e.g., `agentStart.ts` to `agentStart.old.ts`)
2. Create a new file with the correct structure
3. Update imports in `index.ts`
4. Test the changes

## Additional Recommendations

1. Add more comprehensive TypeScript type checking during development
2. Consider adding ESLint rules to enforce consistent patterns across packages
3. Create unit tests for each tool to verify functionality
4. Document the correct tool registration pattern in a shared README for developers
5. Add a pre-commit hook to run `typecheck` to catch issues early

## Conclusion

The build issues stem from inconsistent tool registration patterns and type incompatibilities between packages. By aligning all packages with the approach used in the working `mcp-server-text-editor` package and ensuring proper typing of responses, the TypeScript errors can be resolved.

This refactoring will not only fix the current build issues but also make the codebase more maintainable and consistent across packages.