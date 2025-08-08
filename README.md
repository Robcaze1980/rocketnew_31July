# Auto Sales Commission Dashboard

A comprehensive dashboard for managing auto sales commissions with real-time analytics and reporting features.

## Features

- Real-time sales tracking and commission calculation
- Team performance analytics and reporting
- Department KPI monitoring
- Double claim detection and resolution
- Export capabilities (CSV, Excel, PDF)
- Responsive design for all devices

## Deployment to Netlify

This project is configured for easy deployment to Netlify.

### Prerequisites

- A Netlify account
- This repository

### Deployment Steps

1. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select this repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - These settings are already configured in `netlify.toml`

3. **Environment Variables:**
   - Set the following environment variables in Netlify:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
     - `VITE_OPENAI_API_KEY` - Your OpenAI API key (optional)

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Manual Deployment

If you prefer to deploy manually:

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `build` directory to your hosting provider

## Development

To run the project locally:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:4032

## Build Configuration

- Build command: `npm run build`
- Output directory: `build`
- Development server port: 4032

## Technologies Used

- React
- Vite
- Tailwind CSS
- Supabase
- jsPDF
- Recharts
- React Router

## License

