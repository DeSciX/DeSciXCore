import { EstimateFA12TransferFeeTezosE403 } from './estimateFA12TransferFeeTezosE403';
export declare class EstimateFA12TransferFeeTezos403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA12TransferFeeTezosE403;
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
