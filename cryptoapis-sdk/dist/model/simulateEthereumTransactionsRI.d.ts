import { SimulateEthereumTransactionsRIFee } from './simulateEthereumTransactionsRIFee';
import { SimulateEthereumTransactionsRIGasPrice } from './simulateEthereumTransactionsRIGasPrice';
import { SimulateEthereumTransactionsRIInternalTransactionsInner } from './simulateEthereumTransactionsRIInternalTransactionsInner';
import { SimulateEthereumTransactionsRIMaxFeePerGas } from './simulateEthereumTransactionsRIMaxFeePerGas';
import { SimulateEthereumTransactionsRIMaxPriorityFeePerGas } from './simulateEthereumTransactionsRIMaxPriorityFeePerGas';
import { SimulateEthereumTransactionsRIMinedInBlock } from './simulateEthereumTransactionsRIMinedInBlock';
import { SimulateEthereumTransactionsRITokenTransfersInner } from './simulateEthereumTransactionsRITokenTransfersInner';
import { SimulateEthereumTransactionsRIValue } from './simulateEthereumTransactionsRIValue';
export declare class SimulateEthereumTransactionsRI {
    'contract'?: string;
    'gasLimit': number;
    'gasUsed'?: number;
    'hash': string;
    'inputData'?: string;
    'internalTransactions'?: Array<SimulateEthereumTransactionsRIInternalTransactionsInner>;
    'nonce': number;
    'positionInBlock': number;
    'status': string;
    'timestamp': number;
    'tokenTransfers'?: Array<SimulateEthereumTransactionsRITokenTransfersInner>;
    'fee': SimulateEthereumTransactionsRIFee;
    'gasPrice': SimulateEthereumTransactionsRIGasPrice;
    'maxFeePerGas'?: SimulateEthereumTransactionsRIMaxFeePerGas;
    'maxPriorityFeePerGas'?: SimulateEthereumTransactionsRIMaxPriorityFeePerGas;
    'minedInBlock': SimulateEthereumTransactionsRIMinedInBlock;
    'value': SimulateEthereumTransactionsRIValue;
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
