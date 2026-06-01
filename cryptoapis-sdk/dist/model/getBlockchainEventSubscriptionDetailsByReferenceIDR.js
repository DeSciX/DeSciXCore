"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDR = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceIDR = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceIDR() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceIDR.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceIDR.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceIDR.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceIDR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetBlockchainEventSubscriptionDetailsByReferenceIDRData"
        }
    ];
    return GetBlockchainEventSubscriptionDetailsByReferenceIDR;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDR = GetBlockchainEventSubscriptionDetailsByReferenceIDR;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceIDR.js.map