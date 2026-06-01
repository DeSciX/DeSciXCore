import { EstimateFA2TransferFeeTezosE401 } from './estimateFA2TransferFeeTezosE401';
export declare class EstimateFA2TransferFeeTezos401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateFA2TransferFeeTezosE401;
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
