"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVM401Response = void 0;
var ListConfirmedTokensTransfersByAddressEVM401Response = (function () {
    function ListConfirmedTokensTransfersByAddressEVM401Response() {
    }
    ListConfirmedTokensTransfersByAddressEVM401Response.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVM401Response.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVM401Response.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVM401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTokensTransfersByAddressEVME401"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVM401Response;
}());
exports.ListConfirmedTokensTransfersByAddressEVM401Response = ListConfirmedTokensTransfersByAddressEVM401Response;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVM401Response.js.map