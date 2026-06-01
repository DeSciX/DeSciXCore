import { EstimateTransferFeeTezosE400 } from './estimateTransferFeeTezosE400';
export declare class EstimateTransferFeeTezos400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransferFeeTezosE400;
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
