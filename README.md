
# SIH College Portal

A comprehensive full-stack application designed to manage all aspects of a college hackathon. This portal provides a seamless experience for students to register, form teams, and submit ideas, while giving administrators powerful tools to manage the entire event.

🔗 **Live Demo:** [https://hackathon-college-portal.vercel.app/](https://hackathon-college-portal.vercel.app/)

---

## ✨ Key Features

* **Secure Authentication:** Robust user and admin login system using JWT with httpOnly cookies.
* **Role-Based Access Control:** Separate interfaces and permissions for regular users and administrators.
* **Automated Verification:** A system to automatically verify students against a pre-approved list of roll numbers, reducing manual admin work.
* **Profile Management:** Users can manage their profile, including:
  * Updating their name (with limits) and academic year.
  * Uploading a profile photo and **team logo** (stored securely).
  * Adding professional social links (LinkedIn, GitHub, Stack Overflow).
* **Team Formation:** A complete team management system where users can create teams, send join requests, and manage members. Team leaders have special privileges to approve requests and remove members.
* **Idea Submission:** A dedicated "Idea Board" where users can submit their hackathon ideas, which can then be managed by administrators.
* **Resource Hub:** A community-driven hub where users can suggest helpful links and resources, which are then approved and published by admins.
* **Official Updates:** A section for admins to post official announcements, which are displayed to all users.
* **Comprehensive Admin Dashboard:** A central hub for admins to:
    * View key metrics (total users, teams, etc.).
    * Manage all users (verify, un-verify, export to CSV/Excel).
    * Moderate user-submitted resources.
    * Review and delete ideas and official updates.

---

## 💻 Tech Stack

| Category      | Technology                                                              |
| :------------ | :---------------------------------------------------------------------- |
| **Frontend** | Next.js (App Router), React, Tailwind CSS                               |
| **Backend** | Node.js, Express.js                                                     |
| **Database** | MongoDB with Mongoose, **Supabase (Storage)**                           |
| **Animation** | GSAP (GreenSock Animation Platform)                                     |
| **Icons** | Lucide React                                                            |
| **Auth** | JSON Web Tokens (JWT), bcrypt.js                                        |
| **File Uploads**| Multer (for local dev), Cloudinary + Supabase Buckets (for production) |
| **Emailing** | Nodemailer                                                              |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Clone the Repository
```bash
git clone <your-github-repository-url>
cd sih-college-portal
```

### 2. Setup the Backend (server)
Navigate to the server directory and install the dependencies.
```bash
cd server
npm install
```

Create a `.env` file in the server directory and add the following environment variables:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret Key
JWT_SECRET=your_super_secret_key

# Frontend URL
CLIENT_URL=http://localhost:3000

# Cloudinary Credentials (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase (for storage & profile/team logos)
SUPABASE_URL=your_supabase_url
SUPABASE_BUCKET=your_bucket_name
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SMTP Credentials (for password reset emails)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
```

### 3. Setup the Frontend (client)
Navigate to the client directory and install the dependencies.
```bash
cd ../client
npm install
```

Create a `.env.local` file in the client directory and add the following:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

### 4. Run the Application
You will need two separate terminals to run both the backend and frontend servers.

In Terminal 1 (from the project root):
```bash
cd server
npm run dev
```

In Terminal 2 (from the project root):
```bash
cd client
npm run dev
```

Your application should now be running, with the frontend available at [http://localhost:3000](http://localhost:3000) and the backend at [http://localhost:5001](http://localhost:5001).

---

## 🌐 Deployment

To deploy this project in production:

### 1. Backend Deployment
* Use a platform like **Render**, **Railway**, or **AWS EC2** to deploy the backend server.
* Make sure to set all environment variables in the platform’s dashboard (same as `.env` file).
* Use a production MongoDB connection (MongoDB Atlas is recommended).

### 2. Frontend Deployment
* Deploy the frontend on **Vercel** or **Netlify**.
* Set environment variables (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_BUCKET`) in the deployment dashboard.
* Point `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.

### 3. Supabase Setup
* Create a Supabase project.
* Create a public storage bucket (for profile pictures & team logos).
* Copy the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and bucket name to your environment variables.

### 4. Domain Setup
* Optionally, connect a custom domain (e.g., `portal.yourcollege.com`) to the frontend deployment.
* Configure `CLIENT_URL` in backend `.env` to match the production domain.

Your project will now be fully deployed with working image storage, authentication, and team management features.
