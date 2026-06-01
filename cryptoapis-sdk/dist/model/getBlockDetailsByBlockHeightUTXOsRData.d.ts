import { GetBlockDetailsByBlockHeightUTXOsRI } from './getBlockDetailsByBlockHeightUTXOsRI';
export declare class GetBlockDetailsByBlockHeightUTXOsRData {
    'item': GetBlockDetailsByBlockHeightUTXOsRI;
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
