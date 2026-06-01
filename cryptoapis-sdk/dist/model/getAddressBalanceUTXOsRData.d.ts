import { GetAddressBalanceUTXOsRI } from './getAddressBalanceUTXOsRI';
export declare class GetAddressBalanceUTXOsRData {
    'item': GetAddressBalanceUTXOsRI;
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
