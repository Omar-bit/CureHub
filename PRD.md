# Product Requirements Document (PRD)

**Project Name:** CureHub
**Type:** SaaS Web Platform for Doctors  
**Tech Stack:** React.js, TailwindCSS, ShadCN, NestJS, MySQL, Prisma, Docker

---

## 1. Vision

Build a scalable SaaS platform that empowers doctors, clinics, assistants, and patients with a modern, real-time dashboard for managing medical consultations, patient records, appointments, payments, and secure communication — all with a clean and intuitive design.

---

## 2. Target Users

- **Doctors**: Manage patients, agenda, consultations, payments, and tasks.
- **Assistants**: Support doctors with scheduling, patient management, and tasks.
- **Patients**: Book online consultations (remote/local/onsite), view history, manage payments.

---

## 3. Core Features

### 3.1 Dashboard

- Real-time updates on appointments, tasks, patient activity, and payments.
- KPI widgets: upcoming consultations, tasks due, revenue, new patients.

### 3.2 Medical Agenda

- Create/manage events, consultations, and PTO (vacations).
- Calendar view (daily, weekly, monthly).
- Sync with online booking.

### 3.3 Tasks Management

- Create and assign tasks to self or assistants.
- Deadlines, priority levels, completion tracking.

### 3.4 Patient Management

- **Individual patient profiles** with medical history, prescriptions, documents.
- **Groups**: family grouping or related patients.
- Search & filter patients by condition, family, or doctor.

### 3.5 Consultations

- **Types**: Online (teleconsultation), Onsite (in clinic), Local (home visit).
- Consultation record: symptoms, diagnosis, prescriptions, attachments.
- Link to payment & patient record.

### 3.6 Independent Website & Online Booking

- Each doctor gets their own booking site.
- Patients can book, cancel, and reschedule.
- Customizable branding (name, logo, working hours).

### 3.7 User Roles

- **Doctor**: Manage patients,scheduling, tasks, consultations, agenda, payments.
- **Assistant**: Manage scheduling, tasks, and patient intake.
- **Patient**: Book consultations, manage profile, make payments.

### 3.8 Payments

- Online payments (Stripe/PayPal integration).
- Payment history linked to consultation records.
- Invoices/receipts downloadable by patients.

### 3.9 Authentication & Security

- Secure authentication (JWT + refresh tokens).
- Role-based access control.
- Data encryption (at rest and in transit).
- GDPR/HIPAA-compliant design considerations.

### 3.10 Settings

- Profile & account settings ( doctor, patient).
- Notification preferences (email, SMS, push).
- Language & regional settings.

---

## 4. Non-Functional Requirements

- **Scalability**: Horizontal scaling with microservices-ready architecture.
- **Performance**: Real-time dashboard updates (WebSockets).
- **Security**: Encrypted communication, secure auth flows, audit logs.
- **Design**: Clean, modern UI with TailwindCSS + ShadCN.
- **Codebase**: Organized, modular, maintainable.
- **Reusable & Customizable Components**: UI and backend modules should be reusable, extendable, and customizable for future features.

---

## 5. Tech Stack

- **Frontend**: React.js + TailwindCSS + ShadCN UI
- **Backend**: **NestJS** (Node.js)
- **Database**: MySQL with **Prisma ORM**
- **Auth**: JWT / OAuth2
- **Payments**: Stripe (or PayPal)
- **Real-time**: Socket.io / WebSockets
- **Containerization**: Docker for deployment & scaling
- **Hosting**: Dockerized containers, scalable on VPS/cloud

---

## 6. Future Extensions

- AI-assisted transcription & summarization of consultations.
- Secure messaging between doctor & patient.
- API for integration with third-party medical systems.
- Mobile app for patients & doctors.
