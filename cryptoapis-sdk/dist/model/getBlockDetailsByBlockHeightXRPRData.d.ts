import { GetBlockDetailsByBlockHeightXRPRI } from './getBlockDetailsByBlockHeightXRPRI';
export declare class GetBlockDetailsByBlockHeightXRPRData {
    'item': GetBlockDetailsByBlockHeightXRPRI;
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
