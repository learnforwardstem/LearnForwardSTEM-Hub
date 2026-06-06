import { TutorApplication, StudentRegistration, ContactMessage, CalendarEvent } from './types';
import { isFirebaseConfigured, db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';

// Default Calendar Events Seed ONLY focusing on Math and Computer Science (no mentorship)
const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Middle School Python Fundamentals Class',
    description: 'Learn simple variables, lists, and loops in a student-friendly format with peer mentors.',
    startTime: '2026-06-10T16:00:00Z',
    endTime: '2026-06-10T17:30:00Z',
    meetLink: 'https://meet.google.com/lf-stem-python',
    type: 'class'
  },
  {
    id: 'evt-2',
    title: 'Advanced Mathematics Olympic Prep Session',
    description: 'Analytical logical problem-solving and fun math games to prepare for local tournaments.',
    startTime: '2026-06-12T15:00:00Z',
    endTime: '2026-06-12T16:30:00Z',
    meetLink: 'https://meet.google.com/lf-stem-math',
    type: 'class'
  }
];

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'security';
  message: string;
  caller: string;
}

// Durable Cloud + Local Storage Engine
export class LearnForwardDB {
  static getTutors(): TutorApplication[] {
    const data = localStorage.getItem('lf_tutors');
    return data ? JSON.parse(data) : [];
  }

  static saveTutor(app: Omit<TutorApplication, 'id' | 'submittedAt'>): TutorApplication {
    const tutors = this.getTutors();
    const newTutor: TutorApplication = {
      ...app,
      id: 'tutor-' + Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };
    tutors.push(newTutor);
    localStorage.setItem('lf_tutors', JSON.stringify(tutors));
    this.log('security', `New tutor application stored from ${app.email}`, 'LearnForwardDB.saveTutor');

    // Cloud Persistent Save - fire-and-forget matching spec error standards
    if (isFirebaseConfigured && db) {
      addDoc(collection(db, 'tutors'), newTutor).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `tutors/${newTutor.id}`);
      });
    }

    return newTutor;
  }

  static getStudents(): StudentRegistration[] {
    const data = localStorage.getItem('lf_students');
    return data ? JSON.parse(data) : [];
  }

  static saveStudent(reg: Omit<StudentRegistration, 'id' | 'submittedAt'>): StudentRegistration {
    const students = this.getStudents();
    const currentUser = auth?.currentUser;
    const newStudent: StudentRegistration = {
      ...reg,
      id: 'student-' + Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString(),
      userUid: currentUser?.uid || reg.userUid || 'anonymous'
    };
    students.push(newStudent);
    localStorage.setItem('lf_students', JSON.stringify(students));
    this.log('security', `New student registration stored under parent ${reg.parentEmail}`, 'LearnForwardDB.saveStudent');

    // Cloud Persistent Save - fire-and-forget
    if (isFirebaseConfigured && db) {
      addDoc(collection(db, 'students'), newStudent).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `students/${newStudent.id}`);
      });
    }

    return newStudent;
  }

  static getMessages(): ContactMessage[] {
    const data = localStorage.getItem('lf_messages');
    return data ? JSON.parse(data) : [];
  }

  static saveMessage(msg: Omit<ContactMessage, 'id' | 'submittedAt'>): ContactMessage {
    const messages = this.getMessages();
    const newMessage: ContactMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };
    messages.push(newMessage);
    localStorage.setItem('lf_messages', JSON.stringify(messages));
    this.log('info', `Contact message received from ${msg.email}`, 'LearnForwardDB.saveMessage');

    // Cloud Persistent Save
    if (isFirebaseConfigured && db) {
      addDoc(collection(db, 'messages'), newMessage).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `messages/${newMessage.id}`);
      });
    }

    return newMessage;
  }

  static getCalendarEvents(): CalendarEvent[] {
    const data = localStorage.getItem('lf_events');
    if (!data) {
      localStorage.setItem('lf_events', JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    return JSON.parse(data);
  }

  static addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const events = this.getCalendarEvents();
    const currentUser = auth?.currentUser;
    const newEvent: CalendarEvent = {
      ...event,
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      userUid: currentUser?.uid || event.userUid || 'anonymous'
    };
    events.push(newEvent);
    localStorage.setItem('lf_events', JSON.stringify(events));
    this.log('info', `New calendar event booked: ${event.title}`, 'LearnForwardDB.addCalendarEvent');

    // Cloud Persistent Save
    if (isFirebaseConfigured && db) {
      addDoc(collection(db, 'events'), newEvent).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `events/${newEvent.id}`);
      });
    }

    return newEvent;
  }

  // Security Monitoring Log Engine
  static getLogs(): SystemLog[] {
    const data = localStorage.getItem('lf_logs');
    return data ? JSON.parse(data) : [];
  }

  static log(level: 'info' | 'warn' | 'error' | 'security', message: string, caller: string) {
    const logs = this.getLogs();
    const newLog: SystemLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      caller
    };
    // Keep last 100 logs
    const cropped = [...logs, newLog].slice(-100);
    localStorage.setItem('lf_logs', JSON.stringify(cropped));

    // Also write to cloud Firestore if configured and non-recursive
    if (isFirebaseConfigured && db && caller !== 'LearnForwardDB.syncFromFirestore') {
      addDoc(collection(db, 'logs'), newLog).catch(() => {
        // Silent catch for log recursive errors to prevent infinite loops
      });
    }
  }

  static clearDatabase() {
    localStorage.removeItem('lf_tutors');
    localStorage.removeItem('lf_students');
    localStorage.removeItem('lf_messages');
    localStorage.removeItem('lf_events');
    this.log('warn', 'Database entries cleared by developer reset', 'LearnForwardDB.clearDatabase');
  }

  // Synchronize dynamic Firestore collections into local cache structures
  static async syncFromFirestore(): Promise<boolean> {
    if (!isFirebaseConfigured || !db) {
      this.log('info', 'Firebase not configured yet; proceeding strictly with local simulation layers.', 'LearnForwardDB.syncFromFirestore');
      return false;
    }
    try {
      this.log('info', 'Starting secure Cloud Schema synchronization...', 'LearnForwardDB.syncFromFirestore');
      
      const tutorSnap = await getDocs(collection(db, 'tutors'));
      const tutorsList = tutorSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (tutorsList.length > 0) {
        localStorage.setItem('lf_tutors', JSON.stringify(tutorsList));
      }

      const studSnap = await getDocs(collection(db, 'students'));
      const studList = studSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (studList.length > 0) {
        localStorage.setItem('lf_students', JSON.stringify(studList));
      }

      const msgSnap = await getDocs(collection(db, 'messages'));
      const msgList = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (msgList.length > 0) {
        localStorage.setItem('lf_messages', JSON.stringify(msgList));
      }

      const evtSnap = await getDocs(collection(db, 'events'));
      const evtList = evtSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (evtList.length > 0) {
        localStorage.setItem('lf_events', JSON.stringify(evtList));
      }

      this.log('info', 'Secure Cloud synchronization finished successfully.', 'LearnForwardDB.syncFromFirestore');
      return true;
    } catch (error) {
      this.log('error', `Failed to sync from Firestore: ${error instanceof Error ? error.message : String(error)}`, 'LearnForwardDB.syncFromFirestore');
      return false;
    }
  }

  // Generate Email Previews in Colorway (Maroon & Yellow theme)
  static generateEmailTemplate(toName: string, subject: string, mainText: string, actionButtonText?: string, actionButtonUrl?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; background-color: #ede4d4; padding: 30px; border-radius: 4px; border: 4px solid #d3a43f;">
        <div style="background-color: #5e161c; padding: 20px; text-align: center; border-bottom: 3px solid #d3a43f;">
          <h2 style="color: #ede4d4; margin: 0; letter-spacing: 1px;">LearnForwardSTEM</h2>
          <p style="color: #d3a43f; margin: 5px 0 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">By Students, For Students</p>
        </div>
        <div style="background-color: #ffffff; padding: 30px; color: #282828; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; color: #5e161c;">Hello ${toName},</p>
          <p style="font-size: 14px;">${mainText}</p>
          
          ${actionButtonText && actionButtonUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionButtonUrl}" target="_blank" style="background-color: #d3a43f; color: #5e161c; text-decoration: none; padding: 12px 30px; font-size: 15px; font-weight: bold; border: 2px solid #5e161c; display: inline-block;">
                ${actionButtonText}
              </a>
            </div>
          ` : ''}
          
          <hr style="border: 0; border-top: 1px solid #ede4d4; margin: 30px 0;" />
          <p style="font-size: 13px; color: #666;">We are a student-led nonprofit initiative making high-quality STEM education accessible for middle schoolers in Saudi Arabia.</p>
        </div>
        <div style="background-color: #282828; color: #ede4d4; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2026 LearnForwardSTEM. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #d3a43f;">Email: LearnForwardSTEM@gmail.com | Instagram: @learnforwardSTEM</p>
        </div>
      </div>
    `;
  }

  // Dispatches Discord Embed to Webhook Url immediately if specified
  static async sendDiscordNotification(webhookUrl: string, title: string, fields: { name: string, value: string, inline?: boolean }[]) {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      this.log('warn', 'Skipping Discord webhook post: Invalid URL pattern', 'DiscordAPI');
      return false;
    }

    try {
      const payload = {
        embeds: [{
          title: title,
          color: 6166044, // Equivalent to Maroon Hex #5e161c -> Int value 6166044
          fields: fields,
          timestamp: new Date().toISOString(),
          footer: {
            text: "LearnForwardSTEM Event Watcher",
            icon_url: "https://lh3.googleusercontent.com/a/default-user"
          }
        }]
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.log('info', `Discord custom webhook triggered for event: ${title}`, 'DiscordAPI');
        return true;
      } else {
        throw new Error(`Discord returned code ${res.status}`);
      }
    } catch (e) {
      this.log('error', `Discord custom webhook error: ${e instanceof Error ? e.message : String(e)}`, 'DiscordAPI');
      return false;
    }
  }
}
