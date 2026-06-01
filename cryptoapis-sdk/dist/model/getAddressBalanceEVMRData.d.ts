import { GetAddressBalanceEVMRI } from './getAddressBalanceEVMRI';
export declare class GetAddressBalanceEVMRData {
    'item': GetAddressBalanceEVMRI;
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
