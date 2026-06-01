import { GetBlockDetailsByBlockHashEVME400 } from './getBlockDetailsByBlockHashEVME400';
export declare class GetBlockDetailsByBlockHashEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetBlockDetailsByBlockHashEVME400;
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
