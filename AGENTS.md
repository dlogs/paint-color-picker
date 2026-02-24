# Paint Color Picker - Agent Instructions & Architecture

This document provides essential context and rules for AI agents working on the "paint-color-picker" project.

## Tech Stack & Architecture
- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, `shadcn/ui` components
- **Routing**: `react-router`
- **Data Tables**: `@tanstack/react-table` combined with a custom intersection-observer hook for infinite scrolling.
- **Color Processing**: `chroma-js` is used for color permutations (hex to OKLab/OKLCH) and calculating perceivable color differences (Delta-E).
- **Search Capabilities**: A custom KD-Tree (`src/util/kd-tree.ts` & `src/util/similarity.ts`) is used to rapidly ascertain the closest colors based on OKLab coordinates.

## Core Concepts & Data Flow
1. **ASE Parsing & Data Build Pipeline**:
   - Swatches originate from Adobe Swatch Exchange (`.ase`) files in `/ase-files`. 
   - Before runtime, `tsx scripts/build-swatches.ts` parses these ASE files and serializes them into aggregated JSON artifacts in `/public/colors/`.
   - `sqids` generates concise unique IDs for these colors.
2. **Domain Models**:
   - **`src/types/assets.ts`**: Defines Data Transfer Objects (DTOs) for the network layer.
   - **`src/types/swatch.ts`**: Defines the central `Swatch` entity consumed by React.
   - **`src/types/relationships.ts`**: Defines the data shapes for bridging similar colors.
3. **Application State**:
   - `src/services/swatch-provider.ts`: Fetches network assets and converts them to domain definitions.
   - `src/services/storage-service.ts`: Exclusively handles `localStorage` logic.

## Development Rules & Best Practices
- **Shadcn UI First**: Always prefer `shadcn` components instead of building UI elements from scratch. Use the Shadcn MCP (model context protocol) tools to search for and install new components.
- **Strict Typing**: Use strict TypeScript types. Avoid `any`. Constantly fix type errors as they arise instead of suppressing them.
- **Separated Logic**: Do not bloat React view components with business logic. Utilize the `src/hooks`, `src/services`, and `src/util` layers heavily.
- **Latest Dependencies**: Do your best to adopt to and use the latest versions of libraries.