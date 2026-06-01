import { GetAddressStatisticsUTXOsE401 } from './getAddressStatisticsUTXOsE401';
export declare class GetAddressStatisticsUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressStatisticsUTXOsE401;
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
