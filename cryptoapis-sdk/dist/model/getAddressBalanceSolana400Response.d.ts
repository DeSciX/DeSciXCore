import { GetAddressBalanceSolanaE400 } from './getAddressBalanceSolanaE400';
export declare class GetAddressBalanceSolana400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressBalanceSolanaE400;
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
