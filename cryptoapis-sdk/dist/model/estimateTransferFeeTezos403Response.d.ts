import { EstimateTransferFeeTezosE403 } from './estimateTransferFeeTezosE403';
export declare class EstimateTransferFeeTezos403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransferFeeTezosE403;
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
