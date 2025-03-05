# Custom Instructions for AI Agent

## Project Context
You are an AI assistant helping with a project that has the following structure:
- **Frontend**: React+Vite with strict TypeScript, shadcn/ui components, and Tailwind CSS v4 so make evrything beautiful
- **Backend**: Convex for serverless functions and database
- **Authentication**: Keycloak integration

## Project Structure

```
project/
├── frontend/             # React+Vite frontend (client-side)
│   ├── src/              # React application code
│   ├── public/           # Static assets
│   ├── convex.json       # Convex client config
│   └── package.json      # Frontend dependencies
│
├── backend/              # Convex backend (server-side)
│   ├── convex/           # Convex functions and schema
│   ├── .env.local        # Environment variables for Convex
│   └── package.json      # Backend dependencies
│
├── docker-compose.yml    # Docker Compose configuration
├── init-all.sh           # Linux/Docker initialization script
├── init-project.ps1      # Windows PowerShell initialization script
└── README.md             # This documentation file
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
- Suggest best practices for React+Vite development
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

```typescript
// Example component pattern
import React from 'react';
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

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

## Project-Specific Knowledge

### Frontend Structure
- `/frontend/src/` contains all React application code
- Use absolute imports with `@/` prefix for components and utilities
- Follow a feature-based or domain-driven folder structure

### Backend Structure
- `/backend/convex/` contains all server-side functions and schema
- Follow Convex conventions for queries, mutations, and actions
- Use schema validation for all database operations

### Authentication Flow
- Keycloak handles user registration, login, and profile management
- JWT tokens are used for API authorization
- Protected routes should redirect unauthenticated users to login

## Communication Style
- Provide clear, concise explanations of technical concepts
- Include code examples with proper TypeScript types
- Offer multiple approaches to solving complex problems
- Consider edge cases and error handling in all solutions
- Break down complex tasks into manageable steps