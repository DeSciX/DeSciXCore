import { SimulateEthereumTransactionsE401 } from './simulateEthereumTransactionsE401';
export declare class SimulateEthereumTransactions401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SimulateEthereumTransactionsE401;
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
