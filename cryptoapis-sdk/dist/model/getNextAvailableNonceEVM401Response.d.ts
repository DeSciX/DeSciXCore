import { GetNextAvailableNonceEVME401 } from './getNextAvailableNonceEVME401';
export declare class GetNextAvailableNonceEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetNextAvailableNonceEVME401;
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
