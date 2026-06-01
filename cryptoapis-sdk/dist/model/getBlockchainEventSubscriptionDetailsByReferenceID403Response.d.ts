import { GetBlockchainEventSubscriptionDetailsByReferenceIDE403 } from './getBlockchainEventSubscriptionDetailsByReferenceIDE403';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceID403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockchainEventSubscriptionDetailsByReferenceIDE403;
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
