# MyCoder-MCP Build Issues Report

## Summary

The project is experiencing TypeScript build errors in the `mcp-server-agent` package. The errors are related to tool registration in the MCP server. The package is using a different approach to register tools compared to the working `mcp-server-text-editor` package, which is causing type incompatibilities with the `@modelcontextprotocol/sdk` library.

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
  toolParameters,  // An object of Zod validators
  textEditorExecute  // The handler function
);
```

However, in the failing package (`mcp-server-agent`), tools are registered with:
```typescript
server.tool('agentStart', agentStartTool.schema, agentStartTool.handler);
```

where `agentStartTool.schema` is a `ZodObject` instance, not a raw schema object or description string.

### 2. Tool Implementation Structure

The tool implementations in the failing package use a different structure than the working package:

**Working Package:**
- Exports `toolParameters` as an object of Zod validators
- Exports `textEditorExecute` as a handler function

**Failing Package:**
- Exports tools as objects with `schema` and `handler` properties

## Recommended Fixes

### 1. Update Tool Registration in `mcp-server-agent/src/index.ts`

Change the tool registration to match the SDK's expected format:

```typescript
// Current (incorrect):
server.tool('agentStart', agentStartTool.schema, agentStartTool.handler);

// Change to:
server.tool(
  'agentStart',
  'Start a new agent with specific goals and context',
  agentStartTool.schema,
  agentStartTool.handler
);
```

Apply this pattern to all tool registrations.

### 2. Alternative Fix: Update Tool Implementation Structure

An alternative approach is to restructure the tool implementations to match the working package:

```typescript
// Export the schema and handler separately
export const agentStartParameters = {
  description: z.string().describe("A brief description of the agent's purpose (max 80 chars)"),
  goal: z.string().describe('The main objective that the agent needs to achieve'),
  // ... other parameters
};

export const agentStartExecute = async (params: z.infer<typeof parameterSchema>) => {
  // Implementation
};
```

Then register them in `index.ts`:

```typescript
server.tool(
  'agentStart',
  'Start a new agent with specific goals and context',
  agentStartParameters,
  agentStartExecute
);
```

### 3. Check SDK Documentation

Verify the correct method signature for `server.tool()` in the SDK documentation:
- The first parameter should be the tool name (string)
- The second parameter should be a description (string)
- The third parameter should be the schema definition (object of Zod validators)
- The fourth parameter should be the handler function

## Implementation Plan

1. Choose one of the fix approaches (updating registration or restructuring tools)
2. Apply the fix to one tool first and test
3. Apply the same pattern to all other tools
4. Run `pnpm -r typecheck` to verify the fixes
5. Apply the same pattern to other packages if needed (`mcp-server-fetch`, `mcp-server-shell`)

## Additional Recommendations

1. Add more comprehensive TypeScript type checking during development
2. Consider adding ESLint rules to enforce consistent patterns across packages
3. Create unit tests for each tool to verify functionality
4. Document the correct tool registration pattern in a shared README for developers

## Conclusion

The build issues stem from inconsistent tool registration patterns between packages. By aligning the `mcp-server-agent` package with the approach used in the working `mcp-server-text-editor` package, the TypeScript errors can be resolved.