# EdUA Learning Platform - Complete Setup Guide

## Quick Links

- **Local Development**: See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
- **File Storage**: See [FILE_STORAGE_GUIDE.md](FILE_STORAGE_GUIDE.md)
- **Refactoring Details**: See [plan.md](plan.md)
- **Change Summary**: See [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md)

## Project Status

✅ **PRODUCTION READY**

- Monolith refactored to independent backend + frontend
- File storage system fully implemented
- Complete documentation provided
- Local development setup automated

## Getting Started (2 minutes)

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)

### Start Backend
```bash
cd backend
cp .env.example .env
nano .env  # Edit with your MongoDB URI
npm install
npm start
```

Backend runs on: **http://localhost:5000**

### Start Frontend
```bash
cd frontend
python3 -m http.server 3000
```

Frontend runs on: **http://localhost:3000**

### Test It
Visit: **http://localhost:3000**

You should see the homepage load without errors.

## Deployment

### Render (Backend)
- Repository: Your GitHub repo
- Root Directory: `backend`
- Build: `npm install`
- Start: `node server.js`
- Port: 10000

### Cloudflare Pages (Frontend)
- Repository: Your GitHub repo
- Root Directory: `frontend`
- No build command needed (static site)

## File Structure

```
backend/
  ├── .env.example        ← Configuration template
  ├── server.js          ← API server (HTML routes removed)
  ├── models/
  │   ├── Upload.js      ← File storage model
  │   └── ...
  └── routes/
      ├── files.js       ← File upload/download endpoints
      ├── payments.js    ← Payment processing
      └── ...

frontend/
  ├── js/
  │   ├── config.js      ← API_BASE configuration
  │   ├── auth.js        ← Authentication
  │   └── ...
  ├── views/
  │   ├── index.html
  │   ├── dashboard.html
  │   └── ...
  └── public/css/        ← Stylesheets
```

## Key Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Password reset

### Files
- `POST /api/files/upload` - Upload file to database
- `GET /api/files/:fileId` - Download file
- `GET /api/files/course/:courseId` - List course files
- `GET /api/files/category/:category` - List by category

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses/enroll` - Enroll in course
- `GET /api/users/dashboard` - User dashboard

### Payments
- `POST /api/payments/pesapal/create-order` - Create payment
- `GET /api/payments/pesapal/confirm/:orderTrackingId` - Confirm payment
- `GET /api/payments/pesapal/ipn` - Pesapal webhook

## Environment Variables

Create `.env` in backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/edua
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
PESAPAL_CONSUMER_KEY=your_key
PESAPAL_CONSUMER_SECRET=your_secret
PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3
PESAPAL_CALLBACK_URL=http://localhost:3000/payment-success.html
PESAPAL_IPN_URL=http://localhost:5000/api/payments/pesapal/ipn
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads without 404s
- [ ] Can signup and create user
- [ ] Can login with credentials
- [ ] Dashboard shows user data
- [ ] Can browse courses
- [ ] Can upload files
- [ ] Can download files
- [ ] Payment flow works

## Troubleshooting

### CORS Error
Check `FRONTEND_URL` in `.env` matches your frontend URL

### MongoDB Connection Failed
Verify `MONGODB_URI` in `.env` is correct (Atlas or local)

### API Not Responding
Make sure backend is running with `npm start`

### config.js Not Loading
Hard refresh with `Ctrl+Shift+R` and check browser console

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for more troubleshooting.

## Features

✅ User authentication with JWT
✅ Course enrollment and management
✅ File upload to MongoDB (base64)
✅ File download tracking
✅ Payment processing (Pesapal)
✅ Admin panel
✅ Responsive design
✅ Dark/light theme support

## Architecture

```
Frontend (Cloudflare Pages)          Backend (Render)
┌──────────────────────┐             ┌──────────────────┐
│  Static HTML/CSS/JS  │             │  Express API     │
│  http://localhost    │   ←───────→ │  http://localhost│
│      :3000           │             │     :5000        │
└──────────────────────┘             └────────┬─────────┘
                                               │
                                        ┌──────▼──────┐
                                        │   MongoDB   │
                                        │   Database  │
                                        └─────────────┘
```

## Files Overview

| File | Purpose | Status |
|------|---------|--------|
| backend/server.js | API server | Modified (HTML routes removed) |
| backend/routes/payments.js | Payment processing | Modified (callback removed) |
| backend/models/Upload.js | File storage | Ready to use |
| backend/routes/files.js | File upload/download | Ready to use |
| frontend/js/config.js | API configuration | New (auto-detects env) |
| All HTML files | Frontend views | Updated (config.js added) |

## Documentation

1. **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Local setup guide
2. **[FILE_STORAGE_GUIDE.md](FILE_STORAGE_GUIDE.md)** - File API guide
3. **[plan.md](plan.md)** - Implementation plan
4. **[REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md)** - Summary of changes
5. **[CHANGES_REFERENCE.txt](CHANGES_REFERENCE.txt)** - Detailed change log

## Support

For detailed guides:
- Local development issues → [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
- File upload/download → [FILE_STORAGE_GUIDE.md](FILE_STORAGE_GUIDE.md)
- Technical details → [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md)
- All changes made → [CHANGES_REFERENCE.txt](CHANGES_REFERENCE.txt)

## Next Steps

1. Read [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. Set up `.env` with your MongoDB URI
3. Run `npm start` in backend/
4. Run `python3 -m http.server 3000` in frontend/
5. Visit http://localhost:3000

Happy coding! 🚀
