# Expense Tracker - Professional Setup Guide

## 📁 Project Structure

```
expense-tracker/
├── index.html              # Main dashboard (home page)
├── borrow.html             # Borrow/Lend tracking page
├── transactions.html       # All transactions view
├── insights.html           # Analytics & insights
├── login.html              # Login page
├── signup.html             # Sign up page
├── forgot-password.html    # Password recovery page
├── account.html            # User account/profile page
├── vercel.json             # Vercel configuration for clean URLs
├── supabase-schema.sql     # Database schema for Supabase
├── src/
│   ├── css/
│   │   └── styles.css      # Shared CSS styles
│   └── js/
│       ├── config.js       # Configuration & shared utilities
│       └── auth.js         # Authentication module
└── README.md               # This file
```

---

## 🔧 Step-by-Step Setup Instructions

### Step 1: Set Up Supabase Database

1. **Go to [Supabase](https://supabase.com)** and create a new project (or use existing one)

2. **Open SQL Editor** in your Supabase dashboard

3. **Run the SQL Schema**:
   - Copy the entire content of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute all queries

4. **Note Your Credentials**:
   - Go to Settings → API
   - Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy your **anon/public key**

5. **Update Configuration**:
   - Open `/src/js/config.js`
   - Replace `SUPABASE_URL` with your project URL
   - Replace `SUPABASE_ANON_KEY` with your anon key

---

### Step 2: Configure Environment Variables (Optional but Recommended)

For better security, create a `.env` file or use Vercel environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then update `config.js` to read from environment variables.

---

### Step 3: Test Locally

1. **Install a local server** (optional but recommended):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js (install live-server globally)
   npm install -g live-server
   live-server --port=8000
   ```

2. **Open browser** and visit:
   - `http://localhost:8000` - Home page
   - `http://localhost:8000/login` - Login page
   - `http://localhost:8000/signup` - Sign up page

3. **Test the authentication flow**:
   - Create a new account at `/signup`
   - Note: In demo mode, OTP is shown in browser console
   - Verify with the OTP
   - Login at `/login`
   - Access your account at `/account`

---

### Step 4: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
   git push -u origin main
   ```

2. **Go to [Vercel](https://vercel.com)**:
   - Click "New Project"
   - Import your GitHub repository
   - Keep default settings

3. **Configure Environment Variables** (in Vercel dashboard):
   - Add `SUPABASE_URL`
   - Add `SUPABASE_ANON_KEY`

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

### Step 5: Configure Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project settings
   - Navigate to "Domains"
   - Add your custom domain

2. **Update DNS records** at your domain registrar as instructed

---

## 🔐 Security Features Implemented

### What's Fixed:

1. **PIN Hashing**: PINs are now hashed using SHA-256 before storing
2. **No Hardcoded Credentials in Client**: API keys are in config file (use env vars in production)
3. **Session Management**: Secure session handling with remember me option
4. **Email Verification**: OTP-based email verification
5. **Password Recovery**: Secure OTP-based password reset
6. **Input Validation**: All inputs are validated on client side

### Important Security Notes:

⚠️ **For Production**, you should:

1. **Use Environment Variables**: Never expose API keys in frontend code
   ```javascript
   // Use Vercel environment variables
   const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
   ```

2. **Implement Server-Side Validation**: Add Edge Functions for sensitive operations

3. **Use Proper Password Hashing**: Replace SHA-256 with bcrypt for production

4. **Enable Email Service**: Configure Supabase Email or use Resend/SendGrid for real OTP emails

5. **Add Rate Limiting**: Prevent brute force attacks

6. **Enable HTTPS**: Vercel provides this automatically

---

## 🌟 New Features Added

### Authentication System:
- ✅ **Sign Up** with email verification (OTP)
- ✅ **Login** with email/username + PIN
- ✅ **Remember Me** functionality (persistent sessions)
- ✅ **Forgot Password** with OTP recovery
- ✅ **Account Page** showing user profile

### URL Structure:
- ✅ Clean URLs without `.html` extension
- ✅ `/borrow` instead of `/borrow.html`
- ✅ `/transactions` instead of `/transactions.html`
- ✅ `/insights` instead of `/insights.html`
- ✅ `/login`, `/signup`, `/account`, `/forgot-password`

### Code Organization:
- ✅ Separate CSS files (`/src/css/styles.css`)
- ✅ Modular JavaScript (`/src/js/config.js`, `/src/js/auth.js`)
- ✅ Professional file structure
- ✅ Reusable components

---

## 📝 Usage Guide

### Creating an Account:

1. Visit `/signup`
2. Enter your details:
   - Full Name
   - Email (must end with @gmail.com)
   - Unique Username
   - 6-digit PIN
3. Submit and check for OTP (in console for demo)
4. Enter OTP to verify
5. Redirected to login

### Logging In:

1. Visit `/login`
2. Enter email/username and PIN
3. Check "Remember Me" to stay logged in
4. Click Login

### Accessing Account:

1. Click on profile icon or navigate to `/account`
2. View your name, email, username, member since date
3. Logout option available

### Password Recovery:

1. Visit `/forgot-password`
2. Enter email or username
3. Receive OTP (in console for demo)
4. Enter OTP and new PIN
5. Password reset successfully

---

## 🎨 Design Preservation

All original design features are preserved:
- ✅ Same color scheme and gradients
- ✅ Same animations and transitions
- ✅ Same responsive layout
- ✅ Dark mode support
- ✅ All existing functionality intact

---

## 🚀 Quick Commands

```bash
# Local development
python -m http.server 8000

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase credentials
3. Ensure database tables are created
4. Check network tab for failed requests

---

## 📄 License

This project is for personal/educational use.

---

**Enjoy your professional Expense Tracker! 🎉**
