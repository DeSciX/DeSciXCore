import { BlockMinedData } from './blockMinedData';
export declare class BlockMined {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': BlockMinedData;
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
