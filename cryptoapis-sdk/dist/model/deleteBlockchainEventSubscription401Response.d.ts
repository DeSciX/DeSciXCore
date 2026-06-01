import { DeleteBlockchainEventSubscriptionE401 } from './deleteBlockchainEventSubscriptionE401';
export declare class DeleteBlockchainEventSubscription401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteBlockchainEventSubscriptionE401;
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
