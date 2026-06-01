import { ResourceNotFound } from './resourceNotFound';
export declare class GetBlockchainEventSubscriptionDetailsByReferenceID404Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ResourceNotFound;
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
