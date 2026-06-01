export declare class EstimateTransferFeeTezosRBDataItem {
    'amount': string;
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
