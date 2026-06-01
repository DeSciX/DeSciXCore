export declare class SimulateEthereumTransactionsRBDataItem {
    'amount': string;
    'gasLimit': number;
    'gasPrice'?: string;
    'inputData'?: string;
    'maxFeePerGas'?: string;
    'maxPriorityFeePerGas'?: string;
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
