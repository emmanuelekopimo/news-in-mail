export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEWSINMAIL_SCHEDULER === "off") return;
  if (process.env.NODE_ENV !== "production" && process.env.NEWSINMAIL_SCHEDULER !== "on") return;
  const { startScheduler } = await import("./server/scheduler");
  startScheduler();
}
