export declare class GetBlockDetailsByBlockHashUTXOsRI {
    'bits': number;
    'chainwork': string;
    'difficulty': number;
    'merkleRoot': string;
    'size': number;
    'version'?: number;
    'hash': string;
    'height': number;
    'nextBlockHash': string;
    'previousBlockHash': string;
    'strippedSize': number;
    'timestamp': number;
    'transactionsCount': number;
    'versionHex': string;
    'weight': number;
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
