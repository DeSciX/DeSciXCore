export declare class EstimateFA12TransferFeeTezosRBDataItem {
    'amount': string;
    'contractAddress': string;
    'recipient': string;
    'sender': string;
    'senderPublicKey'?: string;
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
