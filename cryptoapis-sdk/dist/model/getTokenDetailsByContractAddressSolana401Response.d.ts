import { GetTokenDetailsByContractAddressSolanaE401 } from './getTokenDetailsByContractAddressSolanaE401';
export declare class GetTokenDetailsByContractAddressSolana401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTokenDetailsByContractAddressSolanaE401;
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
