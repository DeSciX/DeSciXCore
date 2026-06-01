import { GetTokenDetailsByContractAddressSolanaRI } from './getTokenDetailsByContractAddressSolanaRI';
export declare class GetTokenDetailsByContractAddressSolanaRData {
    'item': GetTokenDetailsByContractAddressSolanaRI;
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
