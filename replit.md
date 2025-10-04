# Musical Note Generator Application

## Overview

This is a comprehensive musical note generator application built as a full-stack web application. The application provides three distinct modes for generating and playing musical sequences with proper timing and music theory concepts. It includes a real-time metronome, audio playback with Web Audio API, and educational tools for learning music theory intervals and chord progressions.

The application is designed to help users learn music theory through interactive generation of random note sequences, popular chord progressions, and musical patterns, all with accurate timing and playback capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with local storage persistence via custom hooks
- **Audio Engine**: Custom Web Audio API implementation with Web Workers for precise timing

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Development Server**: Vite integration for hot module replacement
- **Storage Interface**: Abstract storage interface with in-memory implementation (ready for database integration)
- **API Structure**: RESTful API with `/api` prefix routing

### Data Management
- **Schema Validation**: Zod schemas for type-safe data validation
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Local Storage**: Custom hook for persisting user settings and application state
- **State Persistence**: Settings automatically saved to browser local storage

### Audio System Design
- **Audio Context**: Web Audio API with mobile compatibility
- **Timing Engine**: Web Worker-based scheduler for precise musical timing
- **Metronome**: Real-time BPM control with count-in functionality
- **Note Generation**: Music theory-based algorithms for interval generation and chord progressions
- **Playback Control**: Independent playback for each mode with configurable subdivisions and swing

### Music Theory Engine
- **Interval Calculations**: Complete interval system with semitone mapping
- **Chord Progressions**: Popular progressions (Dorian Rock, Pop, Jazz) with correct enharmonic spelling
- **Circle of Fifths**: Pattern generation with clockwise/counterclockwise movement
- **Scale Systems**: Support for major/minor scales with proper key signature handling
- **Note Validation**: Rules-based generation preventing excessive consecutive seconds

### Component Architecture
- **Mode System**: Three independent modes (Random, Progressions, Patterns) with shared playback controls
- **Global Metronome**: Centralized timing system with volume and count-in controls
- **Keyboard Shortcuts**: System-wide shortcuts for playback control and mode switching
- **Responsive Design**: Mobile-first approach with touch-friendly controls
- **Branding**: NSM (Nathaniel School of Music) logo prominently displayed in header
- **Wave Type Switching**: Seamless audio wave type changes during playback using ref-based dynamic value system
- **Random Mode Playback Control**: Manual playback activation only - Generate Notes button creates sequences without auto-play; Generate button disabled during playback to prevent mid-playback changes

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React DOM, React Query for state management
- **Build Tools**: Vite for development and bundling, ESBuild for production builds
- **Routing**: Wouter for lightweight client-side routing

### UI and Styling
- **Component Library**: Radix UI primitives for accessibility-compliant components
- **Styling**: Tailwind CSS with PostCSS for processing
- **Icons**: Lucide React for consistent iconography
- **Animations**: Class Variance Authority for component variants

### Audio and Music
- **Web Audio API**: Native browser audio context for sound generation
- **Web Workers**: For precise timing scheduling independent of main thread
- **Date Functions**: date-fns for time calculations and formatting

### Development and Database
- **Database**: Drizzle ORM with PostgreSQL dialect, Neon Database serverless integration
- **Validation**: Zod for runtime type checking and schema validation
- **Development**: TypeScript for type safety, TSX for server runtime

### Form Handling and Utilities
- **Forms**: React Hook Form with Hookform Resolvers for validation
- **Utilities**: clsx and tailwind-merge for conditional styling
- **Session Management**: Connect-pg-simple for PostgreSQL session storage (configured but not actively used)

### Replit Integration
- **Development Tools**: Replit-specific plugins for error handling and cartographer integration
- **Environment**: Configured for Replit deployment with proper asset handling