/**
 * Service API Router
 * 
 * Routes incoming JSON commands to handlers.
 * Expects `_descix` context injected by the Core Broker.
 */

import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const apiRouter = express.Router();

// Command Registry
const commandRegistry = {
    // Dynamic loading will happen in the handler
    'sample_hello': 'sampleCommands.js',
    'sample_analyze': 'sampleCommands.js'
};

class ServiceCommandHandler {
    static async invoke(command, params) {
        // 1. Check registry
        const fileName = commandRegistry[command];
        if (!fileName) {
            throw new Error(`Unknown command: ${command}`);
        }

        // 2. Load module (simple dynamic import)
        try {
            const module = await import(`./commandHandlers/${fileName}`);
            const handler = module.commands[command];
            
            if (!handler) {
                throw new Error(`Handler not found for ${command} in ${fileName}`);
            }

            // 3. Execute
            // We pass params directly. The handler is responsible for using _descix context.
            return await handler(params);

        } catch (error) {
            console.error(`[CommandHandler] Error invoking ${command}:`, error);
            throw error;
        }
    }
}

// Main Route
apiRouter.post('/:command', async (req, res) => {
    const { command } = req.params;
    const params = req.body;

    // The Core Broker injects this context
    const context = params._descix;

    if (!context) {
        // In production, you might reject requests without context
        // In dev, we might allow direct calls
        console.warn(`[ApiFront] Warning: Request to ${command} missing _descix context`);
    }

    try {
        console.log(`[ApiFront] Received command: ${command}`);
        const result = await ServiceCommandHandler.invoke(command, params);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message
        });
    }
});

export default apiRouter;
