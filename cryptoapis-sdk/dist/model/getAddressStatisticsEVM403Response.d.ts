import { GetAddressStatisticsEVME403 } from './getAddressStatisticsEVME403';
export declare class GetAddressStatisticsEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressStatisticsEVME403;
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
