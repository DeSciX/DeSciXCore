import { SimulateEthereumTransactionsE400 } from './simulateEthereumTransactionsE400';
export declare class SimulateEthereumTransactions400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SimulateEthereumTransactionsE400;
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
