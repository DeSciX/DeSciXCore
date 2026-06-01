import { SimulateEthereumTransactionsRITokenTransfersInnerTokenDataFungibleValues } from './simulateEthereumTransactionsRITokenTransfersInnerTokenDataFungibleValues';
import { SimulateEthereumTransactionsRITokenTransfersInnerTokenDataNonFungibleValues } from './simulateEthereumTransactionsRITokenTransfersInnerTokenDataNonFungibleValues';
export declare class SimulateEthereumTransactionsRITokenTransfersInnerTokenData {
    'contractAddress': string;
    'fungibleValues'?: SimulateEthereumTransactionsRITokenTransfersInnerTokenDataFungibleValues;
    'name'?: string;
    'nonFungibleValues'?: SimulateEthereumTransactionsRITokenTransfersInnerTokenDataNonFungibleValues;
    'standard': string;
    'symbol'?: string;
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
