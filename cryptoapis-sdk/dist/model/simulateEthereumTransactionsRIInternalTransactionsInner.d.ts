import { SimulateEthereumTransactionsRIInternalTransactionsInnerValue } from './simulateEthereumTransactionsRIInternalTransactionsInnerValue';
export declare class SimulateEthereumTransactionsRIInternalTransactionsInner {
    'depth': number;
    'operationType': string;
    'recipient': string;
    'sender': string;
    'value': SimulateEthereumTransactionsRIInternalTransactionsInnerValue;
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
