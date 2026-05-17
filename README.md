# 🖥️ ConnectHub Frontend - Angular Real-Time Chat Client

ConnectHub Frontend is a modern, feature-rich single-page application built with **Angular 17**, **PrimeNG**, and **SignalR**, serving as the client layer for the ConnectHub microservices backend. It delivers a seamless real-time messaging experience with a polished glassmorphism UI, full responsive design, and deep SignalR integration.

---

## 🚀 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Angular 17** | SPA Framework (Standalone Components) |
| **TypeScript 5.4** | Type-safe development |
| **PrimeNG 17** | UI Component Library |
| **PrimeFlex** | CSS Utility Layout System |
| **PrimeIcons** | Icon Library |
| **@microsoft/signalr** | Real-Time WebSocket Client |
| **RxJS 7.8** | Reactive State & Async Data Streams |
| **SCSS** | Styling with Variables & Glassmorphism |
| **Angular Router** | Client-Side Navigation & Route Guards |
| **HttpClient + Interceptors** | JWT-authenticated HTTP communication |
| **Karma + Jasmine** | Unit Testing |

---

## 🏗 Application Architecture

ConnectHub Frontend follows a **Feature-Based Architecture** with the following principles:

✅ **Standalone Components** - Angular 17 standalone API, no NgModules  
✅ **Feature Modules Pattern** - Self-contained feature folders  
✅ **Core Services Layer** - Singleton services for auth, SignalR, API calls  
✅ **Reactive Programming** - RxJS Subjects and Observables for real-time updates  
✅ **Route Guards** - JWT-protected navigation  
✅ **HTTP Interceptors** - Automatic token injection and 401 handling  
✅ **Lazy Loading** - Admin module loaded on demand  
✅ **Hybrid Session Management** - localStorage + sessionStorage strategy  

---

## 📦 Module Overview

| Module / Feature | Route | Responsibility |
|---------|-------|----------------|
| **AuthModule** | `/auth/login`, `/auth/register` | Login, registration, Google OAuth |
| **DashboardModule** | `/dashboard` | Overview, recent chats, quick stats |
| **ChatModule** | `/chat` | Direct messaging, real-time chat window |
| **RoomsModule** | `/rooms` | Group chat rooms, member management |
| **NotificationsModule** | `/notifications` | Notification history, mark as read |
| **MediaModule** | `/media` | Media gallery, file management |
| **SettingsModule** | `/settings` | Profile, password, account settings |
| **AdminModule** | `/admin` | User management, broadcast notifications |
| **LayoutModule** | (shell) | Sidebar, header, responsive scaffold |

---

## 🎯 Core Features

### 👤 Authentication Features
✅ Email & password login  
✅ New user registration  
✅ Google OAuth (one-click sign-in)  
✅ JWT token storage and auto-injection  
✅ Hybrid session management (logout on browser close)  
✅ Account reactivation flow  
✅ 401 auto-redirect on token expiry  

### 💬 Direct Messaging Features
✅ Real-time message delivery via SignalR  
✅ Message history with scroll loading  
✅ Typing indicators  
✅ Read receipts (single & bulk mark-as-read)  
✅ Message editing & deletion  
✅ Media/file attachments in chat  
✅ Message search  
✅ Online/offline presence indicators  

### 🏠 Chat Room Features
✅ Browse public rooms  
✅ Create and manage rooms  
✅ Join / leave rooms  
✅ Room member list with roles  
✅ Real-time group messaging  
✅ Room admin controls (add/remove members, update roles)  
✅ Room settings & deletion  

### 📁 Media Features
✅ File upload from chat window  
✅ Media gallery view  
✅ SAS URL generation for secure file access  
✅ File deletion  
✅ Custom media URL transform pipe  

### 🔔 Notification Features
✅ Real-time notification badge  
✅ Notification history list  
✅ Mark individual or all as read  
✅ Delete notifications  

### 🛡️ Admin Features
✅ User management dashboard  
✅ Toggle user active/inactive status  
✅ Broadcast bulk notifications to selected users  
✅ Lazy-loaded admin route (role-guarded)  

---

## 🏛 Architecture Diagrams

### Application Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER LAYER                            │
│                   Angular 17 SPA (Port 4200)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
    HTTP (REST)                  WebSocket (SignalR)
    + JWT Bearer                  @microsoft/signalr
          │                             │
┌─────────▼─────────────────────────────▼─────────────────────────┐
│                   API GATEWAY (YARP) — Port 8080                │
│        /api/*  →  REST microservices                            │
│        /hubs/* →  HubService (SignalR)                          │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┬───────┘
   │          │          │          │          │          │
┌──▼────┐ ┌───▼───┐ ┌───▼────┐ ┌───▼──────┐ ┌▼────────┐ ┌▼────────┐
│ Auth  │ │Message│ │ChatRoom│ │   Hub    │ │Notif.   │ │ Media   │
│Service│ │Service│ │Service │ │ Service  │ │Service  │ │Service  │
└───────┘ └───────┘ └────────┘ └──────────┘ └─────────┘ └─────────┘
```

### Angular Application Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                        Angular App Shell                         │
│  app.component.ts  →  <router-outlet>                            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
              ┌────────────────┴─────────────────┐
              │                                  │
   ┌──────────▼───────────┐          ┌───────────▼──────────┐
   │   PUBLIC ROUTES       │         │  PROTECTED ROUTES    │
   │  /auth/login          │         │  canActivate: Guard  │
   │  /auth/register       │         │                      │
   └────────────────────── ┘         │  LayoutComponent     │
                                     │  ┌────────────────┐  │
                                     │  │   app-header   │  │
                                     │  │   app-sidebar  │  │
                                     │  │ <router-outlet>│  │
                                     │  └────────────────┘  │
                                     │                      │
                                     │  /dashboard          │
                                     │  /chat               │
                                     │  /rooms              │
                                     │  /notifications      │
                                     │  /media              │
                                     │  /settings           │
                                     │  /admin (lazy)       │
                                     └──────────────────────┘
```

### Component Tree Diagram

```
AppComponent
├── LoginComponent          (/auth/login)
├── RegisterComponent       (/auth/register)
└── LayoutComponent         (protected shell)
    ├── HeaderComponent
    │   └── [user avatar, hamburger, notifications badge]
    ├── SidebarComponent
    │   └── [nav links, logout, admin link if Admin role]
    └── <router-outlet>
        ├── DashboardComponent       (/dashboard)
        ├── ChatWindowComponent      (/chat)
        │   ├── [user search panel]
        │   ├── [conversation list]
        │   ├── [message thread]
        │   │   ├── [message bubbles]
        │   │   ├── [typing indicator]
        │   │   └── [read receipts]
        │   ├── [message input + send]
        │   └── [file upload button]
        ├── RoomListComponent        (/rooms)
        │   ├── [my rooms tab]
        │   ├── [public rooms tab]
        │   ├── [create room dialog]
        │   ├── [room member panel]
        │   └── [room chat window]
        ├── NotificationListComponent (/notifications)
        ├── MediaGalleryComponent     (/media)
        ├── SettingsComponent         (/settings)
        │   ├── [profile tab]
        │   ├── [security tab]
        │   └── [danger zone tab]
        └── AdminDashboardComponent   (/admin) [lazy loaded]
            ├── [user table]
            └── [broadcast notification panel]
```

### Core Services Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                       CORE SERVICES LAYER                     │
│                    (providedIn: 'root')                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐   ┌──────────────────────────────────┐   │
│  │   AuthService   │   │         SignalrService           │   │
│  │                 │   │                                  │   │
│  │ • login()       │   │ • startConnection()              │   │
│  │ • register()    │   │ • stopConnection()               │   │
│  │ • googleLogin() │   │ • sendMessage()                  │   │
│  │ • logout()      │   │ • sendMediaMessage()             │   │
│  │ • getToken()    │   │ • sendTypingIndicator()          │   │
│  │ • isAdmin()     │   │ • editMessage()                  │   │
│  │ • currentUser$  │   │ • deleteMessage()                │   │
│  │   (BehaviorSub) │   │ • joinRoom() / leaveRoom()       │   │
│  └────────┬────────┘   │ • sendRoomMessage()              │   │
│           │            │ • markMessageAsRead()            │   │
│           │            │ • requestOnlineUsers()           │   │
│           │            │                                  │   │
│           │            │  Observables (Subjects):         │   │
│           │            │  • messageReceived$              │   │
│           │            │  • messageEdited$                │   │
│           │            │  • messageDeleted$               │   │
│           │            │  • typingIndicator$              │   │
│           │            │  • userPresence$                 │   │
│           │            │  • messageRead$                  │   │
│           │            │  • roomMessageReceived$          │   │
│           │            │  • newRoomAdded$                 │   │
│           │            └──────────────────────────────────┘   │
│           │                                                   │
│  ┌────────▼────────┐   ┌──────────────────────────────────┐   │
│  │  MessageService │   │          RoomService             │   │
│  │                 │   │                                  │   │
│  │ • getConversation│  │ • createRoom()                   │   │
│  │ • getRoomMessages│  │ • getRoomsByUser()               │   │
│  │ • getRecentChats│   │ • getPublicRooms()               │   │
│  │ • searchMessages│   │ • joinRoom()                     │   │
│  │ • markAsRead()  │   │ • leaveRoom()                    │   │
│  │ • editMessage() │   │ • getMembers()                   │   │
│  │ • deleteMessage │   │ • addMember()                    │   │
│  └─────────────────┘   │ • removeMember()                 │   │
│                        │ • updateMemberRole()             │   │
│  ┌─────────────────┐   └──────────────────────────────────┘   │
│  │  MediaService   │                                          │
│  │                 │   ┌──────────────────────────────────┐   │
│  │ • upload()      │   │      NotificationService         │   │
│  │ • getByUser()   │   │                                  │   │
│  │ • getSasUrl()   │   │ • getNotifications()             │   │
│  │ • delete()      │   │ • markAsRead()                   │   │
│  └─────────────────┘   │ • markAllRead()                  │   │
│                        │ • deleteNotification()           │   │
│  ┌─────────────────┐   └──────────────────────────────────┘   │
│  │  UserService    │                                          │
│  │                 │   ┌──────────────────────────────────┐   │
│  │ • getProfile()  │   │        AdminService              │   │
│  │ • updateProfile │   │                                  │   │
│  │ • searchUsers() │   │ • getAllUsers()                  │   │
│  │ • getUserById() │   │ • toggleUserStatus()             │   │
│  │ • getOnlineUsers│   │ • sendBulkNotification()         │   │
│  └─────────────────┘   └──────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Authentication Flow Diagram

```
┌──────────┐         ┌──────────┐         ┌──────────────────┐
│  Browser │         │ Angular  │         │ Backend Gateway  │
└────┬─────┘         └────┬─────┘         └────────┬─────────┘
     │                    │                        │
     │  Navigate to /     │                        │
     ├───────────────────►│                        │
     │                    │                        │
     │                    │  authGuard check       │
     │                    │  (localStorage token?) │
     │                    │                        │
     │  Redirect /auth/login (no token)            │
     │◄───────────────────┤                        │
     │                    │                        │
     │  Submit Login Form │                        │
     ├───────────────────►│                        │
     │                    │  POST /api/auth/login  │
     │                    ├───────────────────────►│
     │                    │  { token, user }       │
     │                    │◄───────────────────────┤
     │                    │                        │
     │                    │  localStorage.set(token, user)
     │                    │  currentUser$ BehaviorSubject.next()
     │                    │                        │
     │  Redirect /dashboard                        │
     │◄───────────────────┤                        │
     │                    │                        │
     │  All subsequent HTTP requests               │
     │                    │  authInterceptor adds  │
     │                    │  Authorization: Bearer <token>
     │                    ├───────────────────────►│
     │                    │                        │
     │  On 401 response   │                        │
     │                    │◄───────────────────────┤
     │                    │  clearLocalData()      │
     │  Redirect /auth/login                       │
     │◄───────────────────┤                        │
```

### SignalR Real-Time Communication Flow

```
LayoutComponent (ngOnInit)
        │
        │  signalrService.startConnection()
        │
        ▼
SignalrService
        │
        │  HubConnectionBuilder
        │  .withUrl('/hubs/chat', { accessTokenFactory })
        │  .withAutomaticReconnect()
        │  .build()
        │
        │  hubConnection.start()
        │
        ▼
   Connected ────────────────────────────────────────────────── ┐
        │                                                       │
        │  registerOnEvents()                                   │
        │  ┌──────────────────────────────────────────── ─┐     │
        │  │ ReceiveMessage    → messageReceived$.next()  │     │
        │  │ MessageSent       → messageSent$.next()      │     │
        │  │ MessageEdited     → messageEdited$.next()    │     │
        │  │ MessageDeleted    → messageDeleted$.next()   │     │
        │  │ UserTyping        → typingIndicator$.next()  │     │
        │  │ UserOnline/Offline→ userPresence$.next()     │     │
        │  │ OnlineUsers       → userPresence$.next()     │     │
        │  │ ReceiveRoomMessage→ roomMessageReceived$     │     │
        │  │ RoomMessageEdited → roomMessageEdited$       │     │
        │  │ RoomMessageDeleted→ roomMessageDeleted$      │     │
        │  │ NewRoomAdded      → newRoomAdded$.next()     │     │
        │  └───────────────────────────────────────────── ┘     │
        │                                                       │
        ▼                                                       │
ChatWindowComponent                                             │
RoomListComponent     ──────────────────────────(subscribes)──┘
HeaderComponent
SidebarComponent
```

### Route Guard Flow

```
User navigates to /chat
        │
        ▼
   authGuard (CanActivateFn)
        │
        │  localStorage.getItem('user') ?
        │
   ┌────┴────┐
   │         │
  YES        NO
   │         │
   │         │  router.navigate(['/auth/login'])
   │         │  return false
   ▼         ▼
Allow     Block
Access    Access
```
### State Management Pattern

```
                    BehaviorSubject<User>
                    ┌─────────────────────┐
                    │    AuthService      │
                    │  currentUser$       │
                    └────────┬────────────┘
                             │ async pipe / subscribe
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──┐  ┌────────▼───┐  ┌──────▼──────┐
    │  Header    │  │  Sidebar   │  │  Settings   │
    │ Component  │  │ Component  │  │  Component  │
    │(avatar,    │  │(admin link │  │(profile     │
    │ username)  │  │ if Admin)  │  │ form pre-   │
    └────────────┘  └────────────┘  │ populated)  │
                                    └─────────────┘

                    Subject<Message>
                    ┌──────────────────────┐
                    │   SignalrService     │
                    │  messageReceived$    │
                    └──────────┬───────────┘
                               │ subscribe
                    ┌──────────▼───────────┐
                    │  ChatWindowComponent │
                    │  (appends message    │
                    │   to chat list)      │
                    └──────────────────────┘
```

---

## 📂 Project Structure

```
ConnectHub_Frontend/
│
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                          ← Singleton services, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          ← Route protection (JWT check)
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts    ← Auto JWT injection + 401 handling
│   │   │   └── services/
│   │   │       ├── auth.service.ts        ← Login, register, Google OAuth, session
│   │   │       ├── signalr.service.ts     ← SignalR hub connection + all real-time events
│   │   │       ├── message.service.ts     ← Direct message REST API
│   │   │       ├── room.service.ts        ← Chat room REST API
│   │   │       ├── notification.service.ts← Notification REST API
│   │   │       ├── media.service.ts       ← File upload REST API
│   │   │       ├── user.service.ts        ← User profile & search REST API
│   │   │       └── admin.service.ts       ← Admin REST API
│   │   │
│   │   ├── features/                      ← Feature-specific components
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   └── register/
│   │   │   │       ├── register.component.ts
│   │   │   │       ├── register.component.html
│   │   │   │       └── register.component.scss
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.scss
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   └── chat-window/
│   │   │   │       ├── chat-window.component.ts    ← Core chat logic, SignalR subs
│   │   │   │       ├── chat-window.component.html
│   │   │   │       └── chat-window.component.scss
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   └── room-list/
│   │   │   │       ├── room-list.component.ts
│   │   │   │       ├── room-list.component.html
│   │   │   │       └── room-list.component.scss
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   └── notification-list/
│   │   │   │       ├── notification-list.component.ts
│   │   │   │       ├── notification-list.component.html
│   │   │   │       └── notification-list.component.scss
│   │   │   │
│   │   │   ├── media/
│   │   │   │   └── media-gallery/
│   │   │   │       ├── media-gallery.component.ts
│   │   │   │       ├── media-gallery.component.html
│   │   │   │       └── media-gallery.component.scss
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   └── settings/
│   │   │   │       ├── settings.component.ts       ← Profile, password, deactivate
│   │   │   │       ├── settings.component.html
│   │   │   │       └── settings.component.scss
│   │   │   │
│   │   │   └── admin/
│   │   │       └── admin-dashboard/
│   │   │           └── admin-dashboard.component.ts ← Lazy loaded, role-protected
│   │   │
│   │   ├── layout/                        ← App shell components
│   │   │   ├── layout/
│   │   │   │   ├── layout.component.ts    ← SignalR lifecycle, sidebar toggle
│   │   │   │   ├── layout.component.html
│   │   │   │   └── layout.component.scss
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   └── sidebar/
│   │   │       ├── sidebar.component.ts   ← Nav links, logout, admin guard
│   │   │       ├── sidebar.component.html
│   │   │       └── sidebar.component.scss
│   │   │
│   │   ├── shared/                        ← Reusable pipes, directives
│   │   │   └── pipes/
│   │   │       └── transform-media-url.pipe.ts
│   │   │
│   │   ├── app.component.ts               ← Root component
│   │   ├── app.config.ts                  ← provideRouter, provideHttpClient, provideAnimations
│   │   └── app.routes.ts                  ← All application routes
│   │
│   ├── assets/
│   │   └── styles/
│   │       └── _variables.scss            ← Design tokens (colors, spacing, breakpoints)
│   │
│   ├── environments/
│   │   ├── environment.ts                 ← Dev: apiUrl, hubUrl, googleClientId
│   │   └── environment.prod.ts            ← Prod environment config
│   │
│   ├── styles.scss                        ← Global styles, PrimeNG theme, glassmorphism
│   ├── main.ts                            ← bootstrapApplication entry point
│   └── index.html
│
├── scripts/
│   └── sync-secrets.js                    ← Pre-start secret sync utility
│
├── angular.json                           ← Angular CLI workspace config
├── tsconfig.json
└── package.json
```

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `$primary-color` | `#384959` | Primary brand, active states, buttons |
| `$accent-color` | `#88BDF2` | Hover states, highlights |
| `$bg-color` | `#F0F7FF` | Page background |
| `$surface-color` | `#FFFFFF` | Cards, panels |
| `$text-primary` | `#1A252F` | Headings, body text |
| `$text-secondary` | `#384959` | Subtext, labels |
| `$color-muted` | `#6A89A7` | Disabled, placeholders |
| `$border-color` | `rgba(#6A89A7, 0.2)` | Dividers, card borders |

### Layout Tokens

| Token | Value |
|-------|-------|
| `$header-height` | `70px` |
| `$sidebar-width` | `260px` |
| `$border-radius` | `12px` |
| `$transition-base` | `0.3s ease` |
| `$font-family` | `Inter, Poppins, sans-serif` |

### Glassmorphism Mixin

```scss
@mixin glass-effect {
  background: rgba($surface-color, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba($color-dusty, 0.2);
  box-shadow: 0 8px 32px 0 rgba($color-deep, 0.08);
}
```

---

## 🌐 API Integration

All HTTP calls route through the API Gateway at `http://localhost:8080/api`.

### Service to Backend Mapping

| Frontend Service | Base URL | Backend Service |
|-----------------|----------|----------------|
| `AuthService` | `/api/auth` | AuthService :5000 |
| `UserService` | `/api/user` | AuthService :5000 |
| `MessageService` | `/api/messages` | MessageService :5003 |
| `RoomService` | `/api/rooms` | ChatRoomService :5004 |
| `NotificationService` | `/api/notifications` | NotificationService :5007 |
| `MediaService` | `/api/media` | MediaService :5008 |
| `SignalrService` | `/hubs/chat` | HubService :5006 |

### Environment Configuration

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  hubUrl: 'http://localhost:8080/hubs',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  hubUrl: 'https://your-domain.com/hubs',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID'
};
```

---

## 🔄 Key Workflows

### 1️⃣ App Bootstrap Flow

```
main.ts
    ↓
bootstrapApplication(AppComponent, appConfig)
    ↓
appConfig providers:
  ├── provideRouter(routes)
  ├── provideHttpClient(withInterceptors([authInterceptor]))
  └── provideAnimations()
    ↓
AppComponent renders <router-outlet>
    ↓
Default route '' → redirectTo '/auth/login'
    ↓
authGuard checks localStorage
    ├── Token found → redirect to /dashboard
    └── No token   → stay at /auth/login
```

### 2️⃣ Login & SignalR Bootstrap

```
User submits login form
        ↓
AuthService.login(credentials)
        ↓
POST /api/auth/login → { token, user }
        ↓
localStorage.set('token', token)
localStorage.set('user', JSON.stringify(user))
currentUser$.next(user)
        ↓
Router navigates to /dashboard
        ↓
LayoutComponent renders (ngOnInit)
        ↓
signalrService.startConnection()
        ↓
HubConnectionBuilder connects to /hubs/chat
accessTokenFactory returns localStorage token
        ↓
connected$.next() fires
        ↓
Components subscribe to:
  messageReceived$, userPresence$, typingIndicator$, etc.
```

### 3️⃣ Sending a Real-Time Message

```
User types in ChatWindowComponent
        ↓
sendTypingIndicator(receiverId, true)
        ↓
signalrService.invoke('TypingIndicator', receiverId, true)
        ↓ (backend broadcasts to receiver)
Receiver sees typing bubble via typingIndicator$

User presses Send
        ↓
signalrService.sendMessage(receiverId, content)
        ↓
hubConnection.invoke('SendDirectMessage', receiverId, content)
        ↓ (backend: saves to DB → publishes RabbitMQ event)
        ↓
messageSent$ fires on sender
messageReceived$ fires on receiver
        ↓
Both ChatWindowComponents append message to list
```

### 4️⃣ Uploading a File in Chat

```
User clicks attachment icon
        ↓
File input triggered
        ↓
mediaService.upload(file)
        ↓
POST /api/media/upload (multipart/form-data)
        ↓
{ fileId, blobUrl } returned
        ↓
signalrService.sendMediaMessage(receiverId, '', blobUrl, messageType)
        ↓
hubConnection.invoke('SendMediaMessage', ...)
        ↓
Real-time message with media URL delivered to receiver
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17 (`npm install -g @angular/cli`)
- ConnectHub backend running (Docker Compose at port 8080)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ConnectHub_Frontend.git
cd ConnectHub_Frontend/ConnectHub_Frontend

# Install dependencies
npm install

# Configure environment (if needed)
# Edit src/environments/environment.ts with your backend URL

# Start development server
npm start
# App runs at http://localhost:4200
```

### Available Scripts

```bash
npm start        # Starts dev server (runs sync-secrets.js first)
npm run build    # Production build to /dist
npm run watch    # Dev build with file watching
npm test         # Run unit tests via Karma
```

---

## 🧪 Testing

```bash
# Run all unit tests
ng test

# Run with code coverage
ng test --code-coverage

# Run a single spec file
ng test --include **/auth.service.spec.ts
```

Test files are colocated with components (`.spec.ts`).

---

## 📱 Responsive Design

The application is fully responsive across all breakpoints:

| Breakpoint | Behavior |
|-----------|----------|
| `> 992px` | Sidebar always visible; main content fills rest |
| `≤ 992px` | Sidebar hidden by default; hamburger menu in header toggles it |
| Mobile | Overlay appears over content; tap outside to dismiss sidebar |

The sidebar toggle is managed by `LayoutComponent.isSidebarVisible` and communicated to `SidebarComponent` via `@Output() closeSidebar`.

---

## 🔐 Security

- **JWT Injection** — `authInterceptor` automatically adds `Authorization: Bearer <token>` to every outgoing HTTP request.
- **Route Protection** — `authGuard` blocks all protected routes if no valid session is found in localStorage.
- **Session Expiry** — Hybrid `localStorage` + `sessionStorage` strategy logs the user out when the browser is fully closed and reopened.
- **401 Auto-Logout** — `authInterceptor` catches `401 Unauthorized` responses, clears local storage, and redirects to login.
- **Role-Based UI** — Admin navigation link and `/admin` route visible only when `user.role === 'Admin'`.
- **Lazy Loading** — Admin dashboard is never bundled into the main chunk; loaded only when the admin route is accessed.

---

## 🔧 Configuration Reference

### Angular App Config (`app.config.ts`)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};
```

### Route Table (`app.routes.ts`)

| Path | Component | Guard |
|------|-----------|-------|
| `` | → `/auth/login` | — |
| `/auth/login` | `LoginComponent` | — |
| `/auth/register` | `RegisterComponent` | — |
| `/dashboard` | `DashboardComponent` | `authGuard` |
| `/chat` | `ChatWindowComponent` | `authGuard` |
| `/rooms` | `RoomListComponent` | `authGuard` |
| `/notifications` | `NotificationListComponent` | `authGuard` |
| `/media` | `MediaGalleryComponent` | `authGuard` |
| `/settings` | `SettingsComponent` | `authGuard` |
| `/admin` | `AdminDashboardComponent` (lazy) | `authGuard` |
| `**` | → `/auth/login` | — |

---

## 🗺 Roadmap

### Phase 1 (Completed)
- [x] Angular 17 standalone component architecture
- [x] JWT authentication with Google OAuth
- [x] Real-time direct messaging via SignalR
- [x] Group chat rooms
- [x] Media uploads and gallery
- [x] Notification center
- [x] User settings and profile management
- [x] Admin dashboard
- [x] Responsive layout with glassmorphism UI

### Phase 2 (Planned)
- [ ] Dark mode toggle
- [ ] Message search UI
- [ ] Progressive Web App (PWA) support
- [ ] Mobile app (Ionic / Capacitor)
- [ ] End-to-end encryption UI indicators
- [ ] Analytics dashboard (admin)

---

## 📚 Additional Resources

- [Angular Documentation](https://angular.dev)
- [PrimeNG Components](https://primeng.org)
- [Microsoft SignalR JS Client](https://learn.microsoft.com/aspnet/core/signalr/javascript-client)
- [RxJS Documentation](https://rxjs.dev)
- [PrimeFlex CSS](https://primeflex.org)
