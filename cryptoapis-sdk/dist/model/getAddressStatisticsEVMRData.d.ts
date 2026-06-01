import { GetAddressStatisticsEVMRI } from './getAddressStatisticsEVMRI';
export declare class GetAddressStatisticsEVMRData {
    'item': GetAddressStatisticsEVMRI;
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
