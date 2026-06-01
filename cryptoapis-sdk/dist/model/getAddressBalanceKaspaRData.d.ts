import { GetAddressBalanceKaspaRI } from './getAddressBalanceKaspaRI';
export declare class GetAddressBalanceKaspaRData {
    'item': GetAddressBalanceKaspaRI;
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
