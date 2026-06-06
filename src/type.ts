export interface TutorApplication {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  schoolUniversity: string;
  majorGrade: string;
  subjects: string[]; // 'Mathematics', 'Computer Science'
  bio: string;
  hoursPerWeek: number;
  submittedAt: string;
}

export interface StudentRegistration {
  id: string;
  fullName: string;
  parentEmail: string;
  parentWhatsapp: string;
  gradeLevel: string; // e.g. 'Grade 6', 'Grade 7', 'Grade 8'
  subjects: string[]; // 'Mathematics', 'Computer Science'
  location: string;
  userUid?: string; // Firebase authenticated UID association
  submittedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  type: 'general' | 'class' | 'mentorship';
  discordUser?: string; // Required for student meeting booking
  userUid?: string; // Authenticated student UID booking
}

export interface WebhookSettings {
  url: string;
  enabled: boolean;
}
