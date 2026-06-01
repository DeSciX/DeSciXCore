export declare class ListLatestMinedBlocksEVMRI {
    'hash': string;
    'height': number;
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
