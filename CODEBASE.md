# LearnForwardSTEM - Codebase Documentation

## Project Overview

**LearnForwardSTEM** is a student-led nonprofit initiative dedicated to making high-quality STEM education accessible to every middle school student in Saudi Arabia. The platform provides free instruction in **Mathematics** and **Computer Science** through a network of volunteer high school and university mentors.

### Core Philosophy
**"By Students, For Students"** — A community built on collaboration, trust, and a shared dedication to making STEM learning accessible.

---

## Technology Stack

- **Framework:** React 18 (Vite + TypeScript)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Backend:** Firebase Authentication & Firestore
- **UI Components:** Lucide React Icons
- **State Management:** React Context API
- **Storage:** LocalStorage + Firebase Cloud Storage

---

## Project Structure

```
src/
├── App.tsx              # Main application component with routing
├── firebase.ts          # Firebase configuration & initialization
├── db.ts                # Local + Cloud database operations
├── types.ts             # TypeScript interfaces & types
├── main.tsx             # React entry point
└── index.css            # Global styles

Root files:
├── .env.example         # Environment variables template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies & scripts
```

---

## File-by-File Breakdown

### **src/App.tsx** (Main Application, ~1764 lines)

**Purpose:** Core application logic, routing, authentication, and UI components.

**Key Features:**

1. **Authentication Context (`AuthContext`)**
   - Google OAuth Sign-In integration
   - Student profile verification
   - Admin authentication (hardcoded credentials)
   - Role-Based Access Control (RBAC)
   - Methods: `loginWithGoogle()`, `logout()`, `adminLogin()`, `triggerSync()`

2. **Page Transition System (`RouteTransition`)**
   - Strict zero-animation policy (300ms static loader)
   - Displays "Syncing Workspace..." during navigation
   - Prevents layout jank and janky transitions

3. **Layout Component**
   - Sticky navigation bar with logo and links
   - Dark mode toggle (affects entire DOM)
   - Mobile hamburger menu
   - Footer with admin login portal
   - Global CSS injection disabling all animations

4. **Page Components:**
   - **Home** - Hero section with CTA buttons
   - **About** - Initiative description & logo philosophy
   - **Programs** - Mathematics & Computer Science tracks (NO Mentorship/Projects)
   - **Workspace** - Google Calendar embed, Meet booking (student-only), Discord webhook config
   - **Join** - Dual-tab forms (Tutor Application & Student Registration)
   - **Contact** - Contact form with email template preview

5. **Admin Dashboard**
   - Invisible to non-admins (completely hidden from DOM)
   - Accessed via "Admin Login" button in footer
   - Shows: Tutor applications, Student registrations, Messages, System logs
   - Admin credentials: `email: LearnForwardSTEM@gmail.com`, `password: Admin`

**Color Palette:**
- Primary: Burgundy-Maroon (#5e161c)
- Accent: Ochre-Yellow (#d3a43f)
- Light: Cream (#ede4d4)
- Dark: Charcoal (#282828)

---

### **src/firebase.ts** (Firebase Configuration)

**Purpose:** Firebase app initialization, authentication, and error handling.

**Exports:**

- `isFirebaseConfigured` - Boolean flag indicating Firebase readiness
- `app` - Firebase App instance
- `auth` - Firebase Auth object
- `db` - Firestore database instance
- `googleProvider` - Google OAuth provider
- `handleFirestoreError()` - Error handler with comprehensive logging
- `testFirestoreConnection()` - Connectivity check
- `OperationType` enum - CRUD operation types

**Environment Variables Required:**

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

### **src/db.ts** (Database Operations, ~296 lines)

**Purpose:** Local storage + Firestore synchronization for all entities.

**Key Classes & Methods:**

**LearnForwardDB** (static class)

1. **Tutor Management:**
   - `saveTutor()` - Save tutor application to localStorage + Firestore
   - `getTutors()` - Retrieve all tutor applications

2. **Student Management:**
   - `saveStudent()` - Save student registration with userUid
   - `getStudents()` - Retrieve all student registrations

3. **Message Management:**
   - `saveMessage()` - Save contact form messages
   - `getMessages()` - Retrieve all messages

4. **Calendar Events:**
   - `addCalendarEvent()` - Book a tutor session
   - `getCalendarEvents()` - List all events
   - **DEFAULT_EVENTS** - Seed data (Python & Math classes)

5. **System Logging:**
   - `log()` - Create system logs (info, warn, error, security)
   - `getLogs()` - Retrieve last 100 logs
   - **Levels:** info, warn, error, security

6. **Utilities:**
   - `clearDatabase()` - Wipe all local data (admin only)
   - `syncFromFirestore()` - Sync cloud collections to localStorage
   - `generateEmailTemplate()` - HTML email template renderer
   - `sendDiscordNotification()` - Send Discord webhook embeds

**Storage Keys:**
- `lf_tutors` - Tutor applications
- `lf_students` - Student registrations
- `lf_messages` - Contact messages
- `lf_events` - Calendar events
- `lf_logs` - System logs (last 100)
- `lf_discord_webhook` - Discord webhook URL
- `lf_admin_logged` - Admin session flag

---

### **src/types.ts** (TypeScript Definitions)

**Interfaces:**

```typescript
interface TutorApplication {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  schoolUniversity: string;
  majorGrade: string;
  subjects: string[]; // ["Mathematics", "Computer Science"]
  bio: string;
  hoursPerWeek: number;
  submittedAt: string;
}

interface StudentRegistration {
  id: string;
  fullName: string;
  parentEmail: string;
  parentWhatsapp: string;
  gradeLevel: string; // "Grade 6", "Grade 7", "Grade 8"
  subjects: string[]; // ["Mathematics", "Computer Science"]
  location: string;
  userUid: string; // Firebase UID
  submittedAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  type: 'class' | 'event';
  discordUser?: string; // Student's Discord username
  userUid?: string; // Booking user's Firebase UID
}
```

---

## Feature Breakdown

### 1. **Authentication Flow**

```
User → "Authorize with Google" → Firebase Google OAuth
      → Store UID + Email in Context
      → Fetch student registration status
      → Enable/disable booking based on student status
```

**Dual-Criteria Student Booking Guard:**
- ✅ Must be authenticated via Google Sign-In
- ✅ Must have submitted Student Registration form
- ✅ Must provide Discord Username
- ✅ Must select subject (Math or Computer Science)

### 2. **Form Submissions**

**Tutor Application:**
- Full Name, Email, WhatsApp, School/University, Major/Grade
- Subjects: Math +/or Computer Science
- Bio + Hours per week availability
- Stored to: `lf_tutors` localStorage + Firestore
- Discord notification if webhook configured

**Student Registration:**
- Student name, Parent email, Parent WhatsApp
- Grade level (6-8 or Other)
- Location (Saudi Arabia)
- Subjects: Math + /or Computer Science
- Stored with: Google UID, timestamp
- Enables booking privileges

**Contact Message:**
- Name, Email, Subject, Message
- HTML email template generated
- Admin receives copy with all details
- Sender gets confirmation email

### 3. **Admin Dashboard**

**Access:** Bottom-right footer "Admin Login" → Modal form
**Credentials:** 
- Email: `LearnForwardSTEM@gmail.com` (pre-filled, disabled)
- Password: `Admin`

**Visible to Admins Only:**
- Tutor applications count & details
- Student registrations count & details
- Contact inquiries with timestamps
- System logs (security audits)
- Real-time metrics (CPU, latency)
- Factory Reset button (dangerous!)

**Hidden from Non-Admins:** Completely removed from DOM unless `isAdmin` is true.

### 4. **Google Integrations**

| Service | Implementation | Status |
|---------|-----------------|--------|
| **Google OAuth** | Firebase Auth + Sign-In button | ✅ Active |
| **Google Calendar** | Public iframe embed (Saudi Arabia holidays) | ✅ Embedded |
| **Google Meet** | Mock URLs generated, actual links open externally | ✅ Working |
| **Google Forms** | CTA buttons link to external forms | ✅ External links |
| **Gmail** | Email templates shown (no actual SMTP setup yet) | ⚠️ Preview only |

### 5. **Discord Integration**

**Setup:**
1. Create Discord server & webhook in Server Settings → Integrations → Webhooks
2. Paste webhook URL in Workspace page
3. All actions trigger Discord embeds automatically

**Triggers:**
- New tutor application
- New student registration
- New calendar booking
- New contact message
- Test broadcast button

**Embed Format:**
- Title (action type)
- Color: #5e161c (Maroon)
- Fields: Name, Subject, Email, etc.
- Timestamp & footer with "LearnForwardSTEM Event Watcher"

---

## Security & Access Control

### Role-Based Access (RBAC)

```
Anonymous User:
├── View: Home, About, Programs, Contact
├── Action: Read-only, see public info, contact form

Google Sign-In User (Student):
├── View: All pages
├── Action: Submit tutor/student form, book meetings (if registered student)
├── Booking: Requires Discord username + subject selection

Admin:
├── View: Admin Dashboard (hidden panel)
├── Action: View all data, clear database, audit logs
├── Access: Via "Admin Login" with hardcoded credentials
```

### Data Security

- **Client-side validation** on all forms
- **localStorage** for temporary caching
- **Firebase Firestore** for persistent storage
- **No authentication required** for contact form (intentional for accessibility)
- **Session storage** for admin login state (`lf_admin_logged`)

---

## Environment Setup

### Required Variables (.env file)

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Gmail Setup (Optional)
VITE_GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Firebase Console Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication → Google Sign-In
3. Add Authorized Domains:
   - `ais-dev-e7ehz3uvbjdi7jmxxhwnxj-895297724881.europe-west2.run.app`
   - `ais-pre-e7ehz3uvbjdi7jmxxhwnxj-895297724881.europe-west2.run.app`
4. Create Firestore database in production mode
5. Set collection rules:
   ```
   allow read: if true;
   allow create, update, delete: if request.auth != null;
   ```

---

## Deployment & Performance

### Build & Deployment
```bash
npm install
npm run build
# Deploy to Vercel or Netlify
```

### Performance Optimizations
- ✅ Zero animations (fast interactions)
- ✅ Static HTML email templates (no rendering)
- ✅ LocalStorage caching (instant page loads)
- ✅ Firebase Firestore sync (background sync)
- ✅ Vite production build (optimized bundle)

### Accessibility Compliance
- ✅ WCAG 2.1 AA contrast ratios
- ✅ Keyboard navigation support
- ✅ Form labels & aria-labels
- ✅ High-contrast dark mode
- ✅ Semantic HTML structure

---

## Known Limitations & Future Enhancements

### Current Limitations
- ⚠️ Gmail SMTP not configured (email templates preview-only)
- ⚠️ Admin credentials hardcoded (should use Firebase Auth admin custom claims)
- ⚠️ No user messaging system (direct tutor-student chat)
- ⚠️ Calendar events are mock-generated (not synced to actual Google Calendar)
- ⚠️ No payment/subscription system

### Recommended Future Features
- 📧 Real email delivery via SendGrid or AWS SES
- 💬 In-app student-tutor messaging system
- 📊 Student progress tracking dashboard
- 🎯 Personalized tutor matching algorithm
- 🔐 Two-factor authentication (2FA)
- 📱 Mobile app (React Native)
- 🌍 Multi-language support (Arabic)
- 🎨 Student portfolio showcase
- ⭐ Peer reviews & ratings system

---

## Maintenance & Troubleshooting

### Common Issues

**"Firebase not configured" message:**
- Check `.env` file has all Firebase variables
- Verify VITE_ prefix on environment variables
- Restart dev server: `npm run dev`

**Google Sign-In not working:**
- Verify domain in Firebase Console → Authorized Domains
- Check browser console for CORS errors
- Ensure `googleProvider` initialized correctly

**Admin dashboard not showing:**
- Verify session storage: Check DevTools → Application → Session Storage → `lf_admin_logged`
- Use correct password: `Admin`
- Check email is: `LearnForwardSTEM@gmail.com`

**Calendar events not saving:**
- Check LocalStorage: DevTools → Application → LocalStorage → `lf_events`
- Verify Firestore connection: Check console logs
- Try clearing cache: Click "Security Factory Reset databases" in admin panel

---

## Support & Contact

- **Email:** LearnForwardSTEM@gmail.com
- **Instagram:** @learnforwardSTEM
- **TikTok:** @learnforwardSTEM
- **Discord:** [Create server]
- **Repository:** github.com/learnforwardstem/LearnForwardSTEM-Hub

---

**Last Updated:** June 6, 2026
**Version:** 1.0.0
**Maintained by:** LearnForwardSTEM Development Team
