import { GetTokenDetailsByContractAddressSolanaRData } from './getTokenDetailsByContractAddressSolanaRData';
export declare class GetTokenDetailsByContractAddressSolanaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetTokenDetailsByContractAddressSolanaRData;
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
