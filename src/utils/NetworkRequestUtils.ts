class NetworkRequestUtils {
    static async fetchWithRetry(url: string, lichessAccessToken: string, auth = false, options: RequestInit = {}, retryDelay = 60_000, maxRetries = 3): Promise<Response> {
        if (auth) {
            options.headers = {
                ...options.headers, // Preserve any existing headers
                'Authorization': `Bearer ${lichessAccessToken}`,
            };
        }

        for (let i = 0; i < maxRetries; i++) {
            const response = await fetch(url, options).catch(() => undefined);
            if (response && response.status !== 429) {
                return response;
            }
            // If we received a 429 status, wait for retryDelay milliseconds and try again
            await new Promise(resolve => setTimeout(resolve, retryDelay + 1_000 * i));
        }
        throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
    }
}

export default NetworkRequestUtils;
