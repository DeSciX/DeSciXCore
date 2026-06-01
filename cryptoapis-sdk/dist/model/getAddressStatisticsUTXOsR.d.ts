import { GetAddressStatisticsUTXOsRData } from './getAddressStatisticsUTXOsRData';
export declare class GetAddressStatisticsUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressStatisticsUTXOsRData;
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
