"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRP403Response = void 0;
var ValidateAddressXRP403Response = (function () {
    function ValidateAddressXRP403Response() {
    }
    ValidateAddressXRP403Response.getAttributeTypeMap = function () {
        return ValidateAddressXRP403Response.attributeTypeMap;
    };
    ValidateAddressXRP403Response.discriminator = undefined;
    ValidateAddressXRP403Response.attributeTypeMap = [
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
            "type": "ValidateAddressXRPE403"
        }
    ];
    return ValidateAddressXRP403Response;
}());
exports.ValidateAddressXRP403Response = ValidateAddressXRP403Response;
//# sourceMappingURL=validateAddressXRP403Response.js.map