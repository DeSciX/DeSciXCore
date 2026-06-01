import { GetTokenDetailsByContractAddressSolanaE400 } from './getTokenDetailsByContractAddressSolanaE400';
export declare class GetTokenDetailsByContractAddressSolana400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTokenDetailsByContractAddressSolanaE400;
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
