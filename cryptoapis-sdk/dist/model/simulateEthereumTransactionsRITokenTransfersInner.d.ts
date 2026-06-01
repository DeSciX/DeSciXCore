import { SimulateEthereumTransactionsRITokenTransfersInnerTokenData } from './simulateEthereumTransactionsRITokenTransfersInnerTokenData';
export declare class SimulateEthereumTransactionsRITokenTransfersInner {
    'recipient': string;
    'sender': string;
    'tokenData': SimulateEthereumTransactionsRITokenTransfersInnerTokenData;
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
