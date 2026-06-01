import { GetAddressStatisticsEVMRIInternalTransactionsCounts } from './getAddressStatisticsEVMRIInternalTransactionsCounts';
import { GetAddressStatisticsEVMRINativeTransactionsCounts } from './getAddressStatisticsEVMRINativeTransactionsCounts';
import { GetAddressStatisticsEVMRITokenTransfersCounts } from './getAddressStatisticsEVMRITokenTransfersCounts';
export declare class GetAddressStatisticsEVMRI {
    'address': string;
    'blockHeight': number;
    'blockTimestamp': number;
    'internalTransactionsCounts': GetAddressStatisticsEVMRIInternalTransactionsCounts;
    'nativeTransactionsCounts': GetAddressStatisticsEVMRINativeTransactionsCounts;
    'tokenTransfersCounts': GetAddressStatisticsEVMRITokenTransfersCounts;
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
