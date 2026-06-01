import { ListTokensByAddressSyncedEVMRData } from './listTokensByAddressSyncedEVMRData';
export declare class ListTokensByAddressSyncedEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTokensByAddressSyncedEVMRData;
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
