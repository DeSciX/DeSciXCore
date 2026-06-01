import { ActivateBlockchainEventSubscriptionE400 } from './activateBlockchainEventSubscriptionE400';
export declare class ActivateBlockchainEventSubscription400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateBlockchainEventSubscriptionE400;
    static discriminator: string | undefined;
    static attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
    }[];
}
