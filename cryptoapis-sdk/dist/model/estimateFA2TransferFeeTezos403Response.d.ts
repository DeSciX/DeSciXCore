import { EstimateFA2TransferFeeTezosE403 } from './estimateFA2TransferFeeTezosE403';
export declare class EstimateFA2TransferFeeTezos403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA2TransferFeeTezosE403;
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
