export declare class VerifyAddressRISourcesInner {
    'categories'?: Array<string>;
    'label'?: string;
    'listingTimestamp': number;
    'provider': string;
    'sanctionPrograms'?: Array<string>;
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
