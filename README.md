# ProseText TTS Website

ProseText is a pay-per-generation text-to-speech website for creating downloadable MP3 audio.

## Stack

- Frontend: Next.js 15 + React + Tailwind CSS
- Backend: FastAPI
- Database/Auth/Storage: Supabase
- Payments: Razorpay
- TTS: Google Cloud Text-to-Speech through the ProseText Cloud Run service
- Production domain: https://prosetext.online

## Project structure

```text
prosetext-tts-website/
├── frontend/
└── backend/
    └── app/
```

## Local development

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in the required values.

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local` and configure the backend URL.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production configuration

Frontend:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-VERCEL-DOMAIN.vercel.app
```

Backend:

```env
FRONTEND_URL=https://prosetext.online
```

The backend also requires Supabase, Razorpay, Google Cloud TTS, cleanup, and admin environment variables. Never commit `.env` files or production secrets.

## Pricing

Admin Pricing is the source of truth for customer-facing prices and the amount sent to Razorpay.

## Audio lifecycle

Paid audio is generated after successful payment, stored temporarily for delivery, and removed according to the application's download/expiry cleanup rules.

Voice previews are generated dynamically and are not intended to be stored as permanent audio files.
