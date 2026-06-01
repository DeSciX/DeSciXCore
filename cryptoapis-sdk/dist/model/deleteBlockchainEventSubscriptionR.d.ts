import { DeleteBlockchainEventSubscriptionRData } from './deleteBlockchainEventSubscriptionRData';
export declare class DeleteBlockchainEventSubscriptionR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeleteBlockchainEventSubscriptionRData;
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
