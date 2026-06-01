import { GetBlockchainEventSubscriptionDetailsByReferenceIDE401 } from './getBlockchainEventSubscriptionDetailsByReferenceIDE401';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceID401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockchainEventSubscriptionDetailsByReferenceIDE401;
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
