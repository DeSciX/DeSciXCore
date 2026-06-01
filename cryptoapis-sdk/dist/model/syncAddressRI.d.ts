export declare class SyncAddressRI {
    'address': string;
    'blockchain': string;
    'callcackUrl': string;
    'isActive'?: boolean;
    'network': string;
    'syncStatus': string;
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
