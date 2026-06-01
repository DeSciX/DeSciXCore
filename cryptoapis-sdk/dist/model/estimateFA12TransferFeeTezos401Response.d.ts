import { EstimateFA12TransferFeeTezosE401 } from './estimateFA12TransferFeeTezosE401';
export declare class EstimateFA12TransferFeeTezos401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA12TransferFeeTezosE401;
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
