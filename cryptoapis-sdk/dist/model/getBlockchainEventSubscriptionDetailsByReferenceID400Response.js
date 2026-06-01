"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceID400Response = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceID400Response = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceID400Response() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceID400Response.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceID400Response.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceID400Response.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceID400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetBlockchainEventSubscriptionDetailsByReferenceIDE400"
        }
    ];
    return GetBlockchainEventSubscriptionDetailsByReferenceID400Response;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceID400Response = GetBlockchainEventSubscriptionDetailsByReferenceID400Response;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceID400Response.js.map