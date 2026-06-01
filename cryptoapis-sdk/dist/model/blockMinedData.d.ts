import { BlockMinedDataItem } from './blockMinedDataItem';
export declare class BlockMinedData {
    'product': string;
    'event': string;
    'item': BlockMinedDataItem;
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
