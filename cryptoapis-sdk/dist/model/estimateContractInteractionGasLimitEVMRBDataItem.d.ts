export declare class EstimateContractInteractionGasLimitEVMRBDataItem {
    'amount': string;
    'inputData': string;
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
