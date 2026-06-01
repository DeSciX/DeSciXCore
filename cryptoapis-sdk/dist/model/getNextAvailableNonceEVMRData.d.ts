import { GetNextAvailableNonceEVMRI } from './getNextAvailableNonceEVMRI';
export declare class GetNextAvailableNonceEVMRData {
    'item': GetNextAvailableNonceEVMRI;
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
