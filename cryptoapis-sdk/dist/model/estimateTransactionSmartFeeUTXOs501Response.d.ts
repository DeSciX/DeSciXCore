import { Unimplemented } from './unimplemented';
export declare class EstimateTransactionSmartFeeUTXOs501Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': Unimplemented;
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
