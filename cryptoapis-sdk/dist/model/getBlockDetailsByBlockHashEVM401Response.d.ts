import { GetBlockDetailsByBlockHashEVME401 } from './getBlockDetailsByBlockHashEVME401';
export declare class GetBlockDetailsByBlockHashEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashEVME401;
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
