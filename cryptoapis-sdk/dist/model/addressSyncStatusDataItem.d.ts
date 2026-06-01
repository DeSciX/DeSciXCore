export declare class AddressSyncStatusDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'status': AddressSyncStatusDataItem.StatusEnum;
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
export declare namespace AddressSyncStatusDataItem {
    enum StatusEnum {
        Syncing,
        Synced
    }
}
