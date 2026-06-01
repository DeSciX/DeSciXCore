import { GetAddressBalanceSolanaRData } from './getAddressBalanceSolanaRData';
export declare class GetAddressBalanceSolanaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressBalanceSolanaRData;
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
