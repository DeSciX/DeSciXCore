import { SimulateEthereumTransactionsRI } from './simulateEthereumTransactionsRI';
export declare class SimulateEthereumTransactionsRData {
    'item': SimulateEthereumTransactionsRI;
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
