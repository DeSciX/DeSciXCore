import { GetBlockchainEventSubscriptionDetailsByReferenceIDE400 } from './getBlockchainEventSubscriptionDetailsByReferenceIDE400';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceID400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockchainEventSubscriptionDetailsByReferenceIDE400;
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
