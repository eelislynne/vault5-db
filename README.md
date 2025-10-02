# Vault5 Database Utilities

This folder contains database seeding and management scripts for the Vault5 platform.

## 📋 Table of Contents

- [Available Scripts](#available-scripts)
- [Quick Start](#quick-start)
- [Seeding Database](#seeding-database)
- [Managing Logs](#managing-logs)
- [Finding Your Server ID](#finding-your-server-id)
- [Common Workflows](#common-workflows)

---

## 🛠️ Available Scripts

### Database Seeding

- **`npm run seed`** - Seed the entire database with test data
- **`npm run seed:logs`** - Seed FiveM logs for a specific server
- **`npm run clear:logs`** - Clear all logs for a specific server

### Manual Scripts

- **`npx tsx seed.ts`** - Reset and seed the entire database
- **`npx tsx seed-fivem-logs.ts <serverId> [count]`** - Seed FiveM logs
- **`npx tsx clear-logs.ts <serverId>`** - Clear logs for a server

---

## 🚀 Quick Start

### Initial Database Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with test data
npm run seed
```

This creates:
- 3 Plans (Free, Pro, Enterprise)
- 2 Elasticsearch Hosts (EU, US)
- 4 Test Users (including test@example.com)
- 3 Servers
- Log Buckets for each server
- API Keys

### Test Credentials

After seeding, you can log in with:

```
Email: test@example.com
Password: password123

Other test accounts:
- admin@vault5.dev : password123
- john@vault5.dev : password123
- jane@vault5.dev : password123
```

---

## 🗄️ Seeding Database

### Full Database Reset & Seed

```bash
npm run seed
```

**⚠️ Warning:** This will:
- Delete ALL existing data
- Create fresh test data
- Generate new server IDs

**What gets created:**

| Entity | Count | Description |
|--------|-------|-------------|
| Plans | 3 | Free (7d), Pro (30d), Enterprise (90d) |
| Elasticsearch Hosts | 2 | EU1 and US1 regions |
| Users | 4 | Test accounts with bcrypt passwords |
| Servers | 3 | Production, Dev, Personal |
| Server Members | 3 | Shared access configurations |
| Log Buckets | 4+ | Application, Errors, Access, Debug |
| API Keys | 3 | Various permission levels |

---

## 📊 Managing Logs

### Seed FiveM Logs

Add realistic FiveM server logs to a specific server:

```bash
# Seed 200 logs for your server
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 200

# Seed 500 logs
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 500
```

**Log Types Generated:**
- Player connections/disconnections
- Anticheat events
- Admin actions
- Transactions (purchases, sales)
- Chat messages
- General server events

**Buckets Used:**
- `General` - Server events, connections
- `Anticheat` - Cheat detection, suspicious activity
- `Admin` - Admin commands, moderation
- `Transactions` - In-game purchases, economy
- `Chat` - Player chat messages

### Clear Logs

Remove all logs from a specific server:

```bash
npx tsx clear-logs.ts srv_emxy0tr14x
```

**⚠️ Warning:** This permanently deletes all logs in Elasticsearch for the specified server.

---

## 🔍 Finding Your Server ID

### Method 1: Check the Database

```bash
# Run this in the vault5-db folder
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const servers = await prisma.server.findMany({ 
  include: { owner: true, plan: true } 
});
console.table(servers.map(s => ({ 
  id: s.id, 
  name: s.name, 
  owner: s.owner.email,
  plan: s.plan.displayName 
})));
await prisma.\$disconnect();
"
```

### Method 2: Check the Frontend

1. Log in to your account (test@example.com)
2. Go to **Dashboard** or any server page
3. Look at the URL: `http://localhost:3000/server/srv_emxy0tr14x/dashboard`
4. The server ID is: `srv_emxy0tr14x`

### Method 3: Use the Browser Console

```javascript
// In browser console on any server page
console.log(window.location.pathname.split('/')[2])
```

---

## 🔄 Common Workflows

### Starting Fresh

Reset everything and start with clean data:

```bash
# 1. Clear and reseed the database
npm run seed

# 2. Note the server IDs from the output
# Example output: ✓ Created 3 servers
#   - srv_abc123xyz (Production API)
#   - srv_def456uvw (Development Environment)
#   - srv_ghi789rst (Personal Project)

# 3. Seed logs for the test@example.com server
# First, find which server test@example.com owns
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ 
  where: { email: 'test@example.com' },
  include: { ownedServers: true }
});
console.log('Your servers:', user?.ownedServers);
await prisma.\$disconnect();
"

# 4. Use the server ID to seed logs
npx tsx seed-fivem-logs.ts <YOUR_SERVER_ID> 200
```

### Adding More Logs to Existing Server

```bash
# Clear old logs (optional)
npx tsx clear-logs.ts srv_emxy0tr14x

# Seed fresh logs
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 300
```

### Testing Different Log Volumes

```bash
# Small dataset (testing)
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 50

# Medium dataset (development)
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 200

# Large dataset (stress testing)
npx tsx seed-fivem-logs.ts srv_emxy0tr14x 1000
```

### Updating Server IDs in Scripts

If you need to update the hardcoded server ID in scripts:

```bash
# Find all occurrences
grep -r "srv_emxy0tr14x" .

# Edit the files (example for seed-fivem-logs.ts)
# Change this line:
const serverId = process.argv[2] || "srv_emxy0tr14x";

# To your new server ID:
const serverId = process.argv[2] || "srv_NEW_ID_HERE";
```

---

## 🔧 Troubleshooting

### Server Not Found Error

```
Error: Server srv_emxy0tr14x not found
```

**Solution:** Run `npm run seed` to recreate servers, then use the new server ID.

### Logs Not Showing in Frontend

1. **Check server ID matches:**
   ```bash
   npx tsx -e "
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   const server = await prisma.server.findUnique({ 
     where: { id: 'srv_emxy0tr14x' },
     include: { owner: true }
   });
   console.log(server);
   await prisma.\$disconnect();
   "
   ```

2. **Verify logs were created:**
   - Check the vault5-api terminal for Elasticsearch errors
   - Ensure vault5-api is running (`cd vault5-api && npm run dev`)

3. **Check user has access:**
   ```bash
   npx tsx -e "
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   const user = await prisma.user.findUnique({ 
     where: { email: 'test@example.com' },
     include: { ownedServers: true, serverMembers: true }
   });
   console.log('Owned servers:', user?.ownedServers);
   console.log('Member of:', user?.serverMembers);
   await prisma.\$disconnect();
   "
   ```

### Elasticsearch Connection Failed

Make sure the Elasticsearch service is running:

```bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Start infrastructure (if using docker-compose)
cd vault5-infra/local
docker-compose up -d elasticsearch
```

---

## 📚 Schema Information

### Plans

| Plan | Retention | Price | Features |
|------|-----------|-------|----------|
| Free | 7 days | $0 | 1GB storage, Basic search |
| Pro | 30 days | $29.99 | 50GB storage, Advanced search, Alerts |
| Enterprise | 90 days | $99.99 | Unlimited storage, SSO, Priority support |

### Log Bucket Retention

Bucket retention is **limited by the server's plan**:
- Free plan: Max 7 days
- Pro plan: Max 30 days
- Enterprise plan: Max 90 days

You can set bucket retention lower than the plan limit, but not higher.

---

## 🤝 Contributing

When adding new seed scripts:

1. Use `process.argv` for command-line arguments
2. Include error handling and validation
3. Add documentation to this README
4. Use TypeScript for type safety
5. Log progress with clear messages

---

## 📝 Notes

- All timestamps are in UTC
- Server IDs follow the format `srv_XXXXXXXXXX`
- API keys follow the format `vk_XXXXXXXXXXXXXXXX`
- Passwords are hashed with bcrypt (10 rounds)
- Logs are stored in Elasticsearch data streams by region and plan

---

## 🆘 Need Help?

- Check the main project README
- Review the Prisma schema: `prisma/schema.prisma`
- Check vault5-api logs for Elasticsearch errors
- Verify all services are running (frontend, api, postgres, elasticsearch)

---

## 📋 Quick Reference

### Most Common Commands

```bash
# Reset everything and start fresh
npm run seed

# List all servers and their IDs
npm run list:servers

# Seed 200 FiveM logs for a server
npm run seed:logs srv_emxy0tr14x 200

# Clear all logs for a server
npm run clear:logs srv_emxy0tr14x
```

### Environment Variables

The scripts use these environment variables (with defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `ELASTICSEARCH_HOST` | `localhost` | Elasticsearch host |
| `ELASTICSEARCH_PORT` | `9200` | Elasticsearch port |
| `ELASTICSEARCH_USERNAME` | `elastic` | Elasticsearch username |
| `ELASTICSEARCH_PASSWORD` | `changeme` | Elasticsearch password |
| `DATABASE_URL` | From .env | PostgreSQL connection string |

### File Overview

| File | Purpose |
|------|---------|
| `seed.ts` | Full database reset and seed with test data |
| `seed-fivem-logs.ts` | Generate realistic FiveM logs |
| `clear-logs.ts` | Delete all logs for a server |
| `list-servers.ts` | List all servers with their IDs and details |
| `prisma/schema.prisma` | Database schema definition |
| `package.json` | NPM scripts and dependencies |

### Important IDs Format

- **Server IDs:** `srv_XXXXXXXXXX` (e.g., `srv_emxy0tr14x`)
- **API Keys:** `vk_XXXXXXXXXXXXXXXX` (e.g., `vk_abc123xyz456`)
- **User IDs:** Generated by Prisma (cuid)
- **Plan IDs:** Generated by nanoid (12 chars)

---

## 🔗 Related Documentation

- [Vault5 Frontend README](../vault5-frontend/README.md)
- [Vault5 API README](../vault5-api/README.md)
- [Vault5 Infrastructure](../vault5-infra/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Elasticsearch Documentation](https://www.elastic.co/guide/)

