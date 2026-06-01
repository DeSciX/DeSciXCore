import { EstimateTransferFeeTezosE401 } from './estimateTransferFeeTezosE401';
export declare class EstimateTransferFeeTezos401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransferFeeTezosE401;
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
