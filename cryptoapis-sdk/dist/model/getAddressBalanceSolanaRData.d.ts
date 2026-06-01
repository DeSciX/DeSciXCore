import { GetAddressBalanceSolanaRI } from './getAddressBalanceSolanaRI';
export declare class GetAddressBalanceSolanaRData {
    'item': GetAddressBalanceSolanaRI;
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
