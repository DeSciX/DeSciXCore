import { EstimateTransferFeeTezosRData } from './estimateTransferFeeTezosRData';
export declare class EstimateTransferFeeTezosR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateTransferFeeTezosRData;
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
