import { SimulateEthereumTransactionsRBDataItem } from './simulateEthereumTransactionsRBDataItem';
export declare class SimulateEthereumTransactionsRBData {
    'item': SimulateEthereumTransactionsRBDataItem;
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
