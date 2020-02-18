/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/ts_helpers", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/reflection", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/builtin", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/dynamic"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    var builtin_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/builtin");
    var dynamic_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/dynamic");
    /**
     * Instance of the `Object.assign` builtin function. Used for evaluating
     * the "__assign" TypeScript helper.
     */
    var objectAssignBuiltinFn = new builtin_1.ObjectAssignBuiltinFn();
    function evaluateTsHelperInline(helper, node, args) {
        switch (helper) {
            case reflection_1.TsHelperFn.Assign:
                // Use the same implementation we use for `Object.assign`. Semantically these
                // functions are the same, so they can also share the same evaluation code.
                return objectAssignBuiltinFn.evaluate(node, args);
            case reflection_1.TsHelperFn.Spread:
            case reflection_1.TsHelperFn.SpreadArrays:
                return evaluateTsSpreadHelper(node, args);
            default:
                throw new Error("Cannot evaluate TypeScript helper function: " + reflection_1.TsHelperFn[helper]);
        }
    }
    exports.evaluateTsHelperInline = evaluateTsHelperInline;
    function evaluateTsSpreadHelper(node, args) {
        var e_1, _a;
        var result = [];
        try {
            for (var args_1 = tslib_1.__values(args), args_1_1 = args_1.next(); !args_1_1.done; args_1_1 = args_1.next()) {
                var arg = args_1_1.value;
                if (arg instanceof dynamic_1.DynamicValue) {
                    result.push(dynamic_1.DynamicValue.fromDynamicInput(node, arg));
                }
                else if (Array.isArray(arg)) {
                    result.push.apply(result, tslib_1.__spread(arg));
                }
                else {
                    result.push(arg);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (args_1_1 && !args_1_1.done && (_a = args_1.return)) _a.call(args_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNfaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3Ivc3JjL3RzX2hlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBSUgseUVBQTRDO0lBRTVDLHlGQUFnRDtJQUNoRCx5RkFBdUM7SUFJdkM7OztPQUdHO0lBQ0gsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLCtCQUFxQixFQUFFLENBQUM7SUFFMUQsU0FBZ0Isc0JBQXNCLENBQ2xDLE1BQWtCLEVBQUUsSUFBdUIsRUFBRSxJQUF3QjtRQUN2RSxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssdUJBQVUsQ0FBQyxNQUFNO2dCQUNwQiw2RUFBNkU7Z0JBQzdFLDJFQUEyRTtnQkFDM0UsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BELEtBQUssdUJBQVUsQ0FBQyxNQUFNLENBQUM7WUFDdkIsS0FBSyx1QkFBVSxDQUFDLFlBQVk7Z0JBQzFCLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQStDLHVCQUFVLENBQUMsTUFBTSxDQUFHLENBQUMsQ0FBQztTQUN4RjtJQUNILENBQUM7SUFiRCx3REFhQztJQUVELFNBQVMsc0JBQXNCLENBQUMsSUFBYSxFQUFFLElBQXdCOztRQUNyRSxJQUFNLE1BQU0sR0FBdUIsRUFBRSxDQUFDOztZQUN0QyxLQUFrQixJQUFBLFNBQUEsaUJBQUEsSUFBSSxDQUFBLDBCQUFBLDRDQUFFO2dCQUFuQixJQUFNLEdBQUcsaUJBQUE7Z0JBQ1osSUFBSSxHQUFHLFlBQVksc0JBQVksRUFBRTtvQkFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUN2RDtxQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzdCLE1BQU0sQ0FBQyxJQUFJLE9BQVgsTUFBTSxtQkFBUyxHQUFHLEdBQUU7aUJBQ3JCO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2xCO2FBQ0Y7Ozs7Ozs7OztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1RzSGVscGVyRm59IGZyb20gJy4uLy4uL3JlZmxlY3Rpb24nO1xuXG5pbXBvcnQge09iamVjdEFzc2lnbkJ1aWx0aW5Gbn0gZnJvbSAnLi9idWlsdGluJztcbmltcG9ydCB7RHluYW1pY1ZhbHVlfSBmcm9tICcuL2R5bmFtaWMnO1xuaW1wb3J0IHtSZXNvbHZlZFZhbHVlLCBSZXNvbHZlZFZhbHVlQXJyYXl9IGZyb20gJy4vcmVzdWx0JztcblxuXG4vKipcbiAqIEluc3RhbmNlIG9mIHRoZSBgT2JqZWN0LmFzc2lnbmAgYnVpbHRpbiBmdW5jdGlvbi4gVXNlZCBmb3IgZXZhbHVhdGluZ1xuICogdGhlIFwiX19hc3NpZ25cIiBUeXBlU2NyaXB0IGhlbHBlci5cbiAqL1xuY29uc3Qgb2JqZWN0QXNzaWduQnVpbHRpbkZuID0gbmV3IE9iamVjdEFzc2lnbkJ1aWx0aW5GbigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZXZhbHVhdGVUc0hlbHBlcklubGluZShcbiAgICBoZWxwZXI6IFRzSGVscGVyRm4sIG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uLCBhcmdzOiBSZXNvbHZlZFZhbHVlQXJyYXkpOiBSZXNvbHZlZFZhbHVlIHtcbiAgc3dpdGNoIChoZWxwZXIpIHtcbiAgICBjYXNlIFRzSGVscGVyRm4uQXNzaWduOlxuICAgICAgLy8gVXNlIHRoZSBzYW1lIGltcGxlbWVudGF0aW9uIHdlIHVzZSBmb3IgYE9iamVjdC5hc3NpZ25gLiBTZW1hbnRpY2FsbHkgdGhlc2VcbiAgICAgIC8vIGZ1bmN0aW9ucyBhcmUgdGhlIHNhbWUsIHNvIHRoZXkgY2FuIGFsc28gc2hhcmUgdGhlIHNhbWUgZXZhbHVhdGlvbiBjb2RlLlxuICAgICAgcmV0dXJuIG9iamVjdEFzc2lnbkJ1aWx0aW5Gbi5ldmFsdWF0ZShub2RlLCBhcmdzKTtcbiAgICBjYXNlIFRzSGVscGVyRm4uU3ByZWFkOlxuICAgIGNhc2UgVHNIZWxwZXJGbi5TcHJlYWRBcnJheXM6XG4gICAgICByZXR1cm4gZXZhbHVhdGVUc1NwcmVhZEhlbHBlcihub2RlLCBhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZXZhbHVhdGUgVHlwZVNjcmlwdCBoZWxwZXIgZnVuY3Rpb246ICR7VHNIZWxwZXJGbltoZWxwZXJdfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2YWx1YXRlVHNTcHJlYWRIZWxwZXIobm9kZTogdHMuTm9kZSwgYXJnczogUmVzb2x2ZWRWYWx1ZUFycmF5KTogUmVzb2x2ZWRWYWx1ZUFycmF5IHtcbiAgY29uc3QgcmVzdWx0OiBSZXNvbHZlZFZhbHVlQXJyYXkgPSBbXTtcbiAgZm9yIChjb25zdCBhcmcgb2YgYXJncykge1xuICAgIGlmIChhcmcgaW5zdGFuY2VvZiBEeW5hbWljVmFsdWUpIHtcbiAgICAgIHJlc3VsdC5wdXNoKER5bmFtaWNWYWx1ZS5mcm9tRHluYW1pY0lucHV0KG5vZGUsIGFyZykpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICByZXN1bHQucHVzaCguLi5hcmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChhcmcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19