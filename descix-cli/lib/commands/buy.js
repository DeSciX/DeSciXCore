/**
 * Buy Commands
 * 
 * Commands for creating and managing crypto payment quotes.
 * Used for purchasing USDCX or Community tokens with cryptocurrency.
 */

import chalk from 'chalk';
import { DeSciXApiClient } from '../api-client.js';

/**
 * Create a crypto payment quote
 * @param {Object} options - Quote options
 */
export async function createQuote(options) {
    const apiClient = new DeSciXApiClient();
    
    const params = {
        usd_amount: parseFloat(options.amount),
        chain: options.chain.toLowerCase(),
        purchase_type: options.type || 'usdcx'
    };
    
    // Add optional email for guest mode
    if (options.email) {
        params.email = options.email;
    }
    
    // Add community_id if purchasing community tokens
    if (options.community) {
        params.community_id = options.community;
        params.purchase_type = 'community_token';
    }
    
    console.log(chalk.cyan(`Creating ${params.purchase_type} quote for $${params.usd_amount} via ${params.chain}...`));
    
    try {
        const response = await apiClient.invoke('create_crypto_quote', params, { allowGuest: true });
        
        // API returns { status, auth_status, message } where message contains the quote data
        const result = response?.message || response;
        
        if (!result?.quote_id) {
            throw new Error('Failed to create quote - no quote_id returned');
        }
        
        console.log(chalk.green('\n✓ Quote created successfully!\n'));
        console.log(chalk.bold('Quote Details:'));
        console.log(`  Quote ID:      ${chalk.yellow(result.quote_id)}`);
        console.log(`  Chain:         ${result.chain_name || result.chain}`);
        console.log(`  Amount:        ${result.amount_formatted || `${result.amount} ${result.asset}`}`);
        console.log(`  USD Value:     ${result.usd_amount_formatted || `$${result.usd_amount}`}`);
        console.log(`  Deposit Addr:  ${chalk.cyan(result.deposit_address)}`);
        console.log(`  Expires:       ${new Date(result.expires_at).toLocaleString()}`);
        
        console.log(chalk.bold('\nInstructions:'));
        console.log(`  1. Send exactly ${chalk.yellow(result.amount_formatted || `${result.amount} ${result.asset}`)} to the deposit address`);
        console.log(`  2. Wait for confirmation (the system will detect your payment)`);
        console.log(`  3. Check status with: ${chalk.cyan(`descix buy status ${result.quote_id}`)}`);
        
        return result;
    } catch (error) {
        console.error(chalk.red(`Error creating quote: ${error.message}`));
        throw error;
    }
}

/**
 * Check the status of a quote
 * @param {string} quoteId - Quote ID to check
 */
export async function checkStatus(quoteId) {
    const apiClient = new DeSciXApiClient();
    
    console.log(chalk.cyan(`Checking status of quote ${quoteId}...`));
    
    try {
        const response = await apiClient.invoke('get_quote_status', { quote_id: quoteId }, { allowGuest: true });
        
        // API returns { status, auth_status, message } where message contains the quote data
        const result = response?.message || response;
        
        if (!result) {
            console.log(chalk.red('Quote not found'));
            return null;
        }
        
        const statusColor = {
            'pending': chalk.yellow,
            'confirmed': chalk.green,
            'fulfilled': chalk.green.bold,
            'expired': chalk.red,
            'amount_mismatch': chalk.red,
            'failed': chalk.red
        }[result.status] || chalk.white;
        
        console.log(chalk.bold('\nQuote Status:'));
        console.log(`  Quote ID:      ${result.quote_id}`);
        console.log(`  Status:        ${statusColor(result.status.toUpperCase())}`);
        console.log(`  Chain:         ${result.chain_name || result.chain}`);
        console.log(`  Amount:        ${result.amount_formatted || `${result.crypto_amount || result.amount} ${result.asset || result.chain?.toUpperCase()}`}`);
        console.log(`  USD Value:     ${result.usd_amount_formatted || `$${result.usd_amount}`}`);
        console.log(`  Deposit Addr:  ${result.deposit_address || result.crypto_address}`);
        
        if (result.status === 'pending') {
            const expiresAt = new Date(result.expires_at);
            const now = new Date();
            const minutesLeft = Math.round((expiresAt - now) / 60000);
            
            if (minutesLeft > 0) {
                console.log(`  Expires in:    ${minutesLeft} minutes`);
            } else {
                console.log(`  Expires in:    ${chalk.red('EXPIRED')}`);
            }
            
            console.log(chalk.bold('\nWaiting for payment...'));
            console.log(`  Send ${chalk.yellow(result.amount_formatted || `${result.crypto_amount || result.amount} ${result.asset || result.chain?.toUpperCase()}`)} to:`);
            console.log(`  ${chalk.cyan(result.deposit_address || result.crypto_address)}`);
        } else if (result.status === 'fulfilled') {
            console.log(chalk.green('\n✓ Payment completed and credited!'));
            if (result.payment_tx_hash) {
                console.log(`  Transaction:   ${result.payment_tx_hash}`);
            }
        } else if (result.status === 'confirmed') {
            console.log(chalk.yellow('\n⏳ Payment detected, awaiting confirmation...'));
            if (result.confirmations_received) {
                console.log(`  Confirmations: ${result.confirmations_received}`);
            }
        } else if (result.status === 'amount_mismatch') {
            console.log(chalk.red('\n⚠ Amount mismatch detected'));
            if (result.actual_amount) {
                console.log(`  Expected: ${result.crypto_amount}, Received: ${result.actual_amount}`);
            }
        }
        
        return result;
    } catch (error) {
        console.error(chalk.red(`Error checking status: ${error.message}`));
        throw error;
    }
}

/**
 * Poll for quote status with exponential backoff
 * @param {string} quoteId - Quote ID to poll
 * @param {Object} options - Polling options
 */
export async function pollStatus(quoteId, options = {}) {
    const maxAttempts = options.maxAttempts || 120;
    const initialInterval = options.initialInterval || 5000;
    const maxInterval = options.maxInterval || 60000;
    
    let attempt = 0;
    let interval = initialInterval;
    
    console.log(chalk.cyan(`Polling for quote ${quoteId} status (Ctrl+C to stop)...`));
    
    while (attempt < maxAttempts) {
        try {
            const result = await checkStatus(quoteId);
            
            if (!result) {
                break;
            }
            
            if (['fulfilled', 'expired', 'failed', 'amount_mismatch'].includes(result.status)) {
                return result;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, interval));
            interval = Math.min(interval * 1.5, maxInterval);
            attempt++;
            
            console.log(chalk.dim(`\n--- Checking again (attempt ${attempt}/${maxAttempts}) ---`));
        } catch (error) {
            console.error(chalk.red(`Poll error: ${error.message}`));
            await new Promise(resolve => setTimeout(resolve, interval));
            attempt++;
        }
    }
    
    console.log(chalk.yellow('\nMax poll attempts reached. Check status manually.'));
    return null;
}

/**
 * List supported chains
 */
export function listChains() {
    console.log(chalk.bold('Supported chains for crypto payments:\n'));
    
    const chains = [
        { name: 'polygon', symbol: 'MATIC', description: 'Polygon (recommended - low fees)' },
        { name: 'ethereum', symbol: 'ETH', description: 'Ethereum mainnet' },
        { name: 'bnb', symbol: 'BNB', description: 'BNB Smart Chain' },
        { name: 'bitcoin', symbol: 'BTC', description: 'Bitcoin (coming soon)' },
        { name: 'dogecoin', symbol: 'DOGE', description: 'Dogecoin (coming soon)' }
    ];
    
    for (const chain of chains) {
        console.log(`  ${chalk.cyan(chain.name.padEnd(12))} ${chain.symbol.padEnd(6)} ${chain.description}`);
    }
    
    console.log(chalk.dim('\nNote: Bitcoin and Dogecoin support is coming soon.'));
}

