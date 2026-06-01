import { GetBlockchainEventSubscriptionDetailsByReferenceIDRI } from './getBlockchainEventSubscriptionDetailsByReferenceIDRI';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceIDRData {
    'item': GetBlockchainEventSubscriptionDetailsByReferenceIDRI;
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
