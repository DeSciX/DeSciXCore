"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceID404Response = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceID404Response = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceID404Response() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceID404Response.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceID404Response.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceID404Response.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceID404Response.attributeTypeMap = [
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
            "type": "ResourceNotFound"
        }
    ];
    return GetBlockchainEventSubscriptionDetailsByReferenceID404Response;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceID404Response = GetBlockchainEventSubscriptionDetailsByReferenceID404Response;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceID404Response.js.map