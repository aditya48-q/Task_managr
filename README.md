# GDGoC Task Manager

A production-grade, collaborative task and event workspace specifically designed for Google Developer Groups on Campus (GDGoC) organizing teams. Manage hackathons, study jams, workshops, tech talks, sponsorships, recruitment, and media campaigns with real-time sync, role-based access control, and hardened Cloud Firestore security.

---

## 1. Project Overview

GDGoC Task Manager answers key questions for campus chapter organizing leads and domain members:
- **What tasks need to be completed?** Real-time task tracker and 4-column Kanban board.
- **Who is responsible for each task?** Team member assignments with track indicators (Technical, Design, Operations, Outreach).
- **Which tasks are overdue & upcoming?** Color-coded deadline warnings and interactive month calendar.
- **Which projects are progressing well?** Milestone metrics calculated from actual task completion.
- **Which members have high workloads?** Workload meters and assignment breakdowns.
- **What changed recently?** Detailed audit log activity feed.

---

## 2. Feature List

- **Real-Time Synchronized Task Engine**: Full CRUD for tasks, associating tasks with GDGoC projects or workspace-wide initiatives.
- **Google Workspace-Inspired Design**: Restrained Google color system (`#4285F4`, `#34A853`, `#FBBC04`, `#EA4335`) with clean Inter typography and zero-pill discipline.
- **4-Column Kanban Board**: Visual stages (`To Do`, `In Progress`, `In Review`, `Completed`) supporting both HTML5 drag-and-drop and accessible status select dropdowns.
- **Monthly Event & Deadline Calendar**: Timezone-safe date handling without off-by-one conversion bugs.
- **Google Calendar 1P Integration**: Two-way Google Calendar event viewing, direct task deadline export, bulk sync of chapter milestones, and official "Continue with Google" sign-in.
- **Project & Event Management**: Track Hackathons (e.g. Solutions Challenge), Cloud Study Jams, Web Dev Workshops, and Social Media Campaigns.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin`, `Lead`, and `Member`.
- **Discussion & Comments Thread**: Real-time collaborative comment streams with author roles and relative timestamps.
- **Audit Activity Trail**: Log of creation, assignment, status change, completion, and comments.
- **Dual Live & Sandbox Modes**: Seamless local interactive demo sandbox with realistic GDGoC fixtures when Firebase is unconfigured, plus zero-friction connection to live Firebase.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript (strict mode), Vite 8
- **Styling**: Tailwind CSS v4, Inter system typography, Lucide React icons
- **Routing**: React Router v7 (`react-router-dom`)
- **Backend / Database**: Cloud Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication (Email/Password)
- **Hosting**: Firebase Hosting with single-page app rewrites
- **Build / Linting**: Vite, TypeScript compiler (`tsc --noEmit`)

---

## 4. Prerequisites

- Node.js (v18.0.0 or higher)
- npm or bun
- A Google account to create a Firebase project (for production mode)

---

## 5. Local Installation Instructions

Clone repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

---

## 6. Environment Variable Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set client-side variables in `.env`:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

*Note: In the absence of `.env` credentials, the application automatically runs in Demo Sandbox mode with realistic GDGoC fixtures so developers can evaluate all screens without setup.*

---

## 7. Firebase Project Setup Instructions

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `gdgoc-task-manager`).
3. Under **Project Settings** > **General**, scroll to **Your apps**, click the Web icon `</>`, and register the app.
4. Copy the `firebaseConfig` object values into your local `.env` file.

---

## 8. Authentication Setup

1. In the Firebase Console, navigate to **Build** > **Authentication**.
2. Click **Get Started** and enable the **Email/Password** sign-in method.
3. Save settings.

*Security Notice: During public registration, new users are automatically created as standard `Member`s. The first chapter Admin is provisioned via the secure administrative workflow or initialized in the workspace document.*

---

## 9. Firestore Initialization

1. In the Firebase Console, navigate to **Build** > **Firestore Database**.
2. Click **Create database** and select your preferred cloud region (e.g., `asia-east1` or `us-central1`).
3. Start in **Production mode** (security rules in `firestore.rules` protect access).

---

## 10. Firestore Schema Documentation

```
users/{uid}
  - uid: string
  - email: string
  - displayName: string
  - avatarUrl?: string
  - bio?: string
  - createdAt: timestamp

workspaces/{workspaceId}
  - id: string
  - name: string
  - chapterName: string
  - institution: string
  - description?: string
  - ownerId: string
  - createdAt: timestamp

workspaces/{workspaceId}/members/{uid}
  - uid: string
  - workspaceId: string
  - email: string
  - displayName: string
  - role: "Admin" | "Lead" | "Member"
  - teamTrack: "Technical" | "Design & Media" | "Operations" | "Outreach & PR" | "Core Team"
  - status: "active" | "invited" | "inactive"
  - joinedAt: timestamp

workspaces/{workspaceId}/projects/{projectId}
  - id: string
  - workspaceId: string
  - name: string
  - description: string
  - category: "Hackathon" | "Workshop" | "Study Jam" | "Tech Talk" | "Campaign" | "Internal"
  - status: "planning" | "active" | "completed" | "archived"
  - startDate?: string (YYYY-MM-DD)
  - endDate?: string (YYYY-MM-DD)
  - leadIds: string[]
  - createdBy: string (uid)

workspaces/{workspaceId}/tasks/{taskId}
  - id: string
  - workspaceId: string
  - projectId?: string
  - title: string
  - description?: string
  - status: "To Do" | "In Progress" | "In Review" | "Completed"
  - priority: "Low" | "Medium" | "High" | "Urgent"
  - category?: string
  - assigneeIds: string[]
  - dueDate?: string (YYYY-MM-DD)
  - completedAt?: string
  - createdBy: string (uid)
  - createdAt: timestamp
  - updatedAt: timestamp

workspaces/{workspaceId}/tasks/{taskId}/comments/{commentId}
  - id: string
  - taskId: string
  - authorId: string (uid)
  - authorName: string
  - authorRole?: string
  - content: string
  - createdAt: timestamp

workspaces/{workspaceId}/activity/{activityId}
  - id: string
  - workspaceId: string
  - actorId: string
  - actorName: string
  - action: "created" | "updated" | "status_changed" | "assigned" | "completed" | "commented" | "deleted"
  - targetType: "task" | "project" | "member" | "workspace"
  - targetId: string
  - targetTitle: string
  - details?: string
  - createdAt: timestamp
```

---

## 11. Role-Permission Matrix

| Operation | Member | Lead | Admin |
| :--- | :---: | :---: | :---: |
| View Workspace Tasks & Deadlines | **Yes** | **Yes** | **Yes** |
| Update Assigned Task Status (`In Progress`, `Done`) | **Yes** | **Yes** | **Yes** |
| Post Comments & Progress Notes | **Yes** | **Yes** | **Yes** |
| Create & Edit Projects / Events | No | **Yes** | **Yes** |
| Assign / Reassign Tasks to Others | No | **Yes** | **Yes** |
| Delete Tasks & Projects | No | No (Creator only) | **Yes** |
| Invite New Members & Change Roles | No | No | **Yes** |
| Modify Workspace Identity | No | No | **Yes** |

---

## 12. Security Rule Deployment Instructions

Deploy the hardened Firestore rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

Deploy composite query indexes:

```bash
firebase deploy --only firestore:indexes
```

---

## 13. Emulator and Test Instructions

Run the Firebase Emulator Suite for local integration testing:

```bash
firebase emulators:start --only firestore,auth
```

Run TypeScript compilation check:

```bash
npm run lint
```

---

## 14. Development Server Commands

Start the Vite development server on port 3000:

```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

---

## 15. Production Build Instructions

Compile optimized production assets:

```bash
npm run build
```

The compiled SPA bundle will be placed in `dist/`.

---

## 16. Firebase Hosting Deployment Steps

1. Log in to Firebase CLI:
   ```bash
   firebase login
   ```
2. Initialize hosting (configured via `firebase.json`):
   ```bash
   firebase init hosting
   ```
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 17. Known Limitations

- **Email Notifications**: In-app notifications are fully operational. Automated external email notifications require Firebase Cloud Functions or an SMTP delivery provider (e.g. Resend, SendGrid).
- **Offline Writes**: Offline mutations are supported via Firestore local caching; however, full offline state across extended browser restarts requires browser IndexedDB persistence.

---

## 18. Troubleshooting Instructions

- **Permission Denied in Firestore**: Ensure the user has authenticated and that a corresponding membership record exists in `workspaces/{workspaceId}/members/{uid}`.
- **Client Offline Warning**: Check your network connection and verify that `VITE_FIREBASE_PROJECT_ID` is correct.
- **SPA 404s on Refresh**: Ensure `firebase.json` contains the single-page rewrite to `/index.html`:
  ```json
  "rewrites": [{ "source": "**", "destination": "/index.html" }]
  ```
