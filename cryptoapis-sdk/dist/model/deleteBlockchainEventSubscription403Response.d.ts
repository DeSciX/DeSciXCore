import { DeleteBlockchainEventSubscriptionE403 } from './deleteBlockchainEventSubscriptionE403';
export declare class DeleteBlockchainEventSubscription403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteBlockchainEventSubscriptionE403;
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
