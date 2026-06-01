import { GetAddressStatisticsUTXOsE403 } from './getAddressStatisticsUTXOsE403';
export declare class GetAddressStatisticsUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressStatisticsUTXOsE403;
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
