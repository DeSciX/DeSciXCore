import { EstimateFA2TransferFeeTezosE400 } from './estimateFA2TransferFeeTezosE400';
export declare class EstimateFA2TransferFeeTezos400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA2TransferFeeTezosE400;
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
