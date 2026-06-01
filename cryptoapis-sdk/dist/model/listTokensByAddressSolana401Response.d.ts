import { ListTokensByAddressSolanaE401 } from './listTokensByAddressSolanaE401';
export declare class ListTokensByAddressSolana401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensByAddressSolanaE401;
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
