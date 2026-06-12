export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { setupWorker } = await import('./lib/queue/redis');
        setupWorker();
    }
}
