import { GetBlockDetailsByBlockHashUTXOsRI } from './getBlockDetailsByBlockHashUTXOsRI';
export declare class GetBlockDetailsByBlockHashUTXOsRData {
    'item': GetBlockDetailsByBlockHashUTXOsRI;
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
