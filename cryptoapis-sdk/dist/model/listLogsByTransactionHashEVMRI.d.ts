export declare class ListLogsByTransactionHashEVMRI {
    'address': string;
    'data': string;
    'isRemoved': boolean;
    'name'?: string;
    'topics': Array<string>;
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
