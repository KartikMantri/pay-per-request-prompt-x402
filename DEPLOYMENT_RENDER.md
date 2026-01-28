# 🚀 Deploying Backend to Render

This guide explains how to deploy the **x402 AI Gateway Backend** to Render as a Web Service.

## 📋 Prerequisites

1.  A [Render](https://render.com) account.
2.  Your project pushed to a GitHub or GitLab repository.

## 🛠️ Deployment Steps

### 1. Create a New Web Service

1.  Log in to the [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub/GitLab repository.
4.  Select the `pay-per-request-x402` (or your repo name) repository.

### 2. Configure Service Settings

- **Name**: `x402-ai-backend` (or your choice)
- **Environment**: `Node`
- **Region**: Select the one closest to your users.
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Add Environment Variables

Click on **Advanced** or go to the **Environment** tab after creation. Add the following:

| Key                      | Value                                                                |
| :----------------------- | :------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                         |
| `PORT`                   | `10000`                                                              |
| `MONAD_RPC_URL`          | `https://testnet-rpc.monad.xyz/`                                     |
| `CHAIN_ID`               | `10143`                                                              |
| `CONTRACT_ADDRESS`       | `0x5ed6aa792ed7cd9d364711145d6d0ceb361dcfd4`                         |
| `USDC_CONTRACT_ADDRESS`  | `0x534b2f3A21130d7a60830c2Df862319e593943A3`                         |
| `X402_PROCESSOR_ADDRESS` | `0x86c8c32d2d7e072162ba8825a4df701e308107cc`                         |
| `X402_RECEIVER_ADDRESS`  | `0x0c9e972edcae045f043aa8d5edaa42a0311f5bb9`                         |
| `RELAYER_PRIVATE_KEY`    | `0xd5ceff54efe5f448714c96752ec054835cba7221f982548e2a0fb1a4bf01970d` |

### 4. Deploy

Click **Create Web Service**. Render will pull the code from the `backend` folder, install dependencies, and start the server.

## 🔗 Connecting Frontend to Render

When you have your Render URL (e.g., `https://x402-ai-backend.onrender.com`), you must update your Frontend deployment's `VITE_API_URL` to point to this address.

## ⚠️ Notes for Free Tier

- **Spin-down**: Render's free tier services spin down after 15 minutes of inactivity. The first request after a spin-down may take 30+ seconds.
- **CORS**: Ensure your backend's `allowedOrigins` includes your production frontend URL (e.g., your `.vercel.app` domain). The backend is currently configured to allow `*.vercel.app` automatically.
