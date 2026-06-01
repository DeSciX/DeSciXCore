import { BlockchainDataTokenDetailsNotFound } from './blockchainDataTokenDetailsNotFound';
export declare class GetTokenDetailsByContractAddressSolana404Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BlockchainDataTokenDetailsNotFound;
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
