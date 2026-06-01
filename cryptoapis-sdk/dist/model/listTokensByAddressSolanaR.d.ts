import { ListTokensByAddressSolanaRData } from './listTokensByAddressSolanaRData';
export declare class ListTokensByAddressSolanaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTokensByAddressSolanaRData;
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
