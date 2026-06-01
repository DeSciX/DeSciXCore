import { ActivateBlockchainEventSubscriptionE401 } from './activateBlockchainEventSubscriptionE401';
export declare class ActivateBlockchainEventSubscription401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateBlockchainEventSubscriptionE401;
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
