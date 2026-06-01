import { GetNextAvailableNonceEVMRData } from './getNextAvailableNonceEVMRData';
export declare class GetNextAvailableNonceEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetNextAvailableNonceEVMRData;
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
