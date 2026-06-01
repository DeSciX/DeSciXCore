import { GetAddressBalanceEVMRData } from './getAddressBalanceEVMRData';
export declare class GetAddressBalanceEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressBalanceEVMRData;
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
