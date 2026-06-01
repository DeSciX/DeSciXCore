import { EstimateFA12TransferFeeTezosRData } from './estimateFA12TransferFeeTezosRData';
export declare class EstimateFA12TransferFeeTezosR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateFA12TransferFeeTezosRData;
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
