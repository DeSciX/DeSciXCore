export declare class PrepareAFungibleTokenTransferFromAddressEVMRIFee {
    'gasPrice': number;
    'maxFeePerGas': number;
    'maxPriorityFeePerGas': number;
    'unit': string;
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
