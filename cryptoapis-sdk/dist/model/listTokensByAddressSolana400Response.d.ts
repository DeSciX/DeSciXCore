import { ListTokensByAddressSolanaE400 } from './listTokensByAddressSolanaE400';
export declare class ListTokensByAddressSolana400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensByAddressSolanaE400;
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
