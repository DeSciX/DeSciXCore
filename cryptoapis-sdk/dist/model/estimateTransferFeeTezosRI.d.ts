import { EstimateTransferFeeTezosRIMinimumFee } from './estimateTransferFeeTezosRIMinimumFee';
export declare class EstimateTransferFeeTezosRI {
    'gasLimit': number;
    'includesReveal': boolean;
    'storageBurnEstimate': number;
    'storageLimit': number;
    'minimumFee': EstimateTransferFeeTezosRIMinimumFee;
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
