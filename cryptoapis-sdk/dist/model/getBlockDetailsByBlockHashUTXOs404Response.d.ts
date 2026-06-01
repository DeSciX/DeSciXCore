import { BlockchainDataBlockNotFound } from './blockchainDataBlockNotFound';
export declare class GetBlockDetailsByBlockHashUTXOs404Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BlockchainDataBlockNotFound;
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
