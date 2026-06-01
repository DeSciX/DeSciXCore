import { GetAddressStatisticsUTXOsRI } from './getAddressStatisticsUTXOsRI';
export declare class GetAddressStatisticsUTXOsRData {
    'item': GetAddressStatisticsUTXOsRI;
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
