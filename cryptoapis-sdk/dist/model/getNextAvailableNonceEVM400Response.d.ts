import { GetNextAvailableNonceEVME400 } from './getNextAvailableNonceEVME400';
export declare class GetNextAvailableNonceEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetNextAvailableNonceEVME400;
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
