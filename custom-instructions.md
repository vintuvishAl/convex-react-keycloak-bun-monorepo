# Custom Instructions for AI Agent

## Project Context
You are an AI assistant helping with a project that has the following structure:
- **Frontend**: React 19 + Vite 6 with strict TypeScript, shadcn/ui components, and Tailwind CSS v4
- **Backend**: Convex for serverless functions and database
- **Authentication**: Keycloak integration (using keycloak-js v26)
- **Package Manager**: Bun (as indicated by bun.lockb files)

## Project Structure

```
project/
├── frontend/             # React+Vite frontend (client-side)
│   ├── src/              # React application code
│   │   ├── components/   # UI components including shadcn/ui
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components for routing
│   ├── public/           # Static assets
│   ├── convex.json       # Convex client config
│   └── package.json      # Frontend dependencies
│
├── backend/              # Convex backend (server-side)
│   ├── convex/           # Convex functions and schema
│   │   ├── auth.ts       # Authentication related functions
│   │   ├── products.ts   # Product-related functions
│   │   ├── schema.ts     # Database schema definition
│   │   ├── tasks.ts      # Task-related functions
│   │   └── users.ts      # User-related functions
│   ├── convex.json       # Convex server config
│   └── package.json      # Backend dependencies
│
├── docker-compose.yml    # Docker Compose configuration
└── README.md             # Project documentation
```

## Your Capabilities

### Code Generation
- Generate TypeScript code that adheres to strict typing rules
- Create React components using shadcn/ui library and Tailwind CSS v4
- Write Convex backend functions (queries, mutations, actions)
- Implement Keycloak authentication flows and protected routes

### Problem Solving
- Troubleshoot TypeScript errors and provide solutions
- Debug authentication issues with Keycloak
- Solve state management challenges in React applications
- Optimize Convex database queries and mutations

### Development Guidance
- Suggest best practices for React 19 + Vite 6 development
- Provide patterns for secure authentication with Keycloak
- Recommend efficient data fetching strategies with Convex
- Advise on proper TypeScript configuration and usage

## Response Guidelines

### When Writing Frontend Code
- Always use TypeScript with proper type definitions
- Implement shadcn/ui components following their documentation
- Use Tailwind CSS v4 utility classes for styling
- Create reusable React hooks and components
- Consider performance optimizations like memoization when appropriate
- Use TanStack Table (formerly React Table) for data grid implementations
- Implement proper loading states for async operations
- Use the Convex React hooks (`useQuery`, `useMutation`) for data fetching
- Follow the established pattern for dialog-based forms

```typescript
// Example component pattern
import React from 'react';
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@backend/convex/_generated/api";

type UserProfileProps = {
  userId: string;
};

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const user = useQuery(api.users.getUser, { id: userId });
  
  if (!user) return <div className="animate-pulse">Loading...</div>;
  
  return (
    <div className="p-4 space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h2 className="text-2xl font-bold">{user.name}</h2>
      <Button variant="outline">Edit Profile</Button>
    </div>
  );
};
```

### Frontend Guidelines

#### Data Fetching & State Management
- Import Convex API using `import { api } from "@backend/convex/_generated/api"`
- Import types from Convex using `import type { Doc } from "@backend/convex/_generated/dataModel"`
- Use `useQuery` for fetching data and `useMutation` for modifying data
- Handle loading and error states explicitly for all async operations
- Use the Keycloak context for authentication state and user information
- Implement optimistic UI updates when appropriate

#### Component Organization
- Use `useState`, `useCallback`, and `useMemo` for efficient state management
- Separate concerns within components (data fetching, UI rendering, event handling)
- Create helper components for repeated UI patterns
- Extract complex logic to custom hooks when appropriate
- Use TypeScript interfaces or types for component props and data structures

#### Table Implementation
- Use TanStack Table for data tables with sorting, filtering, and pagination
- Define column configurations with `useMemo` to prevent unnecessary re-renders
- Implement custom cell renderers for complex data presentation
- Use the appropriate sorting functions for different data types
- Provide visual indicators for sortable columns

#### Form Implementation
- Use the `DynamicForm` component for consistent form implementation
- Define form fields as structured objects with validation rules
- Handle form submission with proper error handling
- Implement form state reset after successful submissions
- For form dialogs, manage dialog state and form state together

#### Styling and UI
- Use Tailwind CSS utility classes for styling
- Follow the container/content pattern for page layouts
- Use shadcn/ui components like `Dialog`, `Table`, and `Badge`
- To add new shadcn/ui components, use the CLI command: `npx shadcn@latest add [component-name]` (e.g., `npx shadcn@latest add button`)
- Maintain consistent spacing with margin and padding utilities
- Implement responsive designs that work on various screen sizes
- Use appropriate visual cues for interactive elements

#### Error Handling and Validation
- Use try/catch blocks for error handling in async operations
- Log errors to the console or to a monitoring service
- Provide user feedback for failed operations
- Implement client-side validation for forms
- Handle error states gracefully with appropriate UI feedback

### When Writing Convex Backend Code
- Always use the new function syntax for Convex functions
- Include argument and return validators for all functions
- Use appropriate function types (query, mutation, action)
- Follow Convex best practices for data modeling and schema design

```typescript
// Example Convex function pattern
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { id: v.id("users") },
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");
    return user;
  },
});
```

## Project-Specific Knowledge

### Frontend Structure
- `/frontend/src/` contains all React application code
- `/frontend/src/components/` contains UI components including shadcn/ui
- `/frontend/src/pages/` contains page-level components for routing
- `/frontend/src/lib/` contains utility functions
- Use absolute imports with `@/` prefix for components and utilities

### Backend Structure
- `/backend/convex/` contains all server-side functions and schema
- `schema.ts` defines the database schema
- Separate files (`auth.ts`, `products.ts`, `tasks.ts`, `users.ts`) organize domain-specific functions
- Follow Convex conventions for queries, mutations, and actions
- Use schema validation for all database operations

### Authentication Flow
- Keycloak handles user registration, login, and profile management
- JWT tokens are used for API authorization
- Protected routes use the PrivateRoute component to redirect unauthenticated users to login

## Convex Guidelines

### Function Syntax and Registration
- Always use the new function syntax for all Convex functions:
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const functionName = query({
  args: { /* validators */ },
  returns: v.object({ /* return type validators */ }),
  handler: async (ctx, args) => {
    // Function body
  },
});
```
- Use `query`, `mutation`, and `action` for public functions
- Use `internalQuery`, `internalMutation`, and `internalAction` for private functions
- Always include argument and return validators for all functions
- If a function doesn't return anything, include `returns: v.null()`

### Function Calling
- Use `ctx.runQuery` to call a query from any function
- Use `ctx.runMutation` to call a mutation from a mutation or action
- Use `ctx.runAction` to call an action from an action
- Use the `api` object for public functions and `internal` for private functions

### Database Operations
- Use `withIndex` rather than `filter` for efficient queries
- Use `ctx.db.replace` to fully replace a document
- Use `ctx.db.patch` for partial updates
- Use `.unique()` to get a single document from a query

### TypeScript Usage
- Use `Id<'tableName'>` from `./_generated/dataModel` for ID types
- Be strict with types, especially around document IDs
- Use the proper validator types for Convex values
- Use discriminated union types with `as const` for string literals

### Schema Design
- Define schemas in `schema.ts`
- Include indexes for fields that will be queried
- Name indexes by including all indexed fields (e.g., "by_field1_and_field2")
- Remember system fields are automatically added (`_id`, `_creationTime`)

## Communication Style
- Provide clear, concise explanations of technical concepts
- Include code examples with proper TypeScript types
- Offer multiple approaches to solving complex problems
- Consider edge cases and error handling in all solutions
- Break down complex tasks into manageable steps