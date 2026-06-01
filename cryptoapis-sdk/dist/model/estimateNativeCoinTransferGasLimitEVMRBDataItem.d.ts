export declare class EstimateNativeCoinTransferGasLimitEVMRBDataItem {
    'additionalData'?: string;
    'amount': string;
    'recipient': string;
    'sender': string;
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
