/**
 * PubSub publisher - minimal wrapper for publishing JSON messages.
 */

import { PubSub } from '@google-cloud/pubsub';

let _pubsub = null;

function getPubSub() {
    if (!_pubsub) _pubsub = new PubSub();
    return _pubsub;
}

/**
 * Publish a message to a Pub/Sub topic.
 * @param {string} topicName - Topic name
 * @param {Object} messageData - Data to publish (will be JSON.stringified)
 */
export async function publishMessage(topicName, messageData) {
    if (!topicName) {
        console.error("Pub/Sub topic name is missing.");
        return;
    }
    const dataBuffer = Buffer.from(JSON.stringify(messageData));
    try {
        await getPubSub().topic(topicName).publishMessage({ data: dataBuffer });
    } catch (error) {
        console.error(`Received error while publishing to ${topicName}: ${error.message}`);
    }
}
