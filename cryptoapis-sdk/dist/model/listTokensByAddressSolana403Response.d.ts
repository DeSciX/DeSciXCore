import { ListTokensByAddressSolanaE403 } from './listTokensByAddressSolanaE403';
export declare class ListTokensByAddressSolana403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensByAddressSolanaE403;
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
