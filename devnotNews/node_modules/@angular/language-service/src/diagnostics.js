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
        define("@angular/language-service/src/diagnostics", ["require", "exports", "tslib", "path", "typescript", "@angular/language-service/src/expression_diagnostics", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var path = require("path");
    var ts = require("typescript");
    var expression_diagnostics_1 = require("@angular/language-service/src/expression_diagnostics");
    var utils_1 = require("@angular/language-service/src/utils");
    /**
     * Return diagnostic information for the parsed AST of the template.
     * @param ast contains HTML and template AST
     */
    function getTemplateDiagnostics(ast) {
        var parseErrors = ast.parseErrors, templateAst = ast.templateAst, htmlAst = ast.htmlAst, template = ast.template;
        if (parseErrors && parseErrors.length) {
            return parseErrors.map(function (e) {
                return {
                    kind: ts.DiagnosticCategory.Error,
                    span: utils_1.offsetSpan(utils_1.spanOf(e.span), template.span.start),
                    message: e.msg,
                };
            });
        }
        return expression_diagnostics_1.getTemplateExpressionDiagnostics({
            templateAst: templateAst,
            htmlAst: htmlAst,
            offset: template.span.start,
            query: template.query,
            members: template.members,
        });
    }
    exports.getTemplateDiagnostics = getTemplateDiagnostics;
    /**
     * Generate an error message that indicates a directive is not part of any
     * NgModule.
     * @param name class name
     * @param isComponent true if directive is an Angular Component
     */
    function missingDirective(name, isComponent) {
        var type = isComponent ? 'Component' : 'Directive';
        return type + " '" + name + "' is not included in a module and will not be " +
            'available inside a template. Consider adding it to a NgModule declaration.';
    }
    /**
     * Performs a variety diagnostics on directive declarations.
     *
     * @param declarations Angular directive declarations
     * @param modules NgModules in the project
     * @param host TypeScript service host used to perform TypeScript queries
     * @return diagnosed errors, if any
     */
    function getDeclarationDiagnostics(declarations, modules, host) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        var directives = new Set();
        try {
            for (var _e = tslib_1.__values(modules.ngModules), _f = _e.next(); !_f.done; _f = _e.next()) {
                var ngModule = _f.value;
                try {
                    for (var _g = (e_2 = void 0, tslib_1.__values(ngModule.declaredDirectives)), _h = _g.next(); !_h.done; _h = _g.next()) {
                        var directive = _h.value;
                        directives.add(directive.reference);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var results = [];
        try {
            for (var declarations_1 = tslib_1.__values(declarations), declarations_1_1 = declarations_1.next(); !declarations_1_1.done; declarations_1_1 = declarations_1.next()) {
                var declaration = declarations_1_1.value;
                var errors = declaration.errors, metadata = declaration.metadata, type = declaration.type, declarationSpan = declaration.declarationSpan;
                var sf = host.getSourceFile(type.filePath);
                if (!sf) {
                    host.error("directive " + type.name + " exists but has no source file");
                    return [];
                }
                // TypeScript identifier of the directive declaration annotation (e.g. "Component" or
                // "Directive") on a directive class.
                var directiveIdentifier = utils_1.findTightestNode(sf, declarationSpan.start);
                if (!directiveIdentifier) {
                    host.error("directive " + type.name + " exists but has no identifier");
                    return [];
                }
                try {
                    for (var errors_1 = (e_4 = void 0, tslib_1.__values(errors)), errors_1_1 = errors_1.next(); !errors_1_1.done; errors_1_1 = errors_1.next()) {
                        var error = errors_1_1.value;
                        results.push({
                            kind: ts.DiagnosticCategory.Error,
                            message: error.message,
                            span: error.span,
                        });
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (errors_1_1 && !errors_1_1.done && (_d = errors_1.return)) _d.call(errors_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                if (metadata.isComponent) {
                    if (!modules.ngModuleByPipeOrDirective.has(declaration.type)) {
                        results.push({
                            kind: ts.DiagnosticCategory.Suggestion,
                            message: missingDirective(type.name, metadata.isComponent),
                            span: declarationSpan,
                        });
                    }
                    var _j = metadata.template, template = _j.template, templateUrl = _j.templateUrl, styleUrls = _j.styleUrls;
                    if (template === null && !templateUrl) {
                        results.push({
                            kind: ts.DiagnosticCategory.Error,
                            message: "Component '" + type.name + "' must have a template or templateUrl",
                            span: declarationSpan,
                        });
                    }
                    else if (templateUrl) {
                        if (template) {
                            results.push({
                                kind: ts.DiagnosticCategory.Error,
                                message: "Component '" + type.name + "' must not have both template and templateUrl",
                                span: declarationSpan,
                            });
                        }
                        // Find templateUrl value from the directive call expression, which is the parent of the
                        // directive identifier.
                        //
                        // TODO: We should create an enum of the various properties a directive can have to use
                        // instead of string literals. We can then perform a mass migration of all literal usages.
                        var templateUrlNode = utils_1.findPropertyValueOfType(directiveIdentifier.parent, 'templateUrl', ts.isLiteralExpression);
                        if (!templateUrlNode) {
                            host.error("templateUrl " + templateUrl + " exists but its TypeScript node doesn't");
                            return [];
                        }
                        results.push.apply(results, tslib_1.__spread(validateUrls([templateUrlNode], host.tsLsHost)));
                    }
                    if (styleUrls.length > 0) {
                        // Find styleUrls value from the directive call expression, which is the parent of the
                        // directive identifier.
                        var styleUrlsNode = utils_1.findPropertyValueOfType(directiveIdentifier.parent, 'styleUrls', ts.isArrayLiteralExpression);
                        if (!styleUrlsNode) {
                            host.error("styleUrls property exists but its TypeScript node doesn't'");
                            return [];
                        }
                        results.push.apply(results, tslib_1.__spread(validateUrls(styleUrlsNode.elements, host.tsLsHost)));
                    }
                }
                else if (!directives.has(declaration.type)) {
                    results.push({
                        kind: ts.DiagnosticCategory.Suggestion,
                        message: missingDirective(type.name, metadata.isComponent),
                        span: declarationSpan,
                    });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (declarations_1_1 && !declarations_1_1.done && (_c = declarations_1.return)) _c.call(declarations_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return results;
    }
    exports.getDeclarationDiagnostics = getDeclarationDiagnostics;
    /**
     * Checks that URLs on a directive point to a valid file.
     * Note that this diagnostic check may require a filesystem hit, and thus may be slower than other
     * checks.
     *
     * @param urls urls to check for validity
     * @param tsLsHost TS LS host used for querying filesystem information
     * @return diagnosed url errors, if any
     */
    function validateUrls(urls, tsLsHost) {
        if (!tsLsHost.fileExists) {
            return [];
        }
        var allErrors = [];
        // TODO(ayazhafiz): most of this logic can be unified with the logic in
        // definitions.ts#getUrlFromProperty. Create a utility function to be used by both.
        for (var i = 0; i < urls.length; ++i) {
            var urlNode = urls[i];
            if (!ts.isStringLiteralLike(urlNode)) {
                // If a non-string value is assigned to a URL node (like `templateUrl`), a type error will be
                // picked up by the TS Language Server.
                continue;
            }
            var curPath = urlNode.getSourceFile().fileName;
            var url = path.join(path.dirname(curPath), urlNode.text);
            if (tsLsHost.fileExists(url))
                continue;
            allErrors.push({
                kind: ts.DiagnosticCategory.Error,
                message: "URL does not point to a valid file",
                // Exclude opening and closing quotes in the url span.
                span: { start: urlNode.getStart() + 1, end: urlNode.end - 1 },
            });
        }
        return allErrors;
    }
    /**
     * Return a recursive data structure that chains diagnostic messages.
     * @param chain
     */
    function chainDiagnostics(chain) {
        return {
            messageText: chain.message,
            category: ts.DiagnosticCategory.Error,
            code: 0,
            next: chain.next ? chain.next.map(chainDiagnostics) : undefined
        };
    }
    /**
     * Convert ng.Diagnostic to ts.Diagnostic.
     * @param d diagnostic
     * @param file
     */
    function ngDiagnosticToTsDiagnostic(d, file) {
        return {
            file: file,
            start: d.span.start,
            length: d.span.end - d.span.start,
            messageText: typeof d.message === 'string' ? d.message : chainDiagnostics(d.message),
            category: d.kind,
            code: 0,
            source: 'ng',
        };
    }
    exports.ngDiagnosticToTsDiagnostic = ngDiagnosticToTsDiagnostic;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBR2pDLCtGQUEwRTtJQUcxRSw2REFBc0Y7SUFHdEY7OztPQUdHO0lBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsR0FBYztRQUM1QyxJQUFBLDZCQUFXLEVBQUUsNkJBQVcsRUFBRSxxQkFBTyxFQUFFLHVCQUFRLENBQVE7UUFDMUQsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTtZQUNyQyxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDO2dCQUN0QixPQUFPO29CQUNMLElBQUksRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSztvQkFDakMsSUFBSSxFQUFFLGtCQUFVLENBQUMsY0FBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDckQsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHO2lCQUNmLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsT0FBTyx5REFBZ0MsQ0FBQztZQUN0QyxXQUFXLEVBQUUsV0FBVztZQUN4QixPQUFPLEVBQUUsT0FBTztZQUNoQixNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLO1lBQzNCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztZQUNyQixPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU87U0FDMUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQWxCRCx3REFrQkM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsZ0JBQWdCLENBQUMsSUFBWSxFQUFFLFdBQW9CO1FBQzFELElBQU0sSUFBSSxH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Q0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUNwRixRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUk7WUFDaEIsSUFBSSxFQUFFLENBQUM7WUFDUCxNQUFNLEVBQUUsSUFBSTtTQUNiLENBQUM7SUFDSixDQUFDO0lBWEQsZ0VBV0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdBbmFseXplZE1vZHVsZXN9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtBc3RSZXN1bHR9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7Z2V0VGVtcGxhdGVFeHByZXNzaW9uRGlhZ25vc3RpY3N9IGZyb20gJy4vZXhwcmVzc2lvbl9kaWFnbm9zdGljcyc7XG5pbXBvcnQgKiBhcyBuZyBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7VHlwZVNjcmlwdFNlcnZpY2VIb3N0fSBmcm9tICcuL3R5cGVzY3JpcHRfaG9zdCc7XG5pbXBvcnQge2ZpbmRQcm9wZXJ0eVZhbHVlT2ZUeXBlLCBmaW5kVGlnaHRlc3ROb2RlLCBvZmZzZXRTcGFuLCBzcGFuT2Z9IGZyb20gJy4vdXRpbHMnO1xuXG5cbi8qKlxuICogUmV0dXJuIGRpYWdub3N0aWMgaW5mb3JtYXRpb24gZm9yIHRoZSBwYXJzZWQgQVNUIG9mIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBhc3QgY29udGFpbnMgSFRNTCBhbmQgdGVtcGxhdGUgQVNUXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZW1wbGF0ZURpYWdub3N0aWNzKGFzdDogQXN0UmVzdWx0KTogbmcuRGlhZ25vc3RpY1tdIHtcbiAgY29uc3Qge3BhcnNlRXJyb3JzLCB0ZW1wbGF0ZUFzdCwgaHRtbEFzdCwgdGVtcGxhdGV9ID0gYXN0O1xuICBpZiAocGFyc2VFcnJvcnMgJiYgcGFyc2VFcnJvcnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHBhcnNlRXJyb3JzLm1hcChlID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtpbmQ6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgc3Bhbjogb2Zmc2V0U3BhbihzcGFuT2YoZS5zcGFuKSwgdGVtcGxhdGUuc3Bhbi5zdGFydCksXG4gICAgICAgIG1lc3NhZ2U6IGUubXNnLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZ2V0VGVtcGxhdGVFeHByZXNzaW9uRGlhZ25vc3RpY3Moe1xuICAgIHRlbXBsYXRlQXN0OiB0ZW1wbGF0ZUFzdCxcbiAgICBodG1sQXN0OiBodG1sQXN0LFxuICAgIG9mZnNldDogdGVtcGxhdGUuc3Bhbi5zdGFydCxcbiAgICBxdWVyeTogdGVtcGxhdGUucXVlcnksXG4gICAgbWVtYmVyczogdGVtcGxhdGUubWVtYmVycyxcbiAgfSk7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYW4gZXJyb3IgbWVzc2FnZSB0aGF0IGluZGljYXRlcyBhIGRpcmVjdGl2ZSBpcyBub3QgcGFydCBvZiBhbnlcbiAqIE5nTW9kdWxlLlxuICogQHBhcmFtIG5hbWUgY2xhc3MgbmFtZVxuICogQHBhcmFtIGlzQ29tcG9uZW50IHRydWUgaWYgZGlyZWN0aXZlIGlzIGFuIEFuZ3VsYXIgQ29tcG9uZW50XG4gKi9cbmZ1bmN0aW9uIG1pc3NpbmdEaXJlY3RpdmUobmFtZTogc3RyaW5nLCBpc0NvbXBvbmVudDogYm9vbGVhbikge1xuICBjb25zdCB0eXBlID0gaXNDb21wb25lbnQgPyAnQ29tcG9uZW50JyA6ICdEaXJlY3RpdmUnO1xuICByZXR1cm4gYCR7dHlwZX0gJyR7bmFtZX0nIGlzIG5vdCBpbmNsdWRlZCBpbiBhIG1vZHVsZSBhbmQgd2lsbCBub3QgYmUgYCArXG4gICAgICAnYXZhaWxhYmxlIGluc2lkZSBhIHRlbXBsYXRlLiBDb25zaWRlciBhZGRpbmcgaXQgdG8gYSBOZ01vZHVsZSBkZWNsYXJhdGlvbi4nO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGEgdmFyaWV0eSBkaWFnbm9zdGljcyBvbiBkaXJlY3RpdmUgZGVjbGFyYXRpb25zLlxuICpcbiAqIEBwYXJhbSBkZWNsYXJhdGlvbnMgQW5ndWxhciBkaXJlY3RpdmUgZGVjbGFyYXRpb25zXG4gKiBAcGFyYW0gbW9kdWxlcyBOZ01vZHVsZXMgaW4gdGhlIHByb2plY3RcbiAqIEBwYXJhbSBob3N0IFR5cGVTY3JpcHQgc2VydmljZSBob3N0IHVzZWQgdG8gcGVyZm9ybSBUeXBlU2NyaXB0IHF1ZXJpZXNcbiAqIEByZXR1cm4gZGlhZ25vc2VkIGVycm9ycywgaWYgYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNsYXJhdGlvbkRpYWdub3N0aWNzKFxuICAgIGRlY2xhcmF0aW9uczogbmcuRGVjbGFyYXRpb25bXSwgbW9kdWxlczogTmdBbmFseXplZE1vZHVsZXMsXG4gICAgaG9zdDogUmVhZG9ubHk8VHlwZVNjcmlwdFNlcnZpY2VIb3N0Pik6IG5nLkRpYWdub3N0aWNbXSB7XG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSBuZXcgU2V0PG5nLlN0YXRpY1N5bWJvbD4oKTtcbiAgZm9yIChjb25zdCBuZ01vZHVsZSBvZiBtb2R1bGVzLm5nTW9kdWxlcykge1xuICAgIGZvciAoY29uc3QgZGlyZWN0aXZlIG9mIG5nTW9kdWxlLmRlY2xhcmVkRGlyZWN0aXZlcykge1xuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlLnJlZmVyZW5jZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzdWx0czogbmcuRGlhZ25vc3RpY1tdID0gW107XG5cbiAgZm9yIChjb25zdCBkZWNsYXJhdGlvbiBvZiBkZWNsYXJhdGlvbnMpIHtcbiAgICBjb25zdCB7ZXJyb3JzLCBtZXRhZGF0YSwgdHlwZSwgZGVjbGFyYXRpb25TcGFufSA9IGRlY2xhcmF0aW9uO1xuXG4gICAgY29uc3Qgc2YgPSBob3N0LmdldFNvdXJjZUZpbGUodHlwZS5maWxlUGF0aCk7XG4gICAgaWYgKCFzZikge1xuICAgICAgaG9zdC5lcnJvcihgZGlyZWN0aXZlICR7dHlwZS5uYW1lfSBleGlzdHMgYnV0IGhhcyBubyBzb3VyY2UgZmlsZWApO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBUeXBlU2NyaXB0IGlkZW50aWZpZXIgb2YgdGhlIGRpcmVjdGl2ZSBkZWNsYXJhdGlvbiBhbm5vdGF0aW9uIChlLmcuIFwiQ29tcG9uZW50XCIgb3JcbiAgICAvLyBcIkRpcmVjdGl2ZVwiKSBvbiBhIGRpcmVjdGl2ZSBjbGFzcy5cbiAgICBjb25zdCBkaXJlY3RpdmVJZGVudGlmaWVyID0gZmluZFRpZ2h0ZXN0Tm9kZShzZiwgZGVjbGFyYXRpb25TcGFuLnN0YXJ0KTtcbiAgICBpZiAoIWRpcmVjdGl2ZUlkZW50aWZpZXIpIHtcbiAgICAgIGhvc3QuZXJyb3IoYGRpcmVjdGl2ZSAke3R5cGUubmFtZX0gZXhpc3RzIGJ1dCBoYXMgbm8gaWRlbnRpZmllcmApO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZXJyb3Igb2YgZXJyb3JzKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBraW5kOiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIHNwYW46IGVycm9yLnNwYW4sXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKG1ldGFkYXRhLmlzQ29tcG9uZW50KSB7XG4gICAgICBpZiAoIW1vZHVsZXMubmdNb2R1bGVCeVBpcGVPckRpcmVjdGl2ZS5oYXMoZGVjbGFyYXRpb24udHlwZSkpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBraW5kOiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuU3VnZ2VzdGlvbixcbiAgICAgICAgICBtZXNzYWdlOiBtaXNzaW5nRGlyZWN0aXZlKHR5cGUubmFtZSwgbWV0YWRhdGEuaXNDb21wb25lbnQpLFxuICAgICAgICAgIHNwYW46IGRlY2xhcmF0aW9uU3BhbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsLCBzdHlsZVVybHN9ID0gbWV0YWRhdGEudGVtcGxhdGUgITtcbiAgICAgIGlmICh0ZW1wbGF0ZSA9PT0gbnVsbCAmJiAhdGVtcGxhdGVVcmwpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBraW5kOiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgICAgbWVzc2FnZTogYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBtdXN0IGhhdmUgYSB0ZW1wbGF0ZSBvciB0ZW1wbGF0ZVVybGAsXG4gICAgICAgICAgc3BhbjogZGVjbGFyYXRpb25TcGFuLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIGtpbmQ6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBDb21wb25lbnQgJyR7dHlwZS5uYW1lfScgbXVzdCBub3QgaGF2ZSBib3RoIHRlbXBsYXRlIGFuZCB0ZW1wbGF0ZVVybGAsXG4gICAgICAgICAgICBzcGFuOiBkZWNsYXJhdGlvblNwYW4sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaW5kIHRlbXBsYXRlVXJsIHZhbHVlIGZyb20gdGhlIGRpcmVjdGl2ZSBjYWxsIGV4cHJlc3Npb24sIHdoaWNoIGlzIHRoZSBwYXJlbnQgb2YgdGhlXG4gICAgICAgIC8vIGRpcmVjdGl2ZSBpZGVudGlmaWVyLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUT0RPOiBXZSBzaG91bGQgY3JlYXRlIGFuIGVudW0gb2YgdGhlIHZhcmlvdXMgcHJvcGVydGllcyBhIGRpcmVjdGl2ZSBjYW4gaGF2ZSB0byB1c2VcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBzdHJpbmcgbGl0ZXJhbHMuIFdlIGNhbiB0aGVuIHBlcmZvcm0gYSBtYXNzIG1pZ3JhdGlvbiBvZiBhbGwgbGl0ZXJhbCB1c2FnZXMuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsTm9kZSA9IGZpbmRQcm9wZXJ0eVZhbHVlT2ZUeXBlKFxuICAgICAgICAgICAgZGlyZWN0aXZlSWRlbnRpZmllci5wYXJlbnQsICd0ZW1wbGF0ZVVybCcsIHRzLmlzTGl0ZXJhbEV4cHJlc3Npb24pO1xuICAgICAgICBpZiAoIXRlbXBsYXRlVXJsTm9kZSkge1xuICAgICAgICAgIGhvc3QuZXJyb3IoYHRlbXBsYXRlVXJsICR7dGVtcGxhdGVVcmx9IGV4aXN0cyBidXQgaXRzIFR5cGVTY3JpcHQgbm9kZSBkb2Vzbid0YCk7XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLnZhbGlkYXRlVXJscyhbdGVtcGxhdGVVcmxOb2RlXSwgaG9zdC50c0xzSG9zdCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3R5bGVVcmxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gRmluZCBzdHlsZVVybHMgdmFsdWUgZnJvbSB0aGUgZGlyZWN0aXZlIGNhbGwgZXhwcmVzc2lvbiwgd2hpY2ggaXMgdGhlIHBhcmVudCBvZiB0aGVcbiAgICAgICAgLy8gZGlyZWN0aXZlIGlkZW50aWZpZXIuXG4gICAgICAgIGNvbnN0IHN0eWxlVXJsc05vZGUgPSBmaW5kUHJvcGVydHlWYWx1ZU9mVHlwZShcbiAgICAgICAgICAgIGRpcmVjdGl2ZUlkZW50aWZpZXIucGFyZW50LCAnc3R5bGVVcmxzJywgdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKTtcbiAgICAgICAgaWYgKCFzdHlsZVVybHNOb2RlKSB7XG4gICAgICAgICAgaG9zdC5lcnJvcihgc3R5bGVVcmxzIHByb3BlcnR5IGV4aXN0cyBidXQgaXRzIFR5cGVTY3JpcHQgbm9kZSBkb2Vzbid0J2ApO1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdHMucHVzaCguLi52YWxpZGF0ZVVybHMoc3R5bGVVcmxzTm9kZS5lbGVtZW50cywgaG9zdC50c0xzSG9zdCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWRpcmVjdGl2ZXMuaGFzKGRlY2xhcmF0aW9uLnR5cGUpKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBraW5kOiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuU3VnZ2VzdGlvbixcbiAgICAgICAgbWVzc2FnZTogbWlzc2luZ0RpcmVjdGl2ZSh0eXBlLm5hbWUsIG1ldGFkYXRhLmlzQ29tcG9uZW50KSxcbiAgICAgICAgc3BhbjogZGVjbGFyYXRpb25TcGFuLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgVVJMcyBvbiBhIGRpcmVjdGl2ZSBwb2ludCB0byBhIHZhbGlkIGZpbGUuXG4gKiBOb3RlIHRoYXQgdGhpcyBkaWFnbm9zdGljIGNoZWNrIG1heSByZXF1aXJlIGEgZmlsZXN5c3RlbSBoaXQsIGFuZCB0aHVzIG1heSBiZSBzbG93ZXIgdGhhbiBvdGhlclxuICogY2hlY2tzLlxuICpcbiAqIEBwYXJhbSB1cmxzIHVybHMgdG8gY2hlY2sgZm9yIHZhbGlkaXR5XG4gKiBAcGFyYW0gdHNMc0hvc3QgVFMgTFMgaG9zdCB1c2VkIGZvciBxdWVyeWluZyBmaWxlc3lzdGVtIGluZm9ybWF0aW9uXG4gKiBAcmV0dXJuIGRpYWdub3NlZCB1cmwgZXJyb3JzLCBpZiBhbnlcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVVcmxzKFxuICAgIHVybHM6IEFycmF5TGlrZTx0cy5FeHByZXNzaW9uPiwgdHNMc0hvc3Q6IFJlYWRvbmx5PHRzLkxhbmd1YWdlU2VydmljZUhvc3Q+KTogbmcuRGlhZ25vc3RpY1tdIHtcbiAgaWYgKCF0c0xzSG9zdC5maWxlRXhpc3RzKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgYWxsRXJyb3JzOiBuZy5EaWFnbm9zdGljW10gPSBbXTtcbiAgLy8gVE9ETyhheWF6aGFmaXopOiBtb3N0IG9mIHRoaXMgbG9naWMgY2FuIGJlIHVuaWZpZWQgd2l0aCB0aGUgbG9naWMgaW5cbiAgLy8gZGVmaW5pdGlvbnMudHMjZ2V0VXJsRnJvbVByb3BlcnR5LiBDcmVhdGUgYSB1dGlsaXR5IGZ1bmN0aW9uIHRvIGJlIHVzZWQgYnkgYm90aC5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aDsgKytpKSB7XG4gICAgY29uc3QgdXJsTm9kZSA9IHVybHNbaV07XG4gICAgaWYgKCF0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHVybE5vZGUpKSB7XG4gICAgICAvLyBJZiBhIG5vbi1zdHJpbmcgdmFsdWUgaXMgYXNzaWduZWQgdG8gYSBVUkwgbm9kZSAobGlrZSBgdGVtcGxhdGVVcmxgKSwgYSB0eXBlIGVycm9yIHdpbGwgYmVcbiAgICAgIC8vIHBpY2tlZCB1cCBieSB0aGUgVFMgTGFuZ3VhZ2UgU2VydmVyLlxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGN1clBhdGggPSB1cmxOb2RlLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcbiAgICBjb25zdCB1cmwgPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGN1clBhdGgpLCB1cmxOb2RlLnRleHQpO1xuICAgIGlmICh0c0xzSG9zdC5maWxlRXhpc3RzKHVybCkpIGNvbnRpbnVlO1xuXG4gICAgYWxsRXJyb3JzLnB1c2goe1xuICAgICAga2luZDogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgbWVzc2FnZTogYFVSTCBkb2VzIG5vdCBwb2ludCB0byBhIHZhbGlkIGZpbGVgLFxuICAgICAgLy8gRXhjbHVkZSBvcGVuaW5nIGFuZCBjbG9zaW5nIHF1b3RlcyBpbiB0aGUgdXJsIHNwYW4uXG4gICAgICBzcGFuOiB7c3RhcnQ6IHVybE5vZGUuZ2V0U3RhcnQoKSArIDEsIGVuZDogdXJsTm9kZS5lbmQgLSAxfSxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gYWxsRXJyb3JzO1xufVxuXG4vKipcbiAqIFJldHVybiBhIHJlY3Vyc2l2ZSBkYXRhIHN0cnVjdHVyZSB0aGF0IGNoYWlucyBkaWFnbm9zdGljIG1lc3NhZ2VzLlxuICogQHBhcmFtIGNoYWluXG4gKi9cbmZ1bmN0aW9uIGNoYWluRGlhZ25vc3RpY3MoY2hhaW46IG5nLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4pOiB0cy5EaWFnbm9zdGljTWVzc2FnZUNoYWluIHtcbiAgcmV0dXJuIHtcbiAgICBtZXNzYWdlVGV4dDogY2hhaW4ubWVzc2FnZSxcbiAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgIGNvZGU6IDAsXG4gICAgbmV4dDogY2hhaW4ubmV4dCA/IGNoYWluLm5leHQubWFwKGNoYWluRGlhZ25vc3RpY3MpIDogdW5kZWZpbmVkXG4gIH07XG59XG5cbi8qKlxuICogQ29udmVydCBuZy5EaWFnbm9zdGljIHRvIHRzLkRpYWdub3N0aWMuXG4gKiBAcGFyYW0gZCBkaWFnbm9zdGljXG4gKiBAcGFyYW0gZmlsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbmdEaWFnbm9zdGljVG9Uc0RpYWdub3N0aWMoXG4gICAgZDogbmcuRGlhZ25vc3RpYywgZmlsZTogdHMuU291cmNlRmlsZSB8IHVuZGVmaW5lZCk6IHRzLkRpYWdub3N0aWMge1xuICByZXR1cm4ge1xuICAgIGZpbGUsXG4gICAgc3RhcnQ6IGQuc3Bhbi5zdGFydCxcbiAgICBsZW5ndGg6IGQuc3Bhbi5lbmQgLSBkLnNwYW4uc3RhcnQsXG4gICAgbWVzc2FnZVRleHQ6IHR5cGVvZiBkLm1lc3NhZ2UgPT09ICdzdHJpbmcnID8gZC5tZXNzYWdlIDogY2hhaW5EaWFnbm9zdGljcyhkLm1lc3NhZ2UpLFxuICAgIGNhdGVnb3J5OiBkLmtpbmQsXG4gICAgY29kZTogMCxcbiAgICBzb3VyY2U6ICduZycsXG4gIH07XG59XG4iXX0=