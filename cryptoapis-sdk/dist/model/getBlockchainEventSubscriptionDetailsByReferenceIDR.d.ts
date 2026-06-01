import { GetBlockchainEventSubscriptionDetailsByReferenceIDRData } from './getBlockchainEventSubscriptionDetailsByReferenceIDRData';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceIDR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetBlockchainEventSubscriptionDetailsByReferenceIDRData;
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
