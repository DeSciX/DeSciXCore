import { GetNextAvailableNonceEVME403 } from './getNextAvailableNonceEVME403';
export declare class GetNextAvailableNonceEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetNextAvailableNonceEVME403;
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
