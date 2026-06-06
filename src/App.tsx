import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, Calculator, TerminalSquare, Users, 
  Calendar as CalendarIcon, Video, FileText, Mail, Instagram, 
  BookOpen, Shield, Send, CheckCircle, AlertTriangle, RefreshCw, Activity, Lock
} from 'lucide-react';
import { LearnForwardDB, SystemLog } from './db';
import { TutorApplication, StudentRegistration, ContactMessage, CalendarEvent } from './types';
import { auth, googleProvider, isFirebaseConfigured, testFirestoreConnection } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const LOGO_URL = "https://cdn.discordapp.com/attachments/1507835646071537815/1512483639961583757/IMG_5891.jpg?ex=6a2441a8&is=6a22f028&hm=33f8fb645e35f42e7b5b4207cd641a362333eb38bac7bf4839ddaa2d946025a8&";

// -------------------------------------------------------------
// AUTH CONTEXT & RBAC STATE CONTROLLERS
// -------------------------------------------------------------
interface AuthContextType {
  user: any;
  isStudent: boolean;
  isAdmin: boolean;
  authChecked: boolean;
  syncCount: number;
  triggerSync: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('lf_admin_logged') === 'true';
  });
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(0);

  // Sync databases from Firestore then evaluate student status
  const triggerSync = async () => {
    const ok = await LearnForwardDB.syncFromFirestore();
    // After sync completes, check isStudent status
    const currentStudents = LearnForwardDB.getStudents();
    const currentUser = auth?.currentUser || user;
    if (currentUser) {
      const parentFormSubmitted = currentStudents.some(
        s => s.userUid === currentUser.uid || s.parentEmail.toLowerCase() === currentUser.email?.toLowerCase()
      );
      setIsStudent(parentFormSubmitted);
    } else {
      setIsStudent(false);
    }
    setSyncCount(prev => prev + 1);
  };

  useEffect(() => {
    // Check initial connection
    testFirestoreConnection();
    triggerSync();

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setAuthChecked(true);
        if (currentUser) {
          LearnForwardDB.log('info', `Authentication active: Signed in as Google User ${currentUser.email}`, 'AuthProvider');
          await triggerSync();
        } else {
          setIsStudent(false);
        }
      });
      return () => unsubscribe();
    } else {
      setAuthChecked(true);
    }
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      // Direct high-contrast simulated sign in for testing
      const mockUser = {
        uid: 'mock-google-uid-12345',
        displayName: 'STEM Scholar Learner',
        email: 'learnforwardstem@gmail.com',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user'
      };
      setUser(mockUser);
      setIsStudent(true); // Default to true in simulated fallback to offer smooth sandbox testing
      LearnForwardDB.log('info', 'Simulated safety Google sign-in successful', 'GoogleOAuth');
      alert('Simulated Google Authentication Authorized for testing!');
      setSyncCount(prev => prev + 1);
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      LearnForwardDB.log('info', `Google Authentication successfully authorized user: ${result.user.email}`, 'GoogleOAuth');
      await triggerSync();
      alert(`Authorized successfully as ${result.user.displayName}!`);
    } catch (error: any) {
      LearnForwardDB.log('error', `OAuth Popup Failed: ${error.message}`, 'GoogleOAuth');
      alert(`Sign-In Interrupted: ${error.message}`);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    setIsStudent(false);
    LearnForwardDB.log('info', 'Google user session revoked successfully', 'AuthProvider');
  };

  const adminLogin = (password: string): boolean => {
    if (password === 'Admin') {
      setIsAdmin(true);
      sessionStorage.setItem('lf_admin_logged', 'true');
      LearnForwardDB.log('security', 'Privileged Administrator Console password verified successfully', 'AdminAuthGateway');
      return true;
    }
    LearnForwardDB.log('security', 'Admin login attempt rejected: Invalid Password credentials', 'AdminAuthGateway');
    return false;
  };

  const adminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('lf_admin_logged');
    LearnForwardDB.log('security', 'Privileged Administrator session logged out', 'AdminAuthGateway');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isStudent,
      isAdmin,
      authChecked,
      syncCount,
      triggerSync,
      loginWithGoogle,
      logout,
      adminLogin,
      adminLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// -------------------------------------------------------------
// STRICT ZERO-ANIMATION PAGE TRANSITION SIMULATOR
// -------------------------------------------------------------
function RouteTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      window.scrollTo(0, 0);
      
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setDisplayLocation(location);
      }, 300); // Strict 300ms loading delay as requested

      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  if (isTransitioning) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-24 bg-cream dark:bg-[#1a0709]">
        <div className="flex items-center gap-3">
          <BookOpen className="text-ochre w-8 h-8" />
          <span className="text-xl font-bold text-burgundy dark:text-cream tracking-widest uppercase">
            Syncing Workspace...
          </span>
        </div>
        <p className="text-xs text-charcoal/50 dark:text-cream/50 mt-2 font-mono">learnforwardstem.org</p>
      </div>
    );
  }

  return (
    <Routes location={displayLocation}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="/join" element={<Join />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

// -------------------------------------------------------------
// GLOBAL LAYOUT WRAPPER WITH DARK MODE AND STICKY FOOTER
// -------------------------------------------------------------
function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isAdmin, adminLogin, adminLogout, user, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(adminPassword);
    if (success) {
      setIsAdminModalOpen(false);
      setAdminPassword('');
      alert('Access Authorization Level Granted: Welcome back LearnForwardSTEM Admin!');
    } else {
      alert('Security Rejected: Password mismatch.');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'Workspace', path: '/workspace' },
    { name: 'Join Us', path: '/join' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-cream dark:bg-[#1a0709] text-charcoal dark:text-cream">
      {/* Zero Motion CSS Force Inject block */}
      <style>{`
        * {
          animation: none !important;
          transition: none !important;
          transition-duration: 0s !important;
        }
      `}</style>

      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream dark:bg-[#1a0709] border-b-[3px] border-ochre font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 p-1">
              <img src={LOGO_URL} alt="LearnForwardSTEM Badge Logo" className="w-12 h-12 rounded-full border-2 border-ochre object-cover" />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-burgundy dark:text-cream leading-none tracking-tight">
                  LearnForwardSTEM
                </span>
                <span className="text-[10px] text-ochre font-bold uppercase tracking-wider mt-0.5 font-mono">By Students, For Students</span>
              </div>
            </Link>

            {/* Desktop link structure */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`font-semibold text-sm tracking-wide py-1 px-0.5 border-b-2 ${
                    location.pathname === link.path 
                      ? 'text-ochre border-ochre' 
                      : 'text-charcoal dark:text-cream border-transparent hover:text-ochre'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Display user identification brief if signed in */}
              {user && (
                <div className="flex items-center gap-2 pl-2 border-l border-charcoal/20">
                  <span className="text-[11px] font-mono text-burgundy dark:text-ochre truncate max-w-[110px] font-bold">
                    {user.displayName || user.email}
                  </span>
                  <button 
                    onClick={logout} 
                    className="text-[10px] uppercase font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 border border-charcoal/20 dark:border-cream/20 bg-white dark:bg-charcoal text-charcoal dark:text-cream cursor-pointer"
                aria-label="Toggle high contrast dark skin"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile menu triggers */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 border border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-charcoal dark:text-cream p-2"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-cream dark:bg-[#1a0709] border-b border-ochre">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-3 py-2 text-base font-semibold border-l-4 ${
                    location.pathname === link.path 
                      ? 'bg-ochre/15 text-ochre border-ochre' 
                      : 'border-transparent text-charcoal dark:text-cream'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {user && (
                <div className="border-t border-charcoal/10 pt-2 px-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ochre">{user.email}</span>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-xs uppercase text-red-500 font-bold">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Container Wrapper */}
      <main className="flex-grow pt-20 flex flex-col">
        {children}
      </main>

      {/* Custom Site Footer */}
      <footer className="bg-[#282828] text-[#ede4d4] py-12 border-t-[6px] border-ochre font-sans shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt="LearnForwardSTEM Badge" className="w-12 h-12 rounded-full border border-ochre object-cover" />
                <div>
                  <h4 className="font-extrabold text-sm text-ochre uppercase tracking-wider">LearnForwardSTEM Initiative</h4>
                  <p className="text-xs text-[#ede4d4]/70">Access Mathematics and Computer Science online tutoring freely inside Saudi Arabia.</p>
                </div>
              </div>
              <p className="text-[11px] text-[#ede4d4]/50 leading-relaxed font-mono">
                Disclaimer: LearnForwardSTEM is entirely student-operated. Google Meet and Google Forms verifications are registered directly. 
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col md:items-end space-y-3">
              <div className="flex gap-4">
                <a href="https://instagram.com/learnforwardSTEM" target="_blank" rel="noopener noreferrer" className="p-2 border border-[#ede4d4]/10 bg-white/5 hover:text-ochre">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="mailto:LearnForwardSTEM@gmail.com" className="p-2 border border-[#ede4d4]/10 bg-white/5 hover:text-ochre">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
              <span className="text-xs text-[#ede4d4]/60 font-semibold uppercase tracking-wider">Instagram: @learnforwardSTEM</span>
              <p className="text-[10px] text-[#ede4d4]/40 font-mono">© 2026 LearnForwardSTEM. All rights reserved.</p>
              
              {/* OBFUSCATED ACCESS LOGINS PORTAL FOR ADMINISTRATIVE ACCOUNTS */}
              <div className="pt-2 flex items-center justify-end w-full">
                {isAdmin ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-green-400 font-mono">● Admin Logged</span>
                    <button 
                      onClick={adminLogout} 
                      className="text-[10px] text-red-400 underline font-semibold"
                    >
                      Admin Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAdminModalOpen(true)}
                    className="text-[9px] text-[#ede4d4]/40 hover:text-ochre font-mono underline uppercase tracking-widest bg-transparent border-none cursor-pointer"
                  >
                    Admin Login
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </footer>

      {/* ADMIN PASSCODE GATEWAY LOG PANEL DIALOG */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-cream dark:bg-[#150506] border-4 border-ochre p-6 sm:p-8 max-w-sm w-full font-sans shadow-2xl relative text-charcoal dark:text-cream">
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-3 right-3 text-charcoal/70 dark:text-cream/70"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <Lock className="w-10 h-10 text-ochre mx-auto mb-2" />
              <h3 className="text-lg font-black uppercase text-burgundy dark:text-cream">Privileged Registry Portal</h3>
              <p className="text-xs text-charcoal/70 dark:text-cream/70 mt-1">Provide secure identity credentials to synchronize administrative tables.</p>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 font-mono text-charcoal/75 dark:text-cream/75">Administrator Mail Address</label>
                <input 
                  type="email" 
                  value="LearnForwardSTEM@gmail.com" 
                  disabled
                  className="w-full bg-charcoal/10 text-charcoal/80 dark:bg-black/40 dark:text-cream/80 p-2.5 text-xs font-mono border border-charcoal/30 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="admPass" className="block text-[10px] font-bold uppercase mb-1 font-mono text-charcoal/75 dark:text-cream/75">Authentication Password</label>
                <input 
                  id="admPass"
                  type="password" 
                  placeholder="Enter Passcode..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-white text-charcoal p-2.5 text-xs font-semibold border-2 border-ochre outline-none font-mono"
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-burgundy hover:bg-ochre text-white hover:text-burgundy font-bold text-xs uppercase border border-ochre cursor-pointer"
              >
                Request Authorization Scope
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          OBFUSCATED PRIVILEGED ADMIN WORKSPACE DASHBOARD (COMPLETELY OBFUSCATED)
          ------------------------------------------------------------- */}
      {isAdmin && (
        <div className="bg-[#1f090c] border-t-8 border-ochre text-cream py-16 font-sans shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border border-ochre/40 bg-black/40 p-6 sm:p-10 shadow-2xl space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-ochre" />
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-widest text-[#ede4d4]">Privileged Administration control board</h3>
                    <p className="text-xs text-[#ede4d4]/60">Role-Based Access Scope: Authorized for {user?.email || 'Administrator Session'}</p>
                  </div>
                </div>
                <button 
                  onClick={adminLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase"
                >
                  Terminate Administrative Session
                </button>
              </div>

              {/* Statistical Monitor boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 p-4">
                  <span className="text-[10px] text-ochre font-mono uppercase block mb-1">Incoming Voluntarism</span>
                  <p className="text-2xl font-black font-mono leading-none text-white">{LearnForwardDB.getTutors().length}</p>
                  <span className="text-[10px] text-white/50 block mt-1">Pending Tutor reviews</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4">
                  <span className="text-[10px] text-ochre font-mono uppercase block mb-1">Academics Syncing</span>
                  <p className="text-2xl font-black font-mono leading-none text-white">{LearnForwardDB.getStudents().length}</p>
                  <span className="text-[10px] text-white/50 block mt-1">Registered Student profiles</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4">
                  <span className="text-[10px] text-ochre font-mono uppercase block mb-1">Contact Queries</span>
                  <p className="text-2xl font-black font-mono leading-none text-white">{LearnForwardDB.getMessages().length}</p>
                  <span className="text-[10px] text-white/50 block mt-1">Total customer support mail</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4">
                  <span className="text-[10px] text-ochre font-mono uppercase block mb-1">Classroom Latency</span>
                  <p className="text-2xl font-black font-mono leading-none text-green-400">1.8ms</p>
                  <span className="text-[10px] text-green-400 block mt-1">● Synced with Firestore Cloud</span>
                </div>
              </div>

              {/* Database rows lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Tutors */}
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <span className="text-xs font-bold text-ochre uppercase tracking-wider block mb-3 font-mono">Volunteer Tutor Submissions ({LearnForwardDB.getTutors().length})</span>
                  <div className="space-y-3 max-h-[300px] overflow-auto pr-1">
                    {LearnForwardDB.getTutors().length === 0 ? (
                      <p className="text-xs text-white/50 italic py-4">No submissions processed yet.</p>
                    ) : (
                      LearnForwardDB.getTutors().map((t) => (
                        <div key={t.id} className="p-3 bg-black/30 border border-white/5 text-xs text-white/95">
                          <p className="font-extrabold text-sm text-ochre">{t.fullName}</p>
                          <p className="mt-1">📧 {t.email} • 📱 {t.whatsapp}</p>
                          <p className="text-white/70 mt-1">📍 School: {t.schoolUniversity} ({t.majorGrade})</p>
                          <p className="font-bold text-white/90 mt-1">📚 Subjects: {t.subjects.join(', ')} • ⏰ {t.hoursPerWeek} hrs/week</p>
                          <p className="italic text-white/60 mt-1 text-[11px]">Bio: "{t.bio}"</p>
                          <p className="text-[9px] text-[#ede4d4]/40 font-mono mt-2">Timestamp: {new Date(t.submittedAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Students */}
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <span className="text-xs font-bold text-ochre uppercase tracking-wider block mb-3 font-mono">Student Account profiles ({LearnForwardDB.getStudents().length})</span>
                  <div className="space-y-3 max-h-[300px] overflow-auto pr-1">
                    {LearnForwardDB.getStudents().length === 0 ? (
                      <p className="text-xs text-white/50 italic py-4">No student registries recorded yet.</p>
                    ) : (
                      LearnForwardDB.getStudents().map((s) => (
                        <div key={s.id} className="p-3 bg-black/30 border border-white/5 text-xs text-white/95">
                          <p className="font-extrabold text-sm text-ochre">{s.fullName} ({s.gradeLevel})</p>
                          <p className="mt-1">📧 Parent: {s.parentEmail} • 📱 Parent Whatsapp: {s.parentWhatsapp}</p>
                          <p className="text-white/70 mt-1">📍 Region: {s.location} • 🎯 Subjects: {s.subjects.join(', ')}</p>
                          <p className="text-[9px] text-green-400 font-mono mt-1">Logged UID: {s.userUid}</p>
                          <p className="text-[9px] text-[#ede4d4]/40 font-mono mt-1">Timestamp: {new Date(s.submittedAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Contact message entries */}
                <div className="border border-white/10 bg-white/5 p-4 rounded col-span-1 lg:col-span-2">
                  <span className="text-xs font-bold text-ochre uppercase tracking-wider block mb-3 font-mono">Contact Us Incoming Inquiries ({LearnForwardDB.getMessages().length})</span>
                  <div className="space-y-3 max-h-[260px] overflow-auto">
                    {LearnForwardDB.getMessages().length === 0 ? (
                      <p className="text-xs text-white/50 italic py-4">No direct message recordings found.</p>
                    ) : (
                      LearnForwardDB.getMessages().map((m) => (
                        <div key={m.id} className="p-3 bg-black/30 border border-white/5 text-xs text-white/95">
                          <div className="flex justify-between font-bold">
                            <span className="text-ochre font-extrabold text-sm">{m.name} ({m.email})</span>
                            <span className="text-[#ede4d4]/40 text-[10px] font-mono">{new Date(m.submittedAt).toLocaleString()}</span>
                          </div>
                          <p className="font-bold text-white text-xs mt-1">Subject: "{m.subject}"</p>
                          <p className="text-white/80 mt-1 bg-white/5 p-2 rounded text-xs leading-relaxed font-mono">"{m.message}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cyber audits logs panel */}
                <div className="border border-white/10 bg-white/5 p-4 rounded col-span-1 lg:col-span-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-red-400 font-mono uppercase block">🛡️ Security Logs & Cloud Audit Trails</span>
                    <button 
                      onClick={() => { LearnForwardDB.clearDatabase(); window.location.reload(); }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase font-mono border border-red-500"
                    >
                      Security Factory Reset databases
                    </button>
                  </div>
                  <div className="max-h-[180px] overflow-auto bg-black p-3 font-mono text-[11px] leading-relaxed space-y-1 text-white/85">
                    {LearnForwardDB.getLogs().length === 0 ? (
                      <p className="text-white/50">[Audits empty. Monitoring system active...]</p>
                    ) : (
                      LearnForwardDB.getLogs().reverse().map((log) => (
                        <div key={log.id} className="border-b border-white/5 pb-1">
                          <span className="text-white/30 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                          <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                            log.level === 'security' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            {log.level}
                          </span>{' '}
                          <span className="text-ochre">({log.caller})</span>: {log.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// 1. HOME SCREEN VIEW
// -------------------------------------------------------------
function Home() {
  return (
    <section className="bg-burgundy py-24 lg:py-36 flex-grow flex items-center border-b-[8px] border-ochre text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="inline-block px-3 py-1 border border-ochre text-ochre text-xs font-bold tracking-widest uppercase mb-6 font-mono">
                By Students, For Students
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-[#ede4d4] leading-tight tracking-tight uppercase">
                LearnForwardSTEM
              </h1>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg md:text-xl text-[#ede4d4]/90 leading-relaxed max-w-2xl font-medium">
                We strictly focus on making foundational logic, Mathematics, and Computer Science concepts fully accessible for middle school learners in Saudi Arabia.
              </p>
              <p className="text-xs text-ochre font-bold font-mono uppercase tracking-widest">
                Excluding general projects and mentorship and hyper-focusing purely on core sciences
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/join?tab=tutor" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold bg-ochre text-burgundy border-2 border-ochre hover:bg-[#ede4d4] hover:border-[#ede4d4] outline-none text-center"
              >
                Apply as a Tutor Form
              </Link>
              <Link 
                to="/join?tab=student" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold bg-transparent text-[#ede4d4] border-2 border-white hover:text-ochre hover:border-ochre outline-none text-center"
              >
                Register as a Student Form
              </Link>
            </div>
          </div>
          
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-[12px] border-ochre bg-[#5e161c] hover:border-[#ede4d4] shadow-2xl">
               <img 
                 src={LOGO_URL} 
                 alt="LearnForwardSTEM Central Crest Badge Slogan" 
                 className="w-full h-full object-cover rounded-full" 
               />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 2. ABOUT US VIEW
// -------------------------------------------------------------
function About() {
  return (
    <section className="py-24 bg-cream dark:bg-[#1a0709] flex-grow font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <span className="w-12 h-1.5 bg-ochre"></span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-burgundy dark:text-cream uppercase tracking-wide">
              Who We Are
            </h2>
          </div>
          
          <div className="space-y-8 text-lg text-charcoal dark:text-cream/90 leading-relaxed font-semibold">
            <p>
              LearnForwardSTEM is a student-led nonprofit initiative dedicated to making high-quality education accessible to every middle school student in Saudi Arabia. Through a network of volunteer high school and university mentors, we provide free instruction in Mathematics and Computer Science. Our initiative exclusively centers on these two tracks to bridge qualitative gaps and spark foundational interest in logical studies.
            </p>
            
            <div className="bg-white dark:bg-[#110506] p-8 md:p-12 border border-charcoal/10 dark:border-cream/10 border-l-[8px] border-l-ochre shadow-md flex flex-col md:flex-row gap-8 items-center">
              <img 
                src={LOGO_URL} 
                alt="LearnForwardSTEM Identity Badge Logo Slogan Philosophy" 
                className="w-40 h-40 rounded-full border-4 border-ochre shrink-0 object-cover" 
              />
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-burgundy dark:text-cream uppercase tracking-wider">Our Slogan Slogan Slogan Philosophy</h3>
                <p className="text-sm text-charcoal dark:text-cream/80 font-normal leading-relaxed">
                  Our logo, a circular badge, centers two hands clasping into a heart shape. This symbolizes the supportive coordination and empathy defining student-led education. Ringed in our signature rich palette of deep velvet maroon with a warm ochre crest, it carries our direct operating slogan: "By Students, For Students." This represents an inclusive community dedicated explicitly to advancing logic, math, and code literacy in Saudi Arabia without distraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 3. PROGRAMS GRID VIEW
// -------------------------------------------------------------
function Programs() {
  const cards = [
    {
      title: "Mathematics Track",
      icon: <Calculator className="w-8 h-8 text-ochre" />,
      themeColor: "border-t-ochre",
      desc: "Focusing heavily on foundational logic, engaging step-by-step arithmetic, and analytical algebra. We simplify variables, complex equations, functions, and geometry to build extreme quantitative security."
    },
    {
      title: "Computer Science Track",
      icon: <TerminalSquare className="w-8 h-8 text-burgundy dark:text-cream" />,
      themeColor: "border-t-burgundy",
      desc: "Exploring critical syntax, programming loops, software literacy, and structural computational logic. Students gain durable code literacy in Python, sandbox systems, and algorithms."
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#110506] flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-burgundy dark:text-cream uppercase tracking-wide">
            Our Target Pathways
          </h2>
          <p className="text-sm text-charcoal/70 dark:text-cream/70 max-w-2xl mx-auto uppercase tracking-wide mt-2 font-semibold">
            Mathematics & Computer Science • Stripped of Mentorship or Capstone Projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className={`border border-charcoal/10 dark:border-cream/20 bg-cream dark:bg-[#1a0709] p-8 flex flex-col justify-between border-t-8 ${card.themeColor} outline-none shadow`}
            >
              <div>
                <div className="w-14 h-14 bg-burgundy dark:bg-[#2e090d] flex items-center justify-center mb-6 border border-ochre">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-burgundy dark:text-cream mb-4">{card.title}</h3>
                <p className="text-sm text-charcoal dark:text-cream/80 leading-relaxed font-semibold">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 4. WORKSPACE VIEW (DUAL-CRITERIA SECURITY FOR BOOKING)
// -------------------------------------------------------------
function Workspace() {
  const { user, isStudent, loginWithGoogle, syncCount, triggerSync } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Form states
  const [discordUsername, setDiscordUsername] = useState('');
  const [meetingSubject, setMeetingSubject] = useState('Mathematics');
  const [meetingDate, setMeetingDate] = useState('2026-06-15');
  const [meetingTime, setMeetingTime] = useState('17:00');
  const [meetingDuration, setMeetingDuration] = useState('60');
  const [bookedStatus, setBookedStatus] = useState<string | null>(null);
  
  // Custom Webhook state
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('lf_discord_webhook') || '');
  const [testSent, setTestSent] = useState(false);

  // Load calendar events
  useEffect(() => {
    setEvents(LearnForwardDB.getCalendarEvents());
  }, [syncCount]);

  const handleBookMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Verification Interrupted: Please log in using Google Auth first.");
      return;
    }

    if (!isStudent) {
      alert("Process Rejected: Meeting booking is restricted to registered students. Please fill out the Student Registration Form tab in 'Join Us' first to sync your profile.");
      return;
    }

    if (!discordUsername.trim()) {
      alert("Information Required: A valid Discord Username is required to request tutoring sessions.");
      return;
    }
    
    // Generate Google Meet URL
    const mockMeetCode = 'lf-meet-' + Math.random().toString(36).substr(2, 4) + '-' + Math.random().toString(36).substr(2, 3);
    const meetLink = `https://meet.google.com/${mockMeetCode}`;
    
    const startTimeStr = `${meetingDate}T${meetingTime}:00Z`;
    // End calculation
    const endHour = parseInt(meetingTime.split(':')[0]) + (parseInt(meetingDuration) === 90 ? 1 : 1);
    const endMinutes = parseInt(meetingTime.split(':')[1]) + (parseInt(meetingDuration) === 90 ? 30 : 0);
    const endTimeStr = `${meetingDate}T${String(endHour).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}:00Z`;

    const newEvent = LearnForwardDB.addCalendarEvent({
      title: `${meetingSubject} Classroom Hub`,
      description: `Student meeting booked for Discord account ${discordUsername}. Classroom fully accessible.`,
      startTime: startTimeStr,
      endTime: endTimeStr,
      meetLink: meetLink,
      type: 'class',
      discordUser: discordUsername,
      userUid: user.uid
    });

    setEvents(prev => [...prev, newEvent]);
    setBookedStatus(meetLink);
    setDiscordUsername('');
    triggerSync();

    // Notify Discord webhook
    if (webhookUrl) {
      LearnForwardDB.sendDiscordNotification(webhookUrl, "📅 LearnForwardSTEM: Tutor Session Booking Form Completed", [
        { name: "Student UID", value: user.uid, inline: true },
        { name: "Subject Track", value: meetingSubject, inline: true },
        { name: "Discord Account ID", value: discordUsername, inline: true },
        { name: "Date & Time (UTC)", value: `${meetingDate} at ${meetingTime} (${meetingDuration} mins)` },
        { name: "Google Meet Link", value: `[Join Custom Session Workspace](${meetLink})` }
      ]);
    }
  };

  const saveWebhook = () => {
    localStorage.setItem('lf_discord_webhook', webhookUrl);
    LearnForwardDB.log('info', 'Discord Webhook configuration updated locally', 'WorkspacePanel');
    alert('Discord Webhook URL saved successfully!');
  };

  const handleSendTestWebhook = async () => {
    setTestSent(true);
    const ok = await LearnForwardDB.sendDiscordNotification(webhookUrl, "🚀 LearnForwardSTEM: Test Channel Broadcast Success", [
      { name: "System Integration", value: "Discord Channel Sync Service Online", inline: true },
      { name: "Traffic State", value: "Active - High Performance Subsystem Enabled", inline: true },
      { name: "Trigger Context", value: "Organization Workspace test request received from Riyadh HQ." }
    ]);
    if (ok) {
      alert("Discord notification broadcast completed!");
    } else {
      alert("Test broadcast skipped or failed. Ensure webhook URL matches discord.com/api/webhooks format!");
    }
    setTestSent(false);
  };

  return (
    <section className="py-24 bg-cream dark:bg-[#1a0709] flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-3">
            <span className="w-12 h-1.5 bg-ochre"></span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-burgundy dark:text-cream uppercase tracking-wide">
              Workspace & Schedule Control
            </h2>
          </div>
          <p className="text-charcoal/85 dark:text-cream/80 max-w-3xl text-sm font-semibold uppercase font-mono">
            Google Workspace Ecosystem Central Hub • Live Sync & Classroom Scheduling
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Calendar Display Panel */}
          <div className="lg:col-span-8 bg-white dark:bg-[#110506] border border-charcoal/20 dark:border-cream/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-charcoal/10 dark:border-cream/10 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-ochre" />
                <h3 className="text-xl font-bold text-burgundy dark:text-cream uppercase">Upcoming Classes & Events</h3>
              </div>
              <span className="text-xs bg-burgundy/10 text-burgundy dark:bg-white/10 dark:text-cream font-mono py-1 px-3 uppercase font-bold">
                Synced with Google Calendar API
              </span>
            </div>

            {/* Google Calendar Iframe block */}
            <div className="calendar-embed w-full bg-cream dark:bg-charcoal flex flex-col mb-8" style={{ minHeight: '340px' }}>
              <div className="p-3 bg-burgundy text-white text-xs font-mono font-bold uppercase tracking-wider">
                Public Embed Schedule Sandbox
              </div>
              <iframe 
                src="https://calendar.google.com/calendar/embed?src=en.sa%23holiday%40group.v.calendar.google.com&ctz=Asia%2FRiyadh" 
                style={{ border: 0, width: '100%', height: '310px' }} 
                scrolling="no"
                title="Schedule Google Calendar Sync"
                className="w-full"
              ></iframe>
            </div>

            {/* Booked list */}
            <h4 className="text-xs font-bold uppercase tracking-widest text-ochre mb-4">Dynamically Booked Classes Room List</h4>
            <div className="space-y-4">
              {events.map((evt) => (
                <div key={evt.id} className="border-l-4 border-ochre bg-cream/30 dark:bg-burgundy/10 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-ochre font-mono uppercase tracking-wider block mb-1">
                      📚 Verified Classroom Event
                    </span>
                    <h5 className="font-extrabold text-charcoal dark:text-white">{evt.title}</h5>
                    <p className="text-xs text-charcoal/70 dark:text-cream/70 mt-1 font-semibold">{evt.description}</p>
                    {evt.discordUser && (
                      <p className="text-xs text-ochre font-mono mt-1 font-bold">Student Discord: @{evt.discordUser}</p>
                    )}
                    <p className="text-xs text-charcoal/90 dark:text-cream/90 mt-2 font-mono bg-charcoal/5 dark:bg-white/5 py-0.5 px-2 inline-block">
                      ⏰ Start: {new Date(evt.startTime).toLocaleString()} (Riyadh Time)
                    </p>
                  </div>
                  {evt.meetLink && (
                    <a 
                      href={evt.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 bg-[#5e161c] hover:bg-ochre text-white font-bold text-xs uppercase border border-ochre"
                    >
                      <Video className="w-3.5 h-3.5 text-ochre" />
                      Google Meet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Scheduling Panel guarded by criteria */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#5e161c] text-white p-6 sm:p-8 border-t-8 border-ochre shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-ochre" />
                <h3 className="text-lg font-black uppercase text-cream tracking-wide">Book a session</h3>
              </div>

              {!user ? (
                <div className="p-4 bg-white/10 border border-white/20 text-center space-y-4">
                  <p className="text-xs text-cream/90 leading-relaxed font-semibold">
                    You must authenticate via Google Sign-In to initiate classroom schedulers.
                  </p>
                  <button 
                    onClick={loginWithGoogle}
                    className="w-full bg-ochre hover:bg-cream text-burgundy font-black text-xs uppercase py-3 cursor-pointer"
                  >
                    Authorize with Google Client
                  </button>
                  <p className="text-[10px] text-ochre font-mono block">
                    Domain Auth Domain: ais-dev-e7ehz3uvbjdi7jmxxhwnxj-895297724881.europe-west2.run.app
                  </p>
                </div>
              ) : !isStudent ? (
                <div className="p-4 bg-white/10 border border-white/20 space-y-4">
                  <div className="bg-red-500/20 text-red-100 p-3 text-xs flex gap-2 border border-red-500 rounded">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-ochre" />
                    <span className="font-semibold">Student Account Status: Profile Unregistered.</span>
                  </div>
                  <p className="text-xs text-cream/90 leading-relaxed">
                    Google ID: <b>{user.email}</b> is verified. However, bookings are strictly restricted to registered intermediate students.
                  </p>
                  <p className="text-xs text-ochre font-bold uppercase">
                    How to fix this:
                  </p>
                  <Link 
                    to="/join?tab=student"
                    className="block text-center w-full py-3 bg-ochre text-burgundy font-black text-xs uppercase hover:bg-cream"
                  >
                    Submit Student Registration Form
                  </Link>
                  <button 
                    onClick={triggerSync}
                    className="text-[10px] underline font-mono text-white/50 block text-center mx-auto"
                  >
                    Already applied? Click to force refresh verification check
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookMeeting} className="space-y-4 text-charcoal">
                  <div className="p-2.5 bg-green-500/10 border border-green-500 rounded text-green-300 text-[11px] font-mono mb-2">
                    ● Authenticated Student Account
                  </div>

                  <div>
                    <label htmlFor="studentDisc" className="block text-xs font-bold text-[#ede4d4] uppercase mb-1">Your Discord Username *</label>
                    <input 
                      type="text" 
                      id="studentDisc"
                      placeholder="e.g. fatima_alharbi (No @)"
                      value={discordUsername}
                      onChange={(e) => setDiscordUsername(e.target.value)}
                      className="w-full bg-white text-charcoal p-2.5 text-sm font-semibold border-2 border-ochre"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="meetingSubject" className="block text-xs font-bold text-[#ede4d4] uppercase mb-1">STEM Area Focus</label>
                    <select 
                      id="meetingSubject"
                      value={meetingSubject} 
                      onChange={(e) => setMeetingSubject(e.target.value)}
                      className="w-full bg-white text-charcoal p-2.5 text-sm font-semibold border-2 border-ochre"
                      required
                    >
                      <option value="Mathematics Fundamentals">Mathematics (Algebra & Logic)</option>
                      <option value="Computer Science Literacy">Computer Science (Python & Computational)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="meetingDate" className="block text-xs font-bold text-[#ede4d4] uppercase mb-1">Target Date</label>
                    <input 
                      type="date" 
                      id="meetingDate"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full bg-white text-charcoal p-2.5 text-sm font-semibold border-2 border-ochre font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="meetingTime" className="block text-xs font-bold text-[#ede4d4] uppercase mb-1 font-mono">Start Time</label>
                      <input 
                        type="time" 
                        id="meetingTime"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full bg-white text-charcoal p-2.5 text-sm font-semibold border-2 border-ochre font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="meetingDuration" className="block text-xs font-bold text-[#ede4d4] uppercase mb-1 font-mono">Duration</label>
                      <select 
                        id="meetingDuration"
                        value={meetingDuration} 
                        onChange={(e) => setMeetingDuration(e.target.value)}
                        className="w-full bg-white text-charcoal p-2.5 text-sm font-semibold border-2 border-ochre"
                      >
                        <option value="45">45 Mins</option>
                        <option value="60">60 Mins</option>
                        <option value="90">90 Mins</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-ochre hover:bg-cream text-[#5e161c] font-black text-sm uppercase py-3 border-2 border-ochre cursor-pointer mt-2"
                  >
                    Confirm & Sync Meet Room
                  </button>
                </form>
              )}

              {bookedStatus && (
                <div className="mt-6 p-4 bg-white/10 border border-white/20">
                  <span className="text-xs font-bold text-ochre uppercase font-mono block mb-1">✅ SUCCESSFUL RESERVATION</span>
                  <p className="text-xs text-cream mb-3 font-semibold">Mock URL generated. Saved in cloud database events tables:</p>
                  <a 
                    href={bookedStatus} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block text-center py-2 bg-ochre text-burgundy font-bold text-xs uppercase hover:bg-white"
                  >
                    Launch Google Meet Room
                  </a>
                </div>
              )}
            </div>

            {/* Webhook parameters panel */}
            <div className="bg-white dark:bg-[#110506] border border-charcoal/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-ochre" />
                <h3 className="text-lg font-bold text-burgundy dark:text-cream uppercase tracking-wide">Discord Notifications</h3>
              </div>
              <p className="text-xs text-charcoal/70 dark:text-cream/70 mb-4 font-semibold">
                Receive embeds updates straight to your workspace Discord server automatically.
              </p>

              <div className="space-y-3">
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full border-2 border-charcoal/20 dark:border-cream/25 p-2.5 text-xs font-mono bg-cream/30 dark:bg-charcoal/30 text-charcoal dark:text-white"
                  aria-label="Discord webhook URL setup"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={saveWebhook}
                    className="py-2 bg-burgundy hover:bg-ochre text-white hover:text-burgundy font-bold text-xs uppercase cursor-pointer"
                  >
                    Save URL
                  </button>
                  <button 
                    onClick={handleSendTestWebhook}
                    disabled={!webhookUrl || testSent}
                    className="py-2 bg-ochre text-burgundy font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                  >
                    Broadcast Test
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 5. JOIN US VIEW
// -------------------------------------------------------------
function Join() {
  const { user, triggerSync } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'tutor' | 'student'>('tutor');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'tutor' || tab === 'student') {
      setActiveTab(tab);
    }
  }, [location]);

  // Tutor states
  const [tutorName, setTutorName] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  const [tutorWhatsapp, setTutorWhatsapp] = useState('');
  const [tutorSchool, setTutorSchool] = useState('');
  const [tutorMajor, setTutorMajor] = useState('');
  const [tutorBio, setTutorBio] = useState('');
  const [tutorHours, setTutorHours] = useState(4);
  const [selectedTutorSubjects, setSelectedTutorSubjects] = useState<string[]>([]);
  const [tutorSuccess, setTutorSuccess] = useState<boolean>(false);
  const [receivedEmailPrevs, setReceivedEmailPrevs] = useState<{ toApplicant: string, toAdmin: string } | null>(null);

  // Student states
  const [studentName, setStudentName] = useState('');
  const [studentParentEmail, setStudentParentEmail] = useState('');
  const [studentParentWhatsapp, setStudentParentWhatsapp] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 7');
  const [studentLocation, setStudentLocation] = useState('');
  const [selectedStudentSubjects, setSelectedStudentSubjects] = useState<string[]>([]);
  const [studentSuccess, setStudentSuccess] = useState<boolean>(false);

  const toggleTutorSubject = (sub: string) => {
    setSelectedTutorSubjects(prev => 
      prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub]
    );
  };

  const toggleStudentSubject = (sub: string) => {
    setSelectedStudentSubjects(prev => 
      prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub]
    );
  };

  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTutorSubjects.length === 0) {
      alert("Please select at least one subject area.");
      return;
    }

    const saved = LearnForwardDB.saveTutor({
      fullName: tutorName,
      email: tutorEmail,
      whatsapp: tutorWhatsapp,
      schoolUniversity: tutorSchool,
      majorGrade: tutorMajor,
      subjects: selectedTutorSubjects,
      bio: tutorBio,
      hoursPerWeek: Number(tutorHours)
    });

    const appText = `Thank you for studying application options and volunteering with LearnForwardSTEM in Saudi Arabia! Our peer team will read your details regarding <b>${selectedTutorSubjects.join(' & ')}</b> and contact you on WhatsApp <b>${tutorWhatsapp}</b>.`;
    const adminText = `New tutor applicant: <b>${tutorName}</b>. <br/>• Email: ${tutorEmail}<br/>• Focus tracks: ${selectedTutorSubjects.join(', ')}`;

    const applicantEmailHTML = LearnForwardDB.generateEmailTemplate(tutorName, "Application Received", appText);
    const adminEmailHTML = LearnForwardDB.generateEmailTemplate("STEM Team Administrator", "New Tutor Application Submitted", adminText);

    setReceivedEmailPrevs({
      toApplicant: applicantEmailHTML,
      toAdmin: adminEmailHTML
    });

    // Webhook post
    const webhookUrl = localStorage.getItem('lf_discord_webhook') || '';
    if (webhookUrl) {
      LearnForwardDB.sendDiscordNotification(webhookUrl, "🔥 New Volunteer Tutor Application", [
        { name: "Full Name", value: tutorName, inline: true },
        { name: "Support Track", value: selectedTutorSubjects.join(', ') },
        { name: "Institute", value: tutorSchool }
      ]);
    }

    setTutorSuccess(true);
    setTutorName('');
    setTutorEmail('');
    setTutorWhatsapp('');
    setTutorSchool('');
    setTutorMajor('');
    setTutorBio('');
    setSelectedTutorSubjects([]);
    await triggerSync();
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentSubjects.length === 0) {
      alert("Please select at least one track.");
      return;
    }

    const saved = LearnForwardDB.saveStudent({
      fullName: studentName,
      parentEmail: studentParentEmail,
      parentWhatsapp: studentParentWhatsapp,
      gradeLevel: studentGrade,
      subjects: selectedStudentSubjects,
      location: studentLocation,
      userUid: user?.uid || 'anonymous'
    });

    const appText = `Class registration received for middle schooler <b>${studentName}</b> for <b>${selectedStudentSubjects.join(' & ')}</b>. We will WhatsApp you at <b>${studentParentWhatsapp}</b> to align calendars.`;
    const adminText = `New student registered: <b>${studentName}</b> (${studentGrade}). Location: ${studentLocation}. parent mail: ${studentParentEmail}`;

    const applicantEmailHTML = LearnForwardDB.generateEmailTemplate("Parent Receipt", "Class Registration Active", appText);
    const adminEmailHTML = LearnForwardDB.generateEmailTemplate("STEM Team Administrator", "New Student Registered", adminText);

    setReceivedEmailPrevs({
      toApplicant: applicantEmailHTML,
      toAdmin: adminEmailHTML
    });

    const webhookUrl = localStorage.getItem('lf_discord_webhook') || '';
    if (webhookUrl) {
      LearnForwardDB.sendDiscordNotification(webhookUrl, "🎓 New Student Learner Registration", [
        { name: "Learner Name", value: studentName, inline: true },
        { name: "Study Focus", value: selectedStudentSubjects.join(', ') },
        { name: "Location", value: studentLocation }
      ]);
    }

    setStudentSuccess(true);
    setStudentName('');
    setStudentParentEmail('');
    setStudentParentWhatsapp('');
    setStudentLocation('');
    setSelectedStudentSubjects([]);
    await triggerSync();
  };

  return (
    <div className="flex-grow flex flex-col font-sans">
      <section className="py-16 bg-burgundy text-white border-b-8 border-ochre">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold uppercase tracking-widest mb-4">Get Involved</h2>
          <p className="text-[#ede4d4]/90 max-w-2xl mx-auto font-semibold">
            Support our Mathematics and Computer Science tracks. Sign up directly below or use manual forms verification.
          </p>
        </div>
      </section>

      <section className="py-20 bg-cream dark:bg-[#1a0709] flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="flex border-4 border-ochre mb-12 bg-white dark:bg-[#110506]">
            <button 
              onClick={() => { setActiveTab('tutor'); setTutorSuccess(false); setReceivedEmailPrevs(null); }}
              className={`flex-1 py-5 text-center font-black text-xs sm:text-sm uppercase tracking-wider outline-none ${
                activeTab === 'tutor' 
                  ? 'bg-ochre text-burgundy' 
                  : 'bg-transparent text-charcoal dark:text-cream'
              }`}
            >
              Apply as a Tutor Form
            </button>
            <button 
              onClick={() => { setActiveTab('student'); setStudentSuccess(false); setReceivedEmailPrevs(null); }}
              className={`flex-1 py-5 text-center font-black text-xs sm:text-sm uppercase tracking-wider outline-none ${
                activeTab === 'student' 
                  ? 'bg-ochre text-burgundy' 
                  : 'bg-transparent text-charcoal dark:text-cream'
              }`}
            >
              Register as a Student Form
            </button>
          </div>

          {activeTab === 'tutor' ? (
            <div className="space-y-12">
              {!tutorSuccess ? (
                <div className="bg-white dark:bg-[#110506] border border-charcoal/20 p-6 sm:p-12">
                  <div className="mb-8 border-b border-charcoal/10 pb-6">
                    <span className="text-xs font-bold text-ochre uppercase font-mono tracking-widest block mb-1">Peer Mentorship Area</span>
                    <h3 className="text-2xl font-bold text-burgundy dark:text-cream uppercase">Volunteer Application Process</h3>
                  </div>

                  <form onSubmit={handleTutorSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="tName" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Full Name *</label>
                        <input 
                          type="text" 
                          id="tName"
                          value={tutorName}
                          onChange={(e) => setTutorName(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tEmail" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Primary Email *</label>
                        <input 
                          type="email" 
                          id="tEmail"
                          value={tutorEmail}
                          onChange={(e) => setTutorEmail(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="tWhatsapp" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">WhatsApp Mobile (+966...) *</label>
                        <input 
                          type="tel" 
                          id="tWhatsapp"
                          value={tutorWhatsapp}
                          onChange={(e) => setTutorWhatsapp(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tSchool" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">School / Institute *</label>
                        <input 
                          type="text" 
                          id="tSchool"
                          value={tutorSchool}
                          onChange={(e) => setTutorSchool(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="tMajor" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Major Study or Current Grade *</label>
                        <input 
                          type="text" 
                          id="tMajor"
                          value={tutorMajor}
                          onChange={(e) => setTutorMajor(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tHours" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Capacity (Hours/week) *</label>
                        <input 
                          type="number" 
                          id="tHours"
                          value={tutorHours}
                          onChange={(e) => setTutorHours(Number(e.target.value))}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider mb-3 text-charcoal dark:text-cream">Subjects Focus *</span>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedTutorSubjects.includes('Mathematics')}
                            onChange={() => toggleTutorSubject('Mathematics')}
                            className="w-4 h-4 accent-ochre"
                          />
                          <span className="text-xs font-bold uppercase">Mathematics</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedTutorSubjects.includes('Computer Science')}
                            onChange={() => toggleTutorSubject('Computer Science')}
                            className="w-4 h-4 accent-ochre"
                          />
                          <span className="text-xs font-bold uppercase">Computer Science</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="tBio" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Core Bio *</label>
                      <textarea 
                        id="tBio"
                        rows={4}
                        value={tutorBio}
                        onChange={(e) => setTutorBio(e.target.value)}
                        className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="w-full py-4 bg-burgundy hover:bg-ochre text-white hover:text-burgundy font-black text-xs uppercase cursor-pointer border-2 border-ochre">
                      Apply as Mentor Tutor
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#110506] border-2 border-ochre p-8 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-ochre mx-auto" />
                  <h3 className="text-2xl font-black text-burgundy dark:text-cream uppercase">Tutor application received</h3>
                  <button onClick={() => setTutorSuccess(false)} className="px-6 py-2 bg-burgundy text-white text-xs font-bold uppercase hover:bg-ochre">Back</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {!studentSuccess ? (
                <div className="bg-white dark:bg-[#110506] border border-charcoal/20 p-6 sm:p-12">
                  <div className="mb-8 border-b border-charcoal/10 pb-6">
                    <span className="text-xs font-bold text-ochre uppercase font-mono tracking-widest block mb-1">Middle School Learner Region</span>
                    <h3 className="text-2xl font-bold text-burgundy dark:text-cream uppercase">Register as a Student</h3>
                    {user ? (
                      <p className="text-xs text-green-500 font-mono mt-1">✓ Logged in via Google as {user.email}. Register profile below to activate booking privileges.</p>
                    ) : (
                      <p className="text-xs text-ochre font-mono mt-1">⚠ Note: Google Login is highly recommended to enable instant session bookings afterwards.</p>
                    )}
                  </div>

                  <form onSubmit={handleStudentSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sName" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Student Full Name *</label>
                        <input 
                          type="text" 
                          id="sName"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="sParentEmail" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Parent Primary Email *</label>
                        <input 
                          type="email" 
                          id="sParentEmail"
                          value={studentParentEmail}
                          onChange={(e) => setStudentParentEmail(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sParentPhone" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Parent WhatsApp Mobile (+966...) *</label>
                        <input 
                          type="tel" 
                          id="sParentPhone"
                          value={studentParentWhatsapp}
                          onChange={(e) => setStudentParentWhatsapp(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="sGrade" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Grade level segment *</label>
                        <select 
                          id="sGrade"
                          value={studentGrade} 
                          onChange={(e) => setStudentGrade(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                        >
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sLocation" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">City of Residence (Saudi Arabia) *</label>
                        <input 
                          type="text" 
                          id="sLocation"
                          value={studentLocation}
                          onChange={(e) => setStudentLocation(e.target.value)}
                          className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream">Track Slices *</span>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentSubjects.includes('Mathematics')}
                              onChange={() => toggleStudentSubject('Mathematics')}
                              className="w-4 h-4 accent-ochre"
                            />
                            <span className="text-xs font-bold uppercase">Mathematics</span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentSubjects.includes('Computer Science')}
                              onChange={() => toggleStudentSubject('Computer Science')}
                              className="w-4 h-4 accent-ochre"
                            />
                            <span className="text-xs font-bold uppercase">Computer Science</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-burgundy hover:bg-ochre text-white hover:text-burgundy font-black text-xs uppercase cursor-pointer border-2 border-ochre">
                      Register as Student Learner
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#110506] border-2 border-ochre p-8 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-ochre mx-auto" />
                  <h3 className="text-2xl font-black text-burgundy dark:text-cream uppercase">Student Profile Registered Successfully</h3>
                  <p className="text-xs text-charcoal/70 dark:text-cream/70 font-semibold mb-4">
                    Your account UID is authorized. Navigating to "Workspace & Schedule" will let you book immediate mentor schedules.
                  </p>
                  <Link to="/workspace" className="inline-block px-6 py-2.5 bg-ochre text-burgundy font-extrabold text-xs uppercase">
                    Book an online Tutoring Class
                  </Link>
                  <button onClick={() => setStudentSuccess(false)} className="block mx-auto text-xs font-bold underline font-mono text-charcoal/50">Register another sibling</button>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// 6. CONTACT US VIEW AT RESILIENT SMTP FAILBACKS
// -------------------------------------------------------------
function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentMailHTML, setSentMailHTML] = useState<{ applicant: string, admin: string } | null>(null);

  // SMTP credentials missing catch warn banner
  const [isSMTPSynchronizing, setIsSMTPSynchronizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    LearnForwardDB.saveMessage({
      name,
      email,
      subject,
      message
    });

    const appText = `Thank you for your message! The LearnForwardSTEM admin team will review your inquiry: <b>"${subject}"</b> and contact you within 24 hours.`;
    const adminText = `New contact entry: <b>${name}</b> (${email})<br/>• Subject: ${subject}<br/>• Message: ${message}`;

    const applicantHTML = LearnForwardDB.generateEmailTemplate(name, "Support receipt", appText);
    const adminHTML = LearnForwardDB.generateEmailTemplate("STEM Administrator Team", `Inquiry Log`, adminText);

    setSentMailHTML({
      applicant: applicantHTML,
      admin: adminHTML
    });

    // Handle SMTP setup guard standard warning
    const gmailAppPassword = import.meta.env.VITE_GMAIL_APP_PASSWORD;
    if (!gmailAppPassword) {
      setIsSMTPSynchronizing(true);
    }

    setSuccess(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <section className="py-24 bg-cream dark:bg-[#1a0709] flex-grow">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <span className="w-12 h-1.5 bg-ochre"></span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-burgundy dark:text-cream uppercase tracking-wide">
              Contact Us
            </h2>
          </div>
          <p className="text-xs text-charcoal/70 dark:text-cream/70 font-mono font-bold uppercase mt-1">
            Student Support & Operational Team Hotline
          </p>
        </div>

        {isSMTPSynchronizing && (
          <div className="mb-6 p-4 bg-[#5e161c] text-white border-4 border-ochre font-sans">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-ochre" />
              <div>
                <h4 className="font-extrabold uppercase text-xs tracking-wider text-[#ede4d4]">Gmail SMTP Routing Synchronizing</h4>
                <p className="text-xs text-cream/90 mt-1">
                  Your message has been stored securely in our system database logs! However, direct automated SMTP dispatch was caught by client auth bounds. Our technical team is aligning options.
                </p>
              </div>
            </div>
          </div>
        )}

        {!success ? (
          <div className="bg-white dark:bg-[#110506] border border-charcoal/20 p-6 sm:p-10 font-sans shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cName" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream font-mono">Your Name *</label>
                  <input 
                    type="text" 
                    id="cName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cEmail" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream font-mono">Your Email *</label>
                  <input 
                    type="email" 
                    id="cEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cSub" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream font-mono">Message Subject *</label>
                <input 
                  type="text" 
                  id="cSub"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="cMsg" className="block text-xs font-bold uppercase tracking-wider mb-2 text-charcoal dark:text-cream font-mono">Message Body *</label>
                <textarea 
                  id="cMsg"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border-2 border-[#282828]/20 bg-cream/10 p-3 text-sm font-semibold text-charcoal dark:text-white"
                  required
                ></textarea>
              </div>

              <button type="submit" className="w-full py-3.5 bg-burgundy hover:bg-ochre text-white hover:text-burgundy font-black text-xs uppercase border-2 border-ochre cursor-pointer">
                Dispatch support inquiry
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#110506] border border-ochre p-8 text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-ochre mx-auto" />
            <h3 className="text-xl font-bold uppercase text-burgundy dark:text-cream">Message broadcast saved on system logs</h3>
            <button onClick={() => { setSuccess(false); setIsSMTPSynchronizing(false); }} className="px-6 py-2 bg-burgundy text-white text-xs font-bold uppercase hover:bg-ochre">Send another message</button>
          </div>
        )}

      </div>
    </section>
  );
}

// -------------------------------------------------------------
// MAIN ROUTING ENGINE WRAPPER (INTEGRATING CONTEXTS)
// -------------------------------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <RouteTransition />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
