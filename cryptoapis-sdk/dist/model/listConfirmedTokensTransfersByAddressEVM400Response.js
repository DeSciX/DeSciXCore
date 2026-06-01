"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVM400Response = void 0;
var ListConfirmedTokensTransfersByAddressEVM400Response = (function () {
    function ListConfirmedTokensTransfersByAddressEVM400Response() {
    }
    ListConfirmedTokensTransfersByAddressEVM400Response.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVM400Response.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVM400Response.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVM400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTokensTransfersByAddressEVME400"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVM400Response;
}());
exports.ListConfirmedTokensTransfersByAddressEVM400Response = ListConfirmedTokensTransfersByAddressEVM400Response;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVM400Response.js.map