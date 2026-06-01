import { SimulateEthereumTransactionsE403 } from './simulateEthereumTransactionsE403';
export declare class SimulateEthereumTransactions403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SimulateEthereumTransactionsE403;
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
