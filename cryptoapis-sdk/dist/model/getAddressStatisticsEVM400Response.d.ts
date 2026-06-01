import { GetAddressStatisticsEVME400 } from './getAddressStatisticsEVME400';
export declare class GetAddressStatisticsEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressStatisticsEVME400;
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
