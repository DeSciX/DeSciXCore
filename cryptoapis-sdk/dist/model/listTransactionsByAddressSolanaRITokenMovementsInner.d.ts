export declare class ListTransactionsByAddressSolanaRITokenMovementsInner {
    'amount': string;
    'contractAddress': string;
    'recipientAddress': string;
    'recipientTokenAddress'?: string;
    'senderAddress': string;
    'senderTokenAddress'?: string;
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
