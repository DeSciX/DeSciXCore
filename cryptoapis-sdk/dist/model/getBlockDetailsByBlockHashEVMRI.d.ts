export declare class GetBlockDetailsByBlockHashEVMRI {
    'hash': string;
    'height': number;
    'nextBlockHash': string;
    'previousBlockHash': string;
    'size': number;
    'timestamp': number;
    'transactionsCount': number;
    'extraData': string;
    'gasLimit': number;
    'gasUsed': number;
    'minedInSeconds': number;
    'nonce': number;
    'totalDifficulty': number;
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
