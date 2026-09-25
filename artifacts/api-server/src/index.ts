import app from "./app";
import { initDb } from "./lib/initDb.js";
import { scheduleDailyReport } from "./lib/telegram.js";
import { scheduleAutoCancel } from "./lib/scheduler.js";
import { scheduleWebhooks } from "./lib/webhooks.js";

const rawPort = process.env["PORT"] ?? "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      scheduleDailyReport();
      scheduleAutoCancel();
      scheduleWebhooks();
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err instanceof Error ? err.name : "UnknownError");
    process.exit(1);
  });
