import { GetBlockDetailsByBlockHashEVME403 } from './getBlockDetailsByBlockHashEVME403';
export declare class GetBlockDetailsByBlockHashEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashEVME403;
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
