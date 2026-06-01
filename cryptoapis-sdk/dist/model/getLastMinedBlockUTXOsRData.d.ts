import { GetLastMinedBlockUTXOsRI } from './getLastMinedBlockUTXOsRI';
export declare class GetLastMinedBlockUTXOsRData {
    'item': GetLastMinedBlockUTXOsRI;
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
