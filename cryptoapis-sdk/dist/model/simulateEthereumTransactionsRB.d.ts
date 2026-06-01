import { SimulateEthereumTransactionsRBData } from './simulateEthereumTransactionsRBData';
export declare class SimulateEthereumTransactionsRB {
    'context'?: string;
    'data': SimulateEthereumTransactionsRBData;
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
