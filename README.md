# Full Stack Application with Vite, React, Convex, and Keycloak

This project provides a complete full-stack application setup using:

- **Frontend**: Vite with React and Tailwind CSS 4.0
- **Backend**: Self-hosted Convex with PostgreSQL
- **Authentication**: Keycloak OAuth 2.0

Everything is configured to run in a one-step Docker Compose setup with a clean separation between frontend and backend.

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
└── README.md             # This documentation file
```

## Quick Start

1. Clone this repository

2. Start the Docker services:
```bash
docker compose up -d
```

3. Generate a Convex admin key:
```bash
docker compose exec backend bash -c "cd /convex && ./generate_admin_key.sh"
```

4. Create a `.env.local` file in the `backend` directory with the generated admin key:
```
CONVEX_SELF_HOSTED_URL=http://localhost:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key_here
```

5. Manually configure Keycloak with the following steps:
   - Access Keycloak admin console at http://localhost:8080/admin
   - Default admin credentials: username `admin`, password `admin` 
   - Create a new realm or use the default "master" realm
   - Create a client with Client ID `vite-app`
   - Configure client settings:
     - Set Access Type to `public`
     - Set Valid Redirect URIs to `http://localhost:3000/*`
     - Set Web Origins to `http://localhost:3000` (or `*` for development)
   - Create a test user in the realm

6. Create a `.env.local` file in the `frontend` directory with your Keycloak settings:
```
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=vite-app
```

7. Deploy Convex schema:
```bash
cd backend
npm install
npx convex deploy
```

8. Install frontend dependencies:
```bash
cd frontend
npm install
npm run dev
```

## What's Included

### Infrastructure
- **PostgreSQL**: Shared database for both Convex and Keycloak
- **Keycloak**: Open source identity and access management
- **Convex**: Real-time backend with automatic API generation

### Frontend
- **Vite**: Next generation frontend tooling
- **React**: UI library with TypeScript support (client-side only)
- **Tailwind CSS 4.0**: Utility-first CSS framework

### Backend
- **Convex**: Backend-as-a-service with real-time data sync
- **PostgreSQL**: Relational database for persistent storage
- **TypeScript**: Strongly typed schema and functions

## Services and Ports

| Service | URL | Description |
|---------|-----|-------------|
| Frontend App | http://localhost:3000 | The main application |
| Convex Dashboard | http://localhost:6791 | Convex admin dashboard |
| Convex Backend | http://localhost:3210 | Convex API endpoint |
| Keycloak | http://localhost:8080 | Authentication server |
| PostgreSQL | localhost:5432 | Database (not directly accessible) |

## Development

### Keycloak Setup

Keycloak does not come with pre-configured settings. You need to manually create and configure it:

1. Access Keycloak admin console at http://localhost:8080/admin
2. Default admin credentials: username `admin`, password `admin`
3. Configure the Keycloak realm and client:
   - Create a new realm or use the "master" realm
   - Create a new client ID (e.g., `vite-app`)
   - Configure client settings:
     - Set Access Type to `public`
     - Set Valid Redirect URIs to `http://localhost:3000/*`
     - Set Web Origins to `http://localhost:3000` or `*` for development
4. Create test users as needed in the realm

#### Keycloak Environment Configuration

After configuring Keycloak, you need to create the following environment files:

**Backend `.env.local`**:
```
# Convex configuration
CONVEX_SELF_HOSTED_URL=http://localhost:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=your_generated_admin_key

# Keycloak configuration for backend validation
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=vite-app

# Token validation settings
TOKEN_EXPIRATION_GRACE_PERIOD_SECONDS=30
MAX_TOKEN_AGE_SECONDS=86400

# Rate limiting settings
RATE_LIMITING_WINDOW_MS=60000
RATE_LIMITING_MAX_REQUESTS=5

# Valid issuers for token validation
VALID_ISSUERS=http://localhost:8080/realms/master,http://keycloak:8080/realms/master,https://localhost:8443/realms/master

# Valid clients, audiences and sources
VALID_CLIENT_IDS=vite-app
VALID_AUDIENCES=master-realm,account
VALID_SOURCES=vite-app,master-realm
```

**Frontend `.env.local`**:
```
# Convex URL for client connection
VITE_CONVEX_URL=http://localhost:3210

# Keycloak configuration for frontend authentication
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=vite-app
```

### Convex Dashboard

To access the Convex dashboard:
1. Go to http://localhost:6791
2. Enter the admin key when prompted (generated during setup)

### Making Changes

- **Frontend**: The frontend code is mounted as a volume, so changes will be automatically reflected after a page refresh
- **Backend**: After making changes to functions in the `backend/convex` directory, run:

```bash
cd backend
npx convex deploy
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Frontend  │────▶│    Convex   │
│             │◀────│  (Vite+React)│◀────│   Backend   │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                    │                   │
       │                    │                   │
       │               ┌────▼────┐         ┌────▼────┐
       └──────────────▶│ Keycloak │──────▶│ Postgres │
                       │  (Auth)  │        │    DB    │
                       └──────────┘        └─────────┘
```

## Troubleshooting

### Initial Setup Issues
- Ensure you've created the proper `.env.local` files in both backend and frontend directories
- Make sure the Convex admin key generated is correctly copied to the backend `.env.local` file
- If Keycloak configuration fails, check that you've properly set up the client in the Keycloak admin console

### Services Not Starting
- Check Docker Compose logs with `docker compose logs <service-name>`
- Ensure all ports are available on your host machine

### Authentication Issues
- Make sure Keycloak is properly configured with the correct redirect URIs
- Check that your `.env.local` files contain the correct Keycloak settings
- Verify that the client ID matches between Keycloak setup and your environment files
- Check the browser console for any CORS or OAuth-related errors

### Convex Connectivity
- If the frontend can't connect to Convex, check that the backend is running
- Verify that the `CONVEX_URL` environment variable is set correctly
- Make sure the admin key is properly set in `.env.local`

### Missing Functions Errors
If you see errors like `Could not find public function for 'tasks:get'`:
1. Make sure your Convex schema was properly deployed
2. Check if the function exists in your `/backend/convex` directory
3. Run a manual deployment:
   ```bash
   cd backend
   npx convex deploy
   ```

## License

MIT
