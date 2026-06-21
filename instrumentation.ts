export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerStaleChecker } = await import('./lib/queue/redis');
    registerStaleChecker();
  }
}
