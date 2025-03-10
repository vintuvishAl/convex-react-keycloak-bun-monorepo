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
├── init-project.ps1      # Windows PowerShell initialization script
└── README.md             # This documentation file
```

## Quick Start

1. Clone this repository
2. Run the following command to start all services:

```bash
docker compose up -d
```

3. The system includes an automated initialization process with the `init-service` container that will:
   - Generate a Convex admin key
   - Configure Keycloak
   - Deploy the Convex schema
   - Set up necessary dependencies

4. Access the application at http://localhost:3000

## Manual Setup

For Windows users, a PowerShell script is provided:

```powershell
# Run from PowerShell
./init-project.ps1
```

For manual setup on any platform:

1. Start the Docker services:
```bash
docker compose up -d
```

2. Generate a Convex admin key:
```bash
docker compose exec backend bash -c "cd /convex && ./generate_admin_key.sh"
```

3. Add the generated admin key to `backend/.env.local`:
```
CONVEX_SELF_HOSTED_URL=http://localhost:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key_here
```

4. Configure Keycloak (create client and test user)
5. Deploy Convex schema:
```bash
cd backend
npm install
npx convex deploy
```

6. Install frontend dependencies:
```bash
cd frontend
npm install
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

The Keycloak instance comes pre-configured with:
- Admin credentials: username `admin`, password `admin`
- A client ID called `vite-app` for the frontend application
- A test user: username `testuser`, password `password`

To log in to the Keycloak admin console:
1. Go to http://localhost:8080/admin
2. Use the credentials mentioned above

#### Keycloak Server Configuration

The application is configured to work with Keycloak using the following settings:

- **Server URL**: http://localhost:8080
- **Realm**: master
- **Client ID**: vite-app

##### Authentication Settings
- **Rate Limiting**:
  - Window: 60000ms (1 minute)
  - Max attempts: 5 per window

- **Token Validation**:
  - Token expiration grace period: 30 seconds
  - Max token age: 86400 seconds (24 hours)

- **Valid Issuers**:
  - http://localhost:8080/realms/master
  - http://keycloak:8080/realms/master
  - https://localhost:8443/realms/master

- **Valid Client IDs**: vite-app
- **Valid Audiences**: master-realm, account
- **Valid Sources**: vite-app, master-realm

If you need to modify these settings, update the corresponding variables in the `backend/.env.local` file.

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
- If the automatic initialization fails, check the logs with `docker compose logs init-service`
- You can manually run the initialization with:
  ```bash
  docker compose exec init-service bash /init-all.sh
  ```

### Services Not Starting
- Check Docker Compose logs with `docker compose logs <service-name>`
- Ensure all ports are available on your host machine

### Authentication Issues
- Make sure Keycloak is properly configured with the correct redirect URIs
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
