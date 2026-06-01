import { EstimateFA2TransferFeeTezosRData } from './estimateFA2TransferFeeTezosRData';
export declare class EstimateFA2TransferFeeTezosR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateFA2TransferFeeTezosRData;
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
