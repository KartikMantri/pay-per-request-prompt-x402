# 🚀 Deploying x402 AI Gateway to Vercel

This guide will walk you through deploying both the **Frontend** (Vite/React) and the **Backend** (Node.js/Express) to Vercel.

---

## 📋 Prerequisites

1.  A [Vercel](https://vercel.com) account.
2.  The [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`).
3.  Your project pushed to a GitHub/GitLab/Bitbucket repository.

---

## 🛠️ Option 1: Monorepo Deployment (Recommended)

Vercel can host both the frontend and backend in a single project using **Serverless Functions** for the backend.

### 1. Create `vercel.json` in the Root

Create a `vercel.json` file in the root directory to route traffic to the frontend and backend correctly.

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/src/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ],
  "functions": {
    "backend/src/index.js": {
      "runtime": "vercel-node@latest",
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist"
}
```

### 2. Prepare the Backend for Serverless

Vercel's Node.js runtime expects the entry file to export the Express `app`. Your `backend/src/index.js` already does this, but you should ensure `app.listen()` doesn't prevent the function from completing.

Modify `backend/src/index.js`:

```javascript
// At the bottom of backend/src/index.js
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  start().catch(console.error);
} else {
  // Just initialize services without listening on a port
  // Vercel handles the server part
  import("./config.js").then(({ validateConfig }) => validateConfig());
  import("./services/blockchain.js").then(({ initBlockchain }) =>
    initBlockchain(),
  );
  import("./services/gemini.js").then(({ initGemini }) => initGemini());
  import("./services/x402PaymentModule.js").then(({ initX402Payment }) =>
    initX402Payment(),
  );
}

export default app;
```

### 3. Set Up Environment Variables

In your Vercel Project Dashboard (`Settings > Environment Variables`), add the following:

**Backend Variables:**

- `MONAD_RPC_URL`: `https://testnet-rpc.monad.xyz/`
- `CHAIN_ID`: `10143`
- `CONTRACT_ADDRESS`: _Your deployed contract address_
- `USDC_CONTRACT_ADDRESS`: `0x534b...` (USDC on Monad)
- `X402_PROCESSOR_ADDRESS`: `0x5ED6...`
- `X402_RECEIVER_ADDRESS`: _Your wallet address to receive funds_
- `RELAYER_PRIVATE_KEY`: _Wallet private key for gas fees_
- `NODE_ENV`: `production`

**Frontend Variables:**

- `VITE_API_URL`: `/api` (points to the same domain)

### 4. Deploy

Run the following command in the root:

```bash
vercel --prod
```

---

## 🛠️ Option 2: Separate Deployments

You can also deploy them as two separate Vercel projects.

### Frontend (Vite)

1.  **Framework Preset**: Vite
2.  **Root Directory**: `frontend`
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Env Vars**: `VITE_API_URL` (URL of your backend)

### Backend (Express)

1.  **Framework Preset**: Other (Node.js)
2.  **Root Directory**: `backend`
3.  **Build Command**: _Leave empty_
4.  **Output Directory**: _Leave empty_
5.  **Env Vars**: All variables from the `.env` section above.
6.  **Configuration**: You must have a `vercel.json` inside the `backend` folder:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "src/index.js" }]
    }
    ```

---

## 🔍 Verification

After deployment, check your dashboard:

1.  **Frontend**: Visit the deployment URL and check if the UI loads.
2.  **Backend**: Visit `https://your-url.vercel.app/api` to see the JSON response from the backend.
3.  **CORS**: Ensure the frontend can talk to the backend. If using Option 1, CORS is handled automatically as they share a domain.

## ⚠️ Important Note on Serverless

Remember that Vercel Functions are **stateless**. Any in-memory data in your backend will be lost between requests. Use a database (like Supabase, MongoDB, or Redis) if you need persistent storage for the backend.
