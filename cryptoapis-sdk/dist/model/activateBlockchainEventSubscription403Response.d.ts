import { ActivateBlockchainEventSubscriptionE403 } from './activateBlockchainEventSubscriptionE403';
export declare class ActivateBlockchainEventSubscription403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateBlockchainEventSubscriptionE403;
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
