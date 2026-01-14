# OpCore: The Operating System for Nigerian Businesses

**OpCore** is an offline-first, compliant financial management platform designed for Nigerian SMEs and Individuals. It simplifies tax, bookkeeping, and invoicing while ensuring compliance with the Finance Act 2024.

## Key Features
- **Offline-First**: Works without internet. Syncs when back online.
- **Fiscal Engine**: Auto-detects turnover (>₦50m) and activates compliance modules.
- **Tax Optimizer**: Analyze expenses against Section 21(p) for deductibility.
- **Brand Studio**: Whitelabel your dashboard and invoices.
- **Multi-Profile**: Support for Personal (Salary) and Business (Corporate) accounts.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1.  Clone the repo.
2.  `npm install`
3.  `npm run dev`

### "Reboot" / Reset
To clear all data and start fresh:
1.  Open the app.
2.  `window.resetApp()` (if enabled in console) or use the Emergency Reset on the loading screen.

## Documentation
- [Reboot Plan](.gemini/antigravity/brain/79bf5d76-f034-4c40-a313-5c805dfdcb44/reboot_plan.md)
- [Branding Guide](.gemini/antigravity/brain/79bf5d76-f034-4c40-a313-5c805dfdcb44/branding_guide.md)
- [Development Guide](.gemini/antigravity/brain/79bf5d76-f034-4c40-a313-5c805dfdcb44/development_guide.md)
- [Tax Guide](.gemini/antigravity/brain/79bf5d76-f034-4c40-a313-5c805dfdcb44/tax_guide.md)

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Local DB**: WatermelonDB
- **Build**: Vite
