import { GetTokenDetailsByContractAddressSolanaE403 } from './getTokenDetailsByContractAddressSolanaE403';
export declare class GetTokenDetailsByContractAddressSolana403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTokenDetailsByContractAddressSolanaE403;
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
