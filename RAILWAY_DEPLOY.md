# 🚂 Quick Deploy to Railway

This project is prepared for a "one-click" style deployment to Railway using the provided `railway.json` orchestration file.

## 🚀 Deployment Steps

1. **Push to GitHub**:
   Ensure all changes (including the new `Dockerfile` and `railway.json`) are pushed to your GitHub repository.

2. **Login to Railway**:
   Go to [railway.app](https://railway.app) and sign in with your GitHub account.

3. **New Project**:
   - Click on **"New Project"**.
   - Select **"Deploy from GitHub repo"**.
   - Choose your repository.

4. **Auto-Configuration**:
   Railway will automatically detect the `railway.json` file and prompt you to deploy the services defined within it:
   - **db**: A PostgreSQL instance.
   - **backend**: The FastAPI application.
   - **frontend**: The Next.js application.

5. **Variables**:
   Check the variables for each service. Most are auto-configured, but you may want to set:
   - `JWT_SECRET`: A secure random string for authentication.
   - `NEXT_PUBLIC_BASE_URL`: This will be auto-assigned by Railway, but verify it if you use a custom domain.

6. **Database Seeding**:
   Once the database and backend are running, you can seed the database by running this command in the Railway CLI or via a separate deployment job:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

## 🛠 Services Overview

- **Frontend**: Runs on port 3000 (exposed via Railway URL).
- **Backend**: Runs on port 8000 (internal communication).
- **Database**: PostgreSQL on port 5432 (local to the Railway project).

## 🆘 Troubleshooting

- **Build Failures**: Check the build logs in the Railway dashboard. Ensure `node` version is 20+.
- **Database Connection**: Verify that `DATABASE_URL` is correctly injected from the `db` service.
