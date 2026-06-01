import { DeleteBlockchainEventSubscriptionE400 } from './deleteBlockchainEventSubscriptionE400';
export declare class DeleteBlockchainEventSubscription400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteBlockchainEventSubscriptionE400;
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
