import { NewBlockRBData } from './newBlockRBData';
export declare class NewBlockRB {
    'context'?: string;
    'data': NewBlockRBData;
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
