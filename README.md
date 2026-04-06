# PassCard KE - Access the Xtraordinary

The ultimate ticketing platform for seamless event experiences.

## Features
- ✨ Modern, responsive UI with Tailwind CSS
- 🎫 Seamless event ticket purchasing
- 🔒 Secure Admin Dashboard with Firebase Authentication
- 📱 Mobile-optimized QR code scanner for ticket verification
- 💳 M-Pesa Daraja API integration
- 📧 Automated ticket and report emails with PDF attachments

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Motion
- **Backend**: Node.js, Express
- **Database**: SQLite (Local), Firestore (Cloud)
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Email**: Nodemailer
- **PDF Generation**: PDFKit

## Getting Started

### Prerequisites
- Node.js 20+
- Firebase Project

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` (see `.env.example`)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Environment Variables
Ensure the following environment variables are set in your deployment environment:
- `GEMINI_API_KEY`
- `APP_URL`
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_CALLBACK_URL`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `ADMIN_EMAILS` (comma-separated list of authorized admin emails)
- `JWT_SECRET`

### Build and Start
```bash
npm run build
npm start
```

## License
MIT
