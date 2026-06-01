export declare class GetBlockDetailsByBlockHeightUTXOsRI {
    'bits': number;
    'chainwork': number;
    'difficulty': number;
    'hash': string;
    'height': number;
    'merkleRoot': string;
    'nextBlockHash': string;
    'previousBlockHash': string;
    'size': number;
    'timestamp': number;
    'transactionsCount': number;
    'version': number;
    'strippedSize': number;
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
