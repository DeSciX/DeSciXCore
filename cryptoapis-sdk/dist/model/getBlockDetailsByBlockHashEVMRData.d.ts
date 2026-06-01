import { GetBlockDetailsByBlockHashEVMRI } from './getBlockDetailsByBlockHashEVMRI';
export declare class GetBlockDetailsByBlockHashEVMRData {
    'item': GetBlockDetailsByBlockHashEVMRI;
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
