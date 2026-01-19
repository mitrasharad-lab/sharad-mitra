# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gaming Parlour Management System** - A professional React + TypeScript application for managing gaming cafés with a master-client architecture. Features OAuth authentication, real-time session management, game launching, and comprehensive business operations (POS, tournaments, reservations).

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server on port 5173

# Building
npm run build        # Production build
npm run preview      # Preview production build

# Testing multi-PC setup
npm run master       # Start on port 5173 (Master PC)
npm run client       # Start on port 5174 (Client PC)
```

## Architecture Overview

### Master-Client Pattern
- **Master PC**: Reception/admin control - approves sessions, manages payments, monitors all clients
- **Client PCs**: Gaming stations - users login with OAuth, wait for staff approval, then access games
- **Communication**: BroadcastChannel API for local network, WebSocket ready for network deployment

### OAuth Flow (CRITICAL - Master-Controlled)
1. **Client PC**: User clicks "Continue with Google" → sends `oauth_login_request` to Master
2. **Master PC**: Staff sees pending request in `PendingOAuthRequests` panel
3. **Master PC**: Staff selects pricing plan + payment method → clicks "Approve"
4. **Master PC**: Creates session, sends `session_approved` message to Client
5. **Client PC**: Receives approval → shows GamesPanel with floating timer

**Key Point**: ALL pricing and payment decisions happen at Master PC, never on client.

### Service Layer Architecture

**Core Services** (`/services`):
- `databaseService.ts` - IndexedDB operations (core data)
- `databaseExtensions.ts` - localStorage for advanced features
- `authService.ts` - Password-based auth + session management
- `oauthService.ts` - Gmail OAuth (dev mode uses simulation)
- `sessionService.ts` - Gaming session lifecycle, timers, warnings
- `communicationService.ts` - Master ↔ Client real-time messaging
- `gameLaunchService.ts` - Game launching, playtime tracking

**Business Services**:
- `foodService.ts`, `tournamentService.ts`, `reservationService.ts`, `queueService.ts`
- `promoService.ts`, `gameLibraryService.ts`, `advancedFeaturesService.ts`

### Component Structure

```
components/gaming/
├── LoginSelector.tsx          # Initial mode selection (Master/Client)
├── MasterDashboard.tsx        # Admin dashboard with PendingOAuthRequests
├── PendingOAuthRequests.tsx   # Shows OAuth login requests awaiting approval
├── ClientLogin.tsx            # Gmail OAuth button (NO pricing selection)
├── WaitingForApproval.tsx     # Client waits for staff approval
├── ClientSession.tsx          # Active session with conditional rendering:
│                              #   - OAuth: Shows GamesPanel + floating timer
│                              #   - Regular: Shows full-screen timer
├── GamesPanel.tsx             # Game library with launch buttons
└── panels/                    # Feature panels (Food, Tournament, etc.)
```

### Main Application Flow

`GamingParlourApp.tsx` orchestrates everything:
- Manages app state: `mode` (selection/master/client), `clientState` (login/waiting_approval/session)
- Handles OAuth: `handleOAuthLoginSuccess()` → sends request to Master, shows waiting screen
- Listens for approval: `useEffect` with `communication.on('session_approved')`
- Routes components based on state

## Data Flow Patterns

### Communication Messages

**OAuth Login Request (Client → Master):**
```typescript
{
  type: 'oauth_login_request',
  clientId: 'PC-1',
  userId: 'oauth_google123',
  payload: { oauthSession, googleEmail, googleName, googlePicture }
}
```

**Session Approval (Master → Client):**
```typescript
{
  type: 'session_approved',
  clientId: 'PC-1',
  payload: { session, oauthSession }
}
```

**Game Launch (Client → Master):**
```typescript
{
  type: 'sync',
  clientId: 'PC-1',
  payload: { event: 'game_launched', gameId, gameName, sessionId }
}
```

### Database Strategy
- **IndexedDB**: Core persistent data (users, sessions, payments, clients)
- **localStorage**: Advanced features (food, tournaments, promo codes, OAuth sessions, launched games)
- **BroadcastChannel**: Real-time sync between tabs/PCs (local network)

## Key Type Definitions

Located in `gaming-types.ts`:
- `OAuthSession` - Gmail login data (googleUserId, googleEmail, googleName, googlePicture, token)
- `LaunchedGame` - Game instance tracking (status: launching/running/paused/stopped)
- `Session` - Gaming session (userId, clientId, plannedDuration, remainingTime)
- `Payment` - Transaction records (method: cash/card/upi)

## Important Architectural Patterns

### 1. Master PC Controls All Business Logic
- Client PCs are "dumb terminals" - they display UI and send requests
- Master PC makes all decisions about pricing, payments, session approval
- Never allow clients to self-approve or set prices

### 2. OAuth Development Mode
- `oauthService.ts` checks `import.meta.env.DEV` flag
- In dev: simulates OAuth with prompts (no Google API keys needed)
- In prod: full OAuth 2.0 flow with `VITE_GOOGLE_CLIENT_ID`

### 3. Real-Time Communication
- `CommunicationService` uses BroadcastChannel for local, WebSocket for network
- Events use `.on()` and `.off()` pattern (similar to EventEmitter)
- Always clean up listeners in component `useEffect` return

### 4. Session Timer Management
- `sessionService` runs intervals, calls registered callbacks
- Supports pause/resume, extensions, warnings at 5 minutes
- Timer state synchronized across Master and Client

### 5. Conditional Rendering Based on OAuth
- `ClientSession` checks `if (oauthSession)` to decide UI:
  - OAuth users: See GamesPanel with floating timer widget
  - Regular users: See full-screen timer with pause/resume controls

## State Management Patterns

- **No Redux**: Pure React hooks (`useState`, `useEffect`)
- **Communication via props**: Parent-child data flow
- **Real-time via events**: `communication.on('event', handler)`
- **Persistence via services**: All DB operations in service layer

## Common Development Tasks

### Adding New Game
1. Edit `services/initAdvancedFeatures.ts` → add to `sampleGames` array
2. Game icon auto-selected in `GamesPanel.tsx` based on name/category
3. Re-run `initializeSystem()` or manually insert via Master PC

### Adding New Communication Message Type
1. Update `gaming-types.ts` → extend `WebSocketMessage['type']`
2. Send: `communication.send({ type: 'new_type', ... })`
3. Receive: `communication.on('new_type', handler)` in component
4. Clean up: `communication.off('new_type', handler)` in useEffect return

### Modifying OAuth Flow
- **Client side**: `ClientLogin.tsx` → `handleGmailLogin()` → triggers `oauthService.initiateGoogleLogin()`
- **Waiting state**: `GamingParlourApp.tsx` → `handleOAuthLoginSuccess()` → sets `clientState: 'waiting_approval'`
- **Master side**: `PendingOAuthRequests.tsx` → `handleApprove()` → creates session, sends approval
- **Approval handling**: `GamingParlourApp.tsx` → `useEffect` listener for `session_approved`

## Browser Cache Issues

When changes don't appear:
1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Dev tools**: F12 → Right-click refresh → "Empty Cache and Hard Reload"
3. **Incognito**: Test in private window
4. **Nuclear**: Ctrl+Shift+Delete → Clear cache

Vite's HMR is aggressive but may miss changes in:
- Type definitions (`gaming-types.ts`)
- Service layer files
- Communication event handlers

## Testing Multi-PC Flow Locally

Open 2+ browser tabs:
1. **Tab 1**: http://localhost:5173 → Master PC → Login `admin`/`admin123`
2. **Tab 2**: http://localhost:5173 → Client PC → PC-1 → Click "Continue with Google"
3. **Tab 1**: See pending request → Review & Approve → Select pricing → Approve
4. **Tab 2**: Automatically shows games panel → Click Valorant → Game launches

## Production Deployment Notes

- Build: `npm run build` → outputs to `dist/`
- Serve: Use `vite preview --host 0.0.0.0 --port 5173` or any static server
- Network: Ensure port 5173 open in firewall
- Environment: Set `VITE_GOOGLE_CLIENT_ID` for real OAuth
- Database: Runs in browser - each PC has own IndexedDB + localStorage

## Important Files Not to Modify Carelessly

- `gaming-types.ts` - Central type definitions, breaking changes affect entire codebase
- `communicationService.ts` - Critical for Master ↔ Client sync
- `sessionService.ts` - Manages timer intervals, easy to introduce memory leaks
- `GamingParlourApp.tsx` - Main orchestrator, state machine must stay consistent

## Design Principles

- **Gradient aesthetics**: Purple/blue/indigo gradients throughout
- **Glass morphism**: backdrop-blur + transparency for modern UI
- **Real-time first**: All changes propagate via communication service
- **Master authority**: Never trust client PC for business decisions
- **Type safety**: Strict TypeScript, no `any` except in event handlers
- **Service layer**: No direct DB calls in components, always use services
