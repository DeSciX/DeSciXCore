import { SimulateEthereumTransactionsRData } from './simulateEthereumTransactionsRData';
export declare class SimulateEthereumTransactionsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': SimulateEthereumTransactionsRData;
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
