# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fit Check** is a virtual try-on application that allows users to upload photos of themselves and see how different clothing items and accessories would look on them. The app uses Google's Gemini AI (specifically `gemini-2.5-flash-image-preview`) for photorealistic image generation.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (starts on http://localhost:5173 by default)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Before running the app, create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config (`vite.config.ts`) exposes this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` to the application.

## Architecture

### Core State Management (App.tsx)

The app uses a **layered outfit history system** (`outfitHistory: OutfitLayer[]`):
- Each layer represents adding one item (garment or accessory) to the model
- Layer 0 is always the base model image
- Users can navigate backward through history (`currentOutfitIndex`) to see previous states
- Each layer caches multiple pose variations (`poseImages: Record<string, string>`)
- When re-applying a previously used item, the app uses cached layers instead of regenerating

### AI Image Generation Flow (services/geminiService.ts)

The Gemini service provides 5 key operations:

1. **`generateModelImage`**: Transforms user photo into a fashion model with neutral studio background
2. **`generateVirtualTryOnImage`**: Replaces existing clothing with new garment (complete replacement)
3. **`generateAccessoryTryOnImage`**: Adds accessories without replacing clothing
4. **`generatePoseVariation`**: Regenerates current outfit in a different pose
5. **`generateColorVariation`**: Recolors a specific garment to a different color

All functions return base64 data URLs and handle API errors through `handleApiResponse()`.

### Component Structure

- **StartScreen**: Initial user photo upload and model generation with before/after comparison
- **Canvas**: Main display area showing current outfit with pose controls
- **OutfitStack**: Visual layer manager showing all applied items (right panel)
- **WardrobeModal**: Item selector for garments and accessories
- **SavedOutfitsPanel**: Manages saved outfit collections (persisted to localStorage)
- **LookbookModal**: Creates shareable lookbook images from saved outfits
- **ColorPickerModal**: Allows recoloring of individual garments

### Data Types (types.ts)

- **WardrobeItem**: Represents a clothing item or accessory (has `type: 'garment' | 'accessory'`)
- **OutfitLayer**: Links a wardrobe item to its generated images across different poses
- **SavedOutfit**: Complete outfit state including model, layers, and preview image

### Styling

- Uses Tailwind CSS with utility classes
- `lib/utils.ts` provides `cn()` helper for conditional class merging
- Responsive design with mobile-first approach (collapses side panel on mobile)
- Framer Motion for page transitions and animations

### State Persistence

- Saved outfits stored in localStorage under key `'virtual-try-on-saved-outfits'`
- Default wardrobe items loaded from `wardrobe.ts` (CDN-hosted images)

## Key Implementation Details

### Garment vs Accessory Handling
- **Garments** use `generateVirtualTryOnImage` (replaces existing clothes)
- **Accessories** use `generateAccessoryTryOnImage` (adds to existing outfit)
- Both types managed in separate state arrays (`wardrobe` vs `accessories`)

### Pose Caching Strategy
When a user changes pose:
1. Check if pose already exists for current layer (`currentLayer.poseImages[poseInstruction]`)
2. If yes, just update the UI to show it
3. If no, generate new image using `generatePoseVariation` and cache it

### History Navigation
- Users can step backward through outfit history without losing forward states
- Adding a new item while not at the latest index truncates future history
- This provides an intuitive undo/redo experience

### Error Handling
- `getFriendlyErrorMessage()` in `lib/utils.ts` translates API errors to user-friendly messages
- Special handling for unsupported MIME types and API safety blocks
- Errors displayed in red alert boxes in the UI

## Path Aliases

TypeScript and Vite configured with `@/` alias pointing to root directory (see `tsconfig.json` and `vite.config.ts`).

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Google Gemini AI** (@google/genai) for image generation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **react-image-crop** for image cropping
- **html-to-image** for lookbook generation
