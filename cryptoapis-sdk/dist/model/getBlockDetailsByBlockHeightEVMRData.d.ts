import { GetBlockDetailsByBlockHeightEVMRI } from './getBlockDetailsByBlockHeightEVMRI';
export declare class GetBlockDetailsByBlockHeightEVMRData {
    'item': GetBlockDetailsByBlockHeightEVMRI;
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
