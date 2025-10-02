/**
 * Vault5 FiveM Log Seeding Script
 * 
 * Seeds realistic FiveM server logs into Elasticsearch for testing and development.
 * 
 * Usage:
 *   npx tsx seed-fivem-logs.ts <serverId> [count]
 * 
 * Examples:
 *   npx tsx seed-fivem-logs.ts srv_emxy0tr14x 200
 *   npx tsx seed-fivem-logs.ts srv_abc123xyz 500
 * 
 * Default server ID: srv_emxy0tr14x (change on line 327 if needed)
 * Default count: 200 logs
 * 
 * Generated Log Types:
 *   - Player events (connect, disconnect, spawn, death)
 *   - Vehicle events (spawn, destroy, enter, exit)
 *   - Weapons and combat
 *   - Chat messages
 *   - Admin actions and bans
 *   - Transactions and economy
 *   - Anticheat events
 *   - Resource management
 * 
 * Buckets:
 *   - General: Server events, connections, spawns
 *   - Anticheat: Cheat detection, suspicious activity
 *   - Admin: Moderation, bans, admin commands
 *   - Transactions: Purchases, sales, economy events
 *   - Chat: Player chat messages
 */

import { PrismaClient } from "@prisma/client";
import { Client } from "@elastic/elasticsearch";

const prisma = new PrismaClient();

// FiveM log levels
const logLevels = ["info", "warn", "error", "debug"];

// FiveM-specific actions
const actions = [
  "player_connected",
  "player_disconnected",
  "player_spawned",
  "player_died",
  "vehicle_spawned",
  "vehicle_destroyed",
  "weapon_equipped",
  "chat_message",
  "command_executed",
  "resource_started",
  "resource_stopped",
  "admin_action",
  "transaction",
  "anticheat_triggered",
  "server_error",
];

// Player names for more realistic logs
const playerNames = [
  "John_Doe", "Jane_Smith", "Mike_Wilson", "Sarah_Johnson", "Chris_Brown",
  "Emily_Davis", "Alex_Miller", "Jessica_Garcia", "Daniel_Martinez", "Ashley_Rodriguez",
  "Michael_Anderson", "Lisa_Taylor", "Kevin_Thomas", "Amanda_Hernandez", "Brian_Moore"
];

// Vehicle models
const vehicles = [
  "adder", "zentorno", "t20", "osiris", "entityxf", "turismor", "infernus",
  "bullet", "cheetah", "voltic", "comet", "banshee", "sultanrs", "elegy",
  "police", "police2", "police3", "sheriff", "fbi", "ambulance", "firetruk"
];

// Weapons
const weapons = [
  "weapon_pistol", "weapon_combatpistol", "weapon_smg", "weapon_microsmg",
  "weapon_assaultrifle", "weapon_carbinerifle", "weapon_shotgun", "weapon_knife",
  "weapon_bat", "weapon_crowbar", "weapon_stungun", "weapon_nightstick"
];

// Admin actions
const adminActions = [
  "kick", "ban", "teleport", "give_money", "revive", "freeze", "spectate",
  "heal", "armor", "noclip", "godmode", "clear_wanted"
];

// Resources
const resources = [
  "esx_core", "esx_ambulancejob", "esx_policejob", "esx_society", "esx_garage",
  "esx_weaponshop", "esx_cardealer", "esx_jobs", "esx_banking", "loadingscreen"
];

function getRandomPlayer() {
  const id = Math.floor(Math.random() * 128) + 1;
  const name = playerNames[Math.floor(Math.random() * playerNames.length)];
  return { id, name };
}

function getRandomCoords() {
  return {
    x: (Math.random() * 8000 - 4000).toFixed(2),
    y: (Math.random() * 8000 - 4000).toFixed(2),
    z: (Math.random() * 1000).toFixed(2)
  };
}

function generateFiveMLog(action: string, serverId: string, bucket: string) {
  const level = action.includes("error") || action === "anticheat_triggered"
    ? "error"
    : action.includes("warn") || action === "player_died"
      ? "warn"
      : "info";

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const timestamp = new Date(sevenDaysAgo + Math.random() * (now - sevenDaysAgo));

  const player = getRandomPlayer();
  const coords = getRandomCoords();

  let message = "";
  let metadata: any = { action };

  switch (action) {
    case "player_connected":
      message = `Player ${player.name} connected to the server`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        identifiers: [
          `steam:${Math.random().toString(36).substring(7).toUpperCase()}`,
          `license:${Math.random().toString(36).substring(7)}`
        ],
        endpoint: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${30000 + Math.floor(Math.random() * 100)}`
      };
      break;

    case "player_disconnected":
      message = `Player ${player.name} disconnected from the server`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        reason: ["Quit", "Connection lost", "Kicked", "Timeout"][Math.floor(Math.random() * 4)],
        playTime: `${Math.floor(Math.random() * 300)}m ${Math.floor(Math.random() * 60)}s`
      };
      break;

    case "player_spawned":
      message = `Player ${player.name} spawned at coordinates`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        coords,
        health: 200,
        armor: Math.floor(Math.random() * 100)
      };
      break;

    case "player_died":
      const killer = getRandomPlayer();
      message = `Player ${player.name} was killed`;
      metadata = {
        ...metadata,
        victim: player.name,
        victimSource: player.id,
        killer: killer.name,
        killerSource: killer.id,
        weapon: weapons[Math.floor(Math.random() * weapons.length)],
        coords,
        distance: `${Math.floor(Math.random() * 100)}m`
      };
      break;

    case "vehicle_spawned":
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      message = `Player ${player.name} spawned vehicle ${vehicle}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        vehicle,
        coords,
        plate: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      };
      break;

    case "vehicle_destroyed":
      message = `Vehicle destroyed`;
      metadata = {
        ...metadata,
        vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
        coords,
        cause: ["explosion", "fire", "water", "collision"][Math.floor(Math.random() * 4)]
      };
      break;

    case "weapon_equipped":
      const weapon = weapons[Math.floor(Math.random() * weapons.length)];
      message = `Player ${player.name} equipped ${weapon}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        weapon,
        ammo: Math.floor(Math.random() * 250)
      };
      break;

    case "chat_message":
      const messages = [
        "Anyone want to race?",
        "Where's the gun shop?",
        "Can someone help me?",
        "GG that was close!",
        "Admin online?",
        "Server lagging a bit",
        "Thanks for the help!",
        "Looking for crew members"
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      message = `[CHAT] ${player.name}: ${msg}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        chatMessage: msg,
        channel: "global"
      };
      break;

    case "command_executed":
      const commands = ["/help", "/car", "/tp", "/heal", "/kill", "/givemoney", "/inventory", "/job"];
      const cmd = commands[Math.floor(Math.random() * commands.length)];
      message = `Player ${player.name} executed command ${cmd}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        command: cmd,
        success: Math.random() > 0.1
      };
      break;

    case "resource_started":
      const resource = resources[Math.floor(Math.random() * resources.length)];
      message = `Resource ${resource} started successfully`;
      metadata = {
        ...metadata,
        resource,
        loadTime: `${Math.floor(Math.random() * 500)}ms`
      };
      break;

    case "resource_stopped":
      const stoppedResource = resources[Math.floor(Math.random() * resources.length)];
      message = `Resource ${stoppedResource} stopped`;
      metadata = {
        ...metadata,
        resource: stoppedResource,
        reason: ["manual", "error", "restart"][Math.floor(Math.random() * 3)]
      };
      break;

    case "admin_action":
      const admin = getRandomPlayer();
      const target = getRandomPlayer();
      const adminAction = adminActions[Math.floor(Math.random() * adminActions.length)];
      message = `Admin ${admin.name} performed ${adminAction} on ${target.name}`;
      metadata = {
        ...metadata,
        admin: admin.name,
        adminSource: admin.id,
        target: target.name,
        targetSource: target.id,
        adminAction,
        reason: "Admin discretion"
      };
      break;

    case "transaction":
      const amount = Math.floor(Math.random() * 100000);
      message = `Player ${player.name} transaction: $${amount}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        amount,
        type: ["purchase", "sale", "transfer", "salary", "fine"][Math.floor(Math.random() * 5)],
        item: ["Vehicle", "Weapon", "Property", "Item", "Service"][Math.floor(Math.random() * 5)],
        balance: Math.floor(Math.random() * 500000)
      };
      break;

    case "anticheat_triggered":
      message = `ANTICHEAT: Suspicious activity detected from ${player.name}`;
      metadata = {
        ...metadata,
        playerName: player.name,
        playerSource: player.id,
        violation: ["Speed hack", "God mode", "Teleport", "Weapon spawn", "Money inject"][Math.floor(Math.random() * 5)],
        severity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)],
        coords,
        actionTaken: ["warned", "kicked", "banned", "logged"][Math.floor(Math.random() * 4)]
      };
      break;

    case "server_error":
      const errors = [
        "Database connection timeout",
        "Resource script error",
        "Memory leak detected",
        "Network packet loss",
        "Failed to load asset"
      ];
      message = `SERVER ERROR: ${errors[Math.floor(Math.random() * errors.length)]}`;
      metadata = {
        ...metadata,
        errorType: "runtime",
        resource: resources[Math.floor(Math.random() * resources.length)],
        stackTrace: `Error at line ${Math.floor(Math.random() * 1000)}`
      };
      break;
  }

  return {
    "@timestamp": timestamp.toISOString(),
    level,
    message,
    metadata,
    data: {
      serverUptime: `${Math.floor(Math.random() * 72)}h ${Math.floor(Math.random() * 60)}m`,
      activePlayers: Math.floor(Math.random() * 128),
      serverPerformance: {
        cpu: `${Math.floor(Math.random() * 100)}%`,
        memory: `${Math.floor(Math.random() * 8192)}MB`,
        fps: Math.floor(Math.random() * 30) + 30
      }
    },
    serverId,
    bucket,
  };
}

async function main() {
  // ⚙️ CHANGE DEFAULT SERVER ID HERE if needed
  const serverId = process.argv[2] || "srv_emxy0tr14x";
  const logsCount = parseInt(process.argv[3]) || 200;

  console.log(`🎮 Seeding ${logsCount} FiveM logs for server: ${serverId}\n`);

  // Get Elasticsearch connection
  const esHost = process.env.ELASTICSEARCH_HOST || "localhost";
  const esPort = process.env.ELASTICSEARCH_PORT || "9200";
  const esUsername = process.env.ELASTICSEARCH_USERNAME || "elastic";
  const esPassword = process.env.ELASTICSEARCH_PASSWORD || "changeme";

  const esClient = new Client({
    node: `http://${esHost}:${esPort}`,
    auth: { username: esUsername, password: esPassword },
  });

  // Test connection
  try {
    const health = await esClient.cluster.health();
    console.log(`✓ Elasticsearch cluster status: ${health.status}`);
  } catch (error) {
    console.error("❌ Failed to connect to Elasticsearch:", error);
    return;
  }

  // Get server details
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      logBuckets: true,
      elasticsearchHost: true,
      plan: true,
    },
  });

  if (!server) {
    console.error(`❌ Server ${serverId} not found`);
    return;
  }

  const buckets = server.logBuckets.length > 0
    ? server.logBuckets.map((b) => b.name)
    : ["default"];

  const dataStream = `${server.elasticsearchHost.region}-logs-${server.plan.name.toLowerCase()}`;

  console.log(`📝 Server: ${server.name}`);
  console.log(`   Data Stream: ${dataStream}`);
  console.log(`   Buckets: ${buckets.join(", ")}\n`);

  // Generate FiveM logs
  for (let i = 0; i < logsCount; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];

    // Assign logs to appropriate buckets based on action type
    let bucket = "General"; // default
    if (buckets.includes("Anticheat") && action === "anticheat_triggered") {
      bucket = "Anticheat";
    } else if (buckets.includes("Admin") && action === "admin_action") {
      bucket = "Admin";
    } else if (buckets.includes("Transactions") && action === "transaction") {
      bucket = "Transactions";
    } else if (buckets.includes("Chat") && (action === "chat_message" || action === "command_executed")) {
      bucket = "Chat";
    } else {
      bucket = buckets[Math.floor(Math.random() * buckets.length)];
    }

    const log = generateFiveMLog(action, server.id, bucket);

    try {
      await esClient.index({
        index: dataStream,
        document: log,
      });
    } catch (error) {
      console.error(`   ✗ Failed to index log:`, error);
    }

    if ((i + 1) % 50 === 0) {
      console.log(`   ✓ Indexed ${i + 1}/${logsCount} logs`);
    }
  }

  console.log(`\n✅ Successfully seeded ${logsCount} FiveM logs!`);
  console.log(`\n💡 View them at: http://localhost:3000/server/${serverId}/logs`);
  console.log(`\n🎮 Log types generated:`);
  console.log(`   • Player events (connect, spawn, death)`);
  console.log(`   • Vehicle events (spawn, destroy)`);
  console.log(`   • Chat messages & commands`);
  console.log(`   • Admin actions`);
  console.log(`   • Transactions`);
  console.log(`   • Anti-cheat alerts`);
  console.log(`   • Server errors & resources`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

