import { EstimateFA12TransferFeeTezosE400 } from './estimateFA12TransferFeeTezosE400';
export declare class EstimateFA12TransferFeeTezos400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA12TransferFeeTezosE400;
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
