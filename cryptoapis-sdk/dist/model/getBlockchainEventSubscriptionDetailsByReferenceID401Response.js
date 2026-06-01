"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceID401Response = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceID401Response = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceID401Response() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceID401Response.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceID401Response.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceID401Response.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceID401Response.attributeTypeMap = [
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
            "type": "GetBlockchainEventSubscriptionDetailsByReferenceIDE401"
        }
    ];
    return GetBlockchainEventSubscriptionDetailsByReferenceID401Response;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceID401Response = GetBlockchainEventSubscriptionDetailsByReferenceID401Response;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceID401Response.js.map