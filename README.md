# DevCall - Instant Developer Video Consultations

A platform connecting developers with clients for instant video consultations with crypto payments.

Demo Link- 
Project link -

## Features

- 🎥 Instant video calls with developers
- 💰 Crypto payments (USDT)
- 👨‍💻 Developer profiles & availability management
- 📅 Real-time booking system
- 🔒 Secure authentication
- 💼 Project management tools

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, Database, Real-time)
- Lucide React Icons

## Prerequisites

- Node.js 18+
- npm/yarn
- Supabase account
- Google Meet (for video calls)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/devcall.git
cd devcall
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Database Setup

1. Create a new Supabase project
2. Run the migrations from `supabase/migrations` folder
3. Enable Row Level Security (RLS) policies

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility functions & Supabase client
│   ├── pages/         # Page components
│   └── App.tsx        # Main application component
├── supabase/
│   ├── migrations/    # Database migrations
│   └── functions/     # Edge functions
```

## Key Features

### For Developers
- Create professional profiles
- Set hourly rates
- Manage availability
- Handle bookings
- Receive crypto payments

### For Customers
- Browse developer profiles
- Book instant consultations
- Make secure payments
- Join video calls

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details
