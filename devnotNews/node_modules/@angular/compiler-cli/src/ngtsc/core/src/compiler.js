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
        define("@angular/compiler-cli/src/ngtsc/core/src/compiler", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/annotations", "@angular/compiler-cli/src/ngtsc/cycles", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/entry_point", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/incremental", "@angular/compiler-cli/src/ngtsc/indexer", "@angular/compiler-cli/src/ngtsc/metadata", "@angular/compiler-cli/src/ngtsc/modulewithproviders", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/perf", "@angular/compiler-cli/src/ngtsc/reflection", "@angular/compiler-cli/src/ngtsc/resource", "@angular/compiler-cli/src/ngtsc/routing", "@angular/compiler-cli/src/ngtsc/scope", "@angular/compiler-cli/src/ngtsc/shims", "@angular/compiler-cli/src/ngtsc/switch", "@angular/compiler-cli/src/ngtsc/transform", "@angular/compiler-cli/src/ngtsc/typecheck", "@angular/compiler-cli/src/ngtsc/util/src/typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var annotations_1 = require("@angular/compiler-cli/src/ngtsc/annotations");
    var cycles_1 = require("@angular/compiler-cli/src/ngtsc/cycles");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var entry_point_1 = require("@angular/compiler-cli/src/ngtsc/entry_point");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var incremental_1 = require("@angular/compiler-cli/src/ngtsc/incremental");
    var indexer_1 = require("@angular/compiler-cli/src/ngtsc/indexer");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/metadata");
    var modulewithproviders_1 = require("@angular/compiler-cli/src/ngtsc/modulewithproviders");
    var partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    var perf_1 = require("@angular/compiler-cli/src/ngtsc/perf");
    var reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    var resource_1 = require("@angular/compiler-cli/src/ngtsc/resource");
    var routing_1 = require("@angular/compiler-cli/src/ngtsc/routing");
    var scope_1 = require("@angular/compiler-cli/src/ngtsc/scope");
    var shims_1 = require("@angular/compiler-cli/src/ngtsc/shims");
    var switch_1 = require("@angular/compiler-cli/src/ngtsc/switch");
    var transform_1 = require("@angular/compiler-cli/src/ngtsc/transform");
    var typecheck_1 = require("@angular/compiler-cli/src/ngtsc/typecheck");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    /**
     * The heart of the Angular Ivy compiler.
     *
     * The `NgCompiler` provides an API for performing Angular compilation within a custom TypeScript
     * compiler. Each instance of `NgCompiler` supports a single compilation, which might be
     * incremental.
     *
     * `NgCompiler` is lazy, and does not perform any of the work of the compilation until one of its
     * output methods (e.g. `getDiagnostics`) is called.
     *
     * See the README.md for more information.
     */
    var NgCompiler = /** @class */ (function () {
        function NgCompiler(host, options, tsProgram, oldProgram, perfRecorder) {
            var _a;
            var _this = this;
            if (oldProgram === void 0) { oldProgram = null; }
            if (perfRecorder === void 0) { perfRecorder = perf_1.NOOP_PERF_RECORDER; }
            this.host = host;
            this.options = options;
            this.tsProgram = tsProgram;
            this.perfRecorder = perfRecorder;
            /**
             * Lazily evaluated state of the compilation.
             *
             * This is created on demand by calling `ensureAnalyzed`.
             */
            this.compilation = null;
            /**
             * Any diagnostics related to the construction of the compilation.
             *
             * These are diagnostics which arose during setup of the host and/or program.
             */
            this.constructionDiagnostics = [];
            /**
             * Semantic diagnostics related to the program itself.
             *
             * This is set by (and memoizes) `getDiagnostics`.
             */
            this.diagnostics = null;
            (_a = this.constructionDiagnostics).push.apply(_a, tslib_1.__spread(this.host.diagnostics));
            var incompatibleTypeCheckOptionsDiagnostic = verifyCompatibleTypeCheckOptions(this.options);
            if (incompatibleTypeCheckOptionsDiagnostic !== null) {
                this.constructionDiagnostics.push(incompatibleTypeCheckOptionsDiagnostic);
            }
            this.nextProgram = tsProgram;
            this.closureCompilerEnabled = !!this.options.annotateForClosureCompiler;
            this.entryPoint =
                host.entryPoint !== null ? typescript_1.getSourceFileOrNull(tsProgram, host.entryPoint) : null;
            this.typeCheckFile = file_system_1.getSourceFileOrError(tsProgram, host.typeCheckFile);
            var moduleResolutionCache = ts.createModuleResolutionCache(this.host.getCurrentDirectory(), function (fileName) { return _this.host.getCanonicalFileName(fileName); });
            this.moduleResolver =
                new imports_1.ModuleResolver(tsProgram, this.options, this.host, moduleResolutionCache);
            this.resourceManager = new resource_1.HostResourceLoader(host, this.options);
            this.cycleAnalyzer = new cycles_1.CycleAnalyzer(new cycles_1.ImportGraph(this.moduleResolver));
            var modifiedResourceFiles = null;
            if (this.host.getModifiedResourceFiles !== undefined) {
                modifiedResourceFiles = this.host.getModifiedResourceFiles() || null;
            }
            if (oldProgram === null) {
                this.incrementalDriver = incremental_1.IncrementalDriver.fresh(tsProgram);
            }
            else {
                var oldDriver = getIncrementalDriver(oldProgram);
                if (oldDriver !== null) {
                    this.incrementalDriver =
                        incremental_1.IncrementalDriver.reconcile(oldProgram, oldDriver, tsProgram, modifiedResourceFiles);
                }
                else {
                    // A previous ts.Program was used to create the current one, but it wasn't from an
                    // `NgCompiler`. That doesn't hurt anything, but the Angular analysis will have to start
                    // from a fresh state.
                    this.incrementalDriver = incremental_1.IncrementalDriver.fresh(tsProgram);
                }
            }
            setIncrementalDriver(tsProgram, this.incrementalDriver);
        }
        /**
         * Get all Angular-related diagnostics for this compilation.
         *
         * If a `ts.SourceFile` is passed, only diagnostics related to that file are returned.
         */
        NgCompiler.prototype.getDiagnostics = function (file) {
            var _a;
            if (this.diagnostics === null) {
                var compilation = this.ensureAnalyzed();
                this.diagnostics = tslib_1.__spread(compilation.traitCompiler.diagnostics, this.getTemplateDiagnostics());
                if (this.entryPoint !== null && compilation.exportReferenceGraph !== null) {
                    (_a = this.diagnostics).push.apply(_a, tslib_1.__spread(entry_point_1.checkForPrivateExports(this.entryPoint, this.tsProgram.getTypeChecker(), compilation.exportReferenceGraph)));
                }
            }
            if (file === undefined) {
                return this.diagnostics;
            }
            else {
                return this.diagnostics.filter(function (diag) {
                    if (diag.file === file) {
                        return true;
                    }
                    else if (typecheck_1.isTemplateDiagnostic(diag) && diag.componentFile === file) {
                        // Template diagnostics are reported when diagnostics for the component file are
                        // requested (since no consumer of `getDiagnostics` would ever ask for diagnostics from
                        // the fake ts.SourceFile for templates).
                        return true;
                    }
                    else {
                        return false;
                    }
                });
            }
        };
        /**
         * Get all setup-related diagnostics for this compilation.
         */
        NgCompiler.prototype.getOptionDiagnostics = function () { return this.constructionDiagnostics; };
        /**
         * Get the `ts.Program` to use as a starting point when spawning a subsequent incremental
         * compilation.
         *
         * The `NgCompiler` spawns an internal incremental TypeScript compilation (inheriting the
         * consumer's `ts.Program` into a new one for the purposes of template type-checking). After this
         * operation, the consumer's `ts.Program` is no longer usable for starting a new incremental
         * compilation. `getNextProgram` retrieves the `ts.Program` which can be used instead.
         */
        NgCompiler.prototype.getNextProgram = function () { return this.nextProgram; };
        /**
         * Perform Angular's analysis step (as a precursor to `getDiagnostics` or `prepareEmit`)
         * asynchronously.
         *
         * Normally, this operation happens lazily whenever `getDiagnostics` or `prepareEmit` are called.
         * However, certain consumers may wish to allow for an asynchronous phase of analysis, where
         * resources such as `styleUrls` are resolved asynchonously. In these cases `analyzeAsync` must be
         * called first, and its `Promise` awaited prior to calling any other APIs of `NgCompiler`.
         */
        NgCompiler.prototype.analyzeAsync = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var analyzeSpan, promises, _loop_1, this_1, _a, _b, sf;
                var e_1, _c;
                var _this = this;
                return tslib_1.__generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (this.compilation !== null) {
                                return [2 /*return*/];
                            }
                            this.compilation = this.makeCompilation();
                            analyzeSpan = this.perfRecorder.start('analyze');
                            promises = [];
                            _loop_1 = function (sf) {
                                if (sf.isDeclarationFile) {
                                    return "continue";
                                }
                                var analyzeFileSpan = this_1.perfRecorder.start('analyzeFile', sf);
                                var analysisPromise = this_1.compilation.traitCompiler.analyzeAsync(sf);
                                this_1.scanForMwp(sf);
                                if (analysisPromise === undefined) {
                                    this_1.perfRecorder.stop(analyzeFileSpan);
                                }
                                else if (this_1.perfRecorder.enabled) {
                                    analysisPromise = analysisPromise.then(function () { return _this.perfRecorder.stop(analyzeFileSpan); });
                                }
                                if (analysisPromise !== undefined) {
                                    promises.push(analysisPromise);
                                }
                            };
                            this_1 = this;
                            try {
                                for (_a = tslib_1.__values(this.tsProgram.getSourceFiles()), _b = _a.next(); !_b.done; _b = _a.next()) {
                                    sf = _b.value;
                                    _loop_1(sf);
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                            return [4 /*yield*/, Promise.all(promises)];
                        case 1:
                            _d.sent();
                            this.perfRecorder.stop(analyzeSpan);
                            this.resolveCompilation(this.compilation.traitCompiler);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * List lazy routes detected during analysis.
         *
         * This can be called for one specific route, or to retrieve all top-level routes.
         */
        NgCompiler.prototype.listLazyRoutes = function (entryRoute) {
            if (entryRoute) {
                // Note:
                // This resolution step is here to match the implementation of the old `AotCompilerHost` (see
                // https://github.com/angular/angular/blob/50732e156/packages/compiler-cli/src/transformers/compiler_host.ts#L175-L188).
                //
                // `@angular/cli` will always call this API with an absolute path, so the resolution step is
                // not necessary, but keeping it backwards compatible in case someone else is using the API.
                // Relative entry paths are disallowed.
                if (entryRoute.startsWith('.')) {
                    throw new Error("Failed to list lazy routes: Resolution of relative paths (" + entryRoute + ") is not supported.");
                }
                // Non-relative entry paths fall into one of the following categories:
                // - Absolute system paths (e.g. `/foo/bar/my-project/my-module`), which are unaffected by the
                //   logic below.
                // - Paths to enternal modules (e.g. `some-lib`).
                // - Paths mapped to directories in `tsconfig.json` (e.g. `shared/my-module`).
                //   (See https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping.)
                //
                // In all cases above, the `containingFile` argument is ignored, so we can just take the first
                // of the root files.
                var containingFile = this.tsProgram.getRootFileNames()[0];
                var _a = tslib_1.__read(entryRoute.split('#'), 2), entryPath = _a[0], moduleName = _a[1];
                var resolvedModule = typescript_1.resolveModuleName(entryPath, containingFile, this.options, this.host, null);
                if (resolvedModule) {
                    entryRoute = routing_1.entryPointKeyFor(resolvedModule.resolvedFileName, moduleName);
                }
            }
            var compilation = this.ensureAnalyzed();
            return compilation.routeAnalyzer.listLazyRoutes(entryRoute);
        };
        /**
         * Fetch transformers and other information which is necessary for a consumer to `emit` the
         * program with Angular-added definitions.
         */
        NgCompiler.prototype.prepareEmit = function () {
            var compilation = this.ensureAnalyzed();
            var coreImportsFrom = compilation.isCore ? getR3SymbolsFile(this.tsProgram) : null;
            var importRewriter;
            if (coreImportsFrom !== null) {
                importRewriter = new imports_1.R3SymbolsImportRewriter(coreImportsFrom.fileName);
            }
            else {
                importRewriter = new imports_1.NoopImportRewriter();
            }
            var before = [
                transform_1.ivyTransformFactory(compilation.traitCompiler, compilation.reflector, importRewriter, compilation.defaultImportTracker, compilation.isCore, this.closureCompilerEnabled),
                transform_1.aliasTransformFactory(compilation.traitCompiler.exportStatements),
                compilation.defaultImportTracker.importPreservingTransformer(),
            ];
            var afterDeclarations = [];
            if (compilation.dtsTransforms !== null) {
                afterDeclarations.push(transform_1.declarationTransformFactory(compilation.dtsTransforms, importRewriter));
            }
            // Only add aliasing re-exports to the .d.ts output if the `AliasingHost` requests it.
            if (compilation.aliasingHost !== null && compilation.aliasingHost.aliasExportsInDts) {
                afterDeclarations.push(transform_1.aliasTransformFactory(compilation.traitCompiler.exportStatements));
            }
            if (this.host.factoryTracker !== null) {
                before.push(shims_1.generatedFactoryTransform(this.host.factoryTracker.sourceInfo, importRewriter));
            }
            before.push(switch_1.ivySwitchTransform);
            var ignoreFiles = new Set([this.typeCheckFile]);
            return { transformers: { before: before, afterDeclarations: afterDeclarations }, ignoreFiles: ignoreFiles };
        };
        /**
         * Run the indexing process and return a `Map` of all indexed components.
         *
         * See the `indexing` package for more details.
         */
        NgCompiler.prototype.getIndexedComponents = function () {
            var compilation = this.ensureAnalyzed();
            var context = new indexer_1.IndexingContext();
            compilation.traitCompiler.index(context);
            return indexer_1.generateAnalysis(context);
        };
        NgCompiler.prototype.ensureAnalyzed = function () {
            if (this.compilation === null) {
                this.analyzeSync();
            }
            return this.compilation;
        };
        NgCompiler.prototype.analyzeSync = function () {
            var e_2, _a;
            var analyzeSpan = this.perfRecorder.start('analyze');
            this.compilation = this.makeCompilation();
            try {
                for (var _b = tslib_1.__values(this.tsProgram.getSourceFiles()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var sf = _c.value;
                    if (sf.isDeclarationFile) {
                        continue;
                    }
                    var analyzeFileSpan = this.perfRecorder.start('analyzeFile', sf);
                    this.compilation.traitCompiler.analyzeSync(sf);
                    this.scanForMwp(sf);
                    this.perfRecorder.stop(analyzeFileSpan);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.perfRecorder.stop(analyzeSpan);
            this.resolveCompilation(this.compilation.traitCompiler);
        };
        NgCompiler.prototype.resolveCompilation = function (traitCompiler) {
            traitCompiler.resolve();
            this.recordNgModuleScopeDependencies();
            // At this point, analysis is complete and the compiler can now calculate which files need to
            // be emitted, so do that.
            this.incrementalDriver.recordSuccessfulAnalysis(traitCompiler);
        };
        NgCompiler.prototype.getTemplateDiagnostics = function () {
            var host = this.host;
            // Determine the strictness level of type checking based on compiler options. As
            // `strictTemplates` is a superset of `fullTemplateTypeCheck`, the former implies the latter.
            // Also see `verifyCompatibleTypeCheckOptions` where it is verified that `fullTemplateTypeCheck`
            // is not disabled when `strictTemplates` is enabled.
            var strictTemplates = !!this.options.strictTemplates;
            var fullTemplateTypeCheck = strictTemplates || !!this.options.fullTemplateTypeCheck;
            // Skip template type-checking if it's disabled.
            if (this.options.ivyTemplateTypeCheck === false && !fullTemplateTypeCheck) {
                return [];
            }
            var compilation = this.ensureAnalyzed();
            // Run template type-checking.
            // First select a type-checking configuration, based on whether full template type-checking is
            // requested.
            var typeCheckingConfig;
            if (fullTemplateTypeCheck) {
                typeCheckingConfig = {
                    applyTemplateContextGuards: strictTemplates,
                    checkQueries: false,
                    checkTemplateBodies: true,
                    checkTypeOfInputBindings: strictTemplates,
                    strictNullInputBindings: strictTemplates,
                    checkTypeOfAttributes: strictTemplates,
                    // Even in full template type-checking mode, DOM binding checks are not quite ready yet.
                    checkTypeOfDomBindings: false,
                    checkTypeOfOutputEvents: strictTemplates,
                    checkTypeOfAnimationEvents: strictTemplates,
                    // Checking of DOM events currently has an adverse effect on developer experience,
                    // e.g. for `<input (blur)="update($event.target.value)">` enabling this check results in:
                    // - error TS2531: Object is possibly 'null'.
                    // - error TS2339: Property 'value' does not exist on type 'EventTarget'.
                    checkTypeOfDomEvents: strictTemplates,
                    checkTypeOfDomReferences: strictTemplates,
                    // Non-DOM references have the correct type in View Engine so there is no strictness flag.
                    checkTypeOfNonDomReferences: true,
                    // Pipes are checked in View Engine so there is no strictness flag.
                    checkTypeOfPipes: true,
                    strictSafeNavigationTypes: strictTemplates,
                    useContextGenericType: strictTemplates,
                };
            }
            else {
                typeCheckingConfig = {
                    applyTemplateContextGuards: false,
                    checkQueries: false,
                    checkTemplateBodies: false,
                    checkTypeOfInputBindings: false,
                    strictNullInputBindings: false,
                    checkTypeOfAttributes: false,
                    checkTypeOfDomBindings: false,
                    checkTypeOfOutputEvents: false,
                    checkTypeOfAnimationEvents: false,
                    checkTypeOfDomEvents: false,
                    checkTypeOfDomReferences: false,
                    checkTypeOfNonDomReferences: false,
                    checkTypeOfPipes: false,
                    strictSafeNavigationTypes: false,
                    useContextGenericType: false,
                };
            }
            // Apply explicitly configured strictness flags on top of the default configuration
            // based on "fullTemplateTypeCheck".
            if (this.options.strictInputTypes !== undefined) {
                typeCheckingConfig.checkTypeOfInputBindings = this.options.strictInputTypes;
                typeCheckingConfig.applyTemplateContextGuards = this.options.strictInputTypes;
            }
            if (this.options.strictNullInputTypes !== undefined) {
                typeCheckingConfig.strictNullInputBindings = this.options.strictNullInputTypes;
            }
            if (this.options.strictOutputEventTypes !== undefined) {
                typeCheckingConfig.checkTypeOfOutputEvents = this.options.strictOutputEventTypes;
                typeCheckingConfig.checkTypeOfAnimationEvents = this.options.strictOutputEventTypes;
            }
            if (this.options.strictDomEventTypes !== undefined) {
                typeCheckingConfig.checkTypeOfDomEvents = this.options.strictDomEventTypes;
            }
            if (this.options.strictSafeNavigationTypes !== undefined) {
                typeCheckingConfig.strictSafeNavigationTypes = this.options.strictSafeNavigationTypes;
            }
            if (this.options.strictDomLocalRefTypes !== undefined) {
                typeCheckingConfig.checkTypeOfDomReferences = this.options.strictDomLocalRefTypes;
            }
            if (this.options.strictAttributeTypes !== undefined) {
                typeCheckingConfig.checkTypeOfAttributes = this.options.strictAttributeTypes;
            }
            if (this.options.strictContextGenerics !== undefined) {
                typeCheckingConfig.useContextGenericType = this.options.strictContextGenerics;
            }
            // Execute the typeCheck phase of each decorator in the program.
            var prepSpan = this.perfRecorder.start('typeCheckPrep');
            var ctx = new typecheck_1.TypeCheckContext(typeCheckingConfig, compilation.refEmitter, compilation.reflector, host.typeCheckFile);
            compilation.traitCompiler.typeCheck(ctx);
            this.perfRecorder.stop(prepSpan);
            // Get the diagnostics.
            var typeCheckSpan = this.perfRecorder.start('typeCheckDiagnostics');
            var _a = ctx.calculateTemplateDiagnostics(this.tsProgram, this.host, this.options), diagnostics = _a.diagnostics, program = _a.program;
            this.perfRecorder.stop(typeCheckSpan);
            setIncrementalDriver(program, this.incrementalDriver);
            this.nextProgram = program;
            return diagnostics;
        };
        /**
         * Reifies the inter-dependencies of NgModules and the components within their compilation scopes
         * into the `IncrementalDriver`'s dependency graph.
         */
        NgCompiler.prototype.recordNgModuleScopeDependencies = function () {
            var e_3, _a, e_4, _b, e_5, _c;
            var recordSpan = this.perfRecorder.start('recordDependencies');
            var depGraph = this.incrementalDriver.depGraph;
            try {
                for (var _d = tslib_1.__values(this.compilation.scopeRegistry.getCompilationScopes()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var scope = _e.value;
                    var file = scope.declaration.getSourceFile();
                    var ngModuleFile = scope.ngModule.getSourceFile();
                    // A change to any dependency of the declaration causes the declaration to be invalidated,
                    // which requires the NgModule to be invalidated as well.
                    depGraph.addTransitiveDependency(ngModuleFile, file);
                    // A change to the NgModule file should cause the declaration itself to be invalidated.
                    depGraph.addDependency(file, ngModuleFile);
                    var meta = this.compilation.metaReader.getDirectiveMetadata(new imports_1.Reference(scope.declaration));
                    if (meta !== null && meta.isComponent) {
                        // If a component's template changes, it might have affected the import graph, and thus the
                        // remote scoping feature which is activated in the event of potential import cycles. Thus,
                        // the module depends not only on the transitive dependencies of the component, but on its
                        // resources as well.
                        depGraph.addTransitiveResources(ngModuleFile, file);
                        try {
                            // A change to any directive/pipe in the compilation scope should cause the component to be
                            // invalidated.
                            for (var _f = (e_4 = void 0, tslib_1.__values(scope.directives)), _g = _f.next(); !_g.done; _g = _f.next()) {
                                var directive = _g.value;
                                // When a directive in scope is updated, the component needs to be recompiled as e.g. a
                                // selector may have changed.
                                depGraph.addTransitiveDependency(file, directive.ref.node.getSourceFile());
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        try {
                            for (var _h = (e_5 = void 0, tslib_1.__values(scope.pipes)), _j = _h.next(); !_j.done; _j = _h.next()) {
                                var pipe = _j.value;
                                // When a pipe in scope is updated, the component needs to be recompiled as e.g. the
                                // pipe's name may have changed.
                                depGraph.addTransitiveDependency(file, pipe.ref.node.getSourceFile());
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_3) throw e_3.error; }
            }
            this.perfRecorder.stop(recordSpan);
        };
        NgCompiler.prototype.scanForMwp = function (sf) {
            var _this = this;
            this.compilation.mwpScanner.scan(sf, {
                addTypeReplacement: function (node, type) {
                    // Only obtain the return type transform for the source file once there's a type to replace,
                    // so that no transform is allocated when there's nothing to do.
                    _this.compilation.dtsTransforms.getReturnTypeTransform(sf).addTypeReplacement(node, type);
                }
            });
        };
        NgCompiler.prototype.makeCompilation = function () {
            var checker = this.tsProgram.getTypeChecker();
            var reflector = new reflection_1.TypeScriptReflectionHost(checker);
            // Construct the ReferenceEmitter.
            var refEmitter;
            var aliasingHost = null;
            if (this.host.unifiedModulesHost === null || !this.options._useHostForImportGeneration) {
                var localImportStrategy = void 0;
                // The strategy used for local, in-project imports depends on whether TS has been configured
                // with rootDirs. If so, then multiple directories may be mapped in the same "module
                // namespace" and the logic of `LogicalProjectStrategy` is required to generate correct
                // imports which may cross these multiple directories. Otherwise, plain relative imports are
                // sufficient.
                if (this.options.rootDir !== undefined ||
                    (this.options.rootDirs !== undefined && this.options.rootDirs.length > 0)) {
                    // rootDirs logic is in effect - use the `LogicalProjectStrategy` for in-project relative
                    // imports.
                    localImportStrategy =
                        new imports_1.LogicalProjectStrategy(reflector, new file_system_1.LogicalFileSystem(tslib_1.__spread(this.host.rootDirs)));
                }
                else {
                    // Plain relative imports are all that's needed.
                    localImportStrategy = new imports_1.RelativePathStrategy(reflector);
                }
                // The CompilerHost doesn't have fileNameToModuleName, so build an NPM-centric reference
                // resolution strategy.
                refEmitter = new imports_1.ReferenceEmitter([
                    // First, try to use local identifiers if available.
                    new imports_1.LocalIdentifierStrategy(),
                    // Next, attempt to use an absolute import.
                    new imports_1.AbsoluteModuleStrategy(this.tsProgram, checker, this.moduleResolver, reflector),
                    // Finally, check if the reference is being written into a file within the project's .ts
                    // sources, and use a relative import if so. If this fails, ReferenceEmitter will throw
                    // an error.
                    localImportStrategy,
                ]);
                // If an entrypoint is present, then all user imports should be directed through the
                // entrypoint and private exports are not needed. The compiler will validate that all publicly
                // visible directives/pipes are importable via this entrypoint.
                if (this.entryPoint === null && this.options.generateDeepReexports === true) {
                    // No entrypoint is present and deep re-exports were requested, so configure the aliasing
                    // system to generate them.
                    aliasingHost = new imports_1.PrivateExportAliasingHost(reflector);
                }
            }
            else {
                // The CompilerHost supports fileNameToModuleName, so use that to emit imports.
                refEmitter = new imports_1.ReferenceEmitter([
                    // First, try to use local identifiers if available.
                    new imports_1.LocalIdentifierStrategy(),
                    // Then use aliased references (this is a workaround to StrictDeps checks).
                    new imports_1.AliasStrategy(),
                    // Then use fileNameToModuleName to emit imports.
                    new imports_1.UnifiedModulesStrategy(reflector, this.host.unifiedModulesHost),
                ]);
                aliasingHost = new imports_1.UnifiedModulesAliasingHost(this.host.unifiedModulesHost);
            }
            var evaluator = new partial_evaluator_1.PartialEvaluator(reflector, checker, this.incrementalDriver.depGraph);
            var dtsReader = new metadata_1.DtsMetadataReader(checker, reflector);
            var localMetaRegistry = new metadata_1.LocalMetadataRegistry();
            var localMetaReader = localMetaRegistry;
            var depScopeReader = new scope_1.MetadataDtsModuleScopeResolver(dtsReader, aliasingHost);
            var scopeRegistry = new scope_1.LocalModuleScopeRegistry(localMetaReader, depScopeReader, refEmitter, aliasingHost);
            var scopeReader = scopeRegistry;
            var metaRegistry = new metadata_1.CompoundMetadataRegistry([localMetaRegistry, scopeRegistry]);
            var injectableRegistry = new metadata_1.InjectableClassRegistry(reflector);
            var metaReader = new metadata_1.CompoundMetadataReader([localMetaReader, dtsReader]);
            // If a flat module entrypoint was specified, then track references via a `ReferenceGraph` in
            // order to produce proper diagnostics for incorrectly exported directives/pipes/etc. If there
            // is no flat module entrypoint then don't pay the cost of tracking references.
            var referencesRegistry;
            var exportReferenceGraph = null;
            if (this.entryPoint !== null) {
                exportReferenceGraph = new entry_point_1.ReferenceGraph();
                referencesRegistry = new ReferenceGraphAdapter(exportReferenceGraph);
            }
            else {
                referencesRegistry = new annotations_1.NoopReferencesRegistry();
            }
            var routeAnalyzer = new routing_1.NgModuleRouteAnalyzer(this.moduleResolver, evaluator);
            var dtsTransforms = new transform_1.DtsTransformRegistry();
            var mwpScanner = new modulewithproviders_1.ModuleWithProvidersScanner(reflector, evaluator, refEmitter);
            var isCore = isAngularCorePackage(this.tsProgram);
            var defaultImportTracker = new imports_1.DefaultImportTracker();
            // Set up the IvyCompilation, which manages state for the Ivy transformer.
            var handlers = [
                new annotations_1.ComponentDecoratorHandler(reflector, evaluator, metaRegistry, metaReader, scopeReader, scopeRegistry, isCore, this.resourceManager, this.host.rootDirs, this.options.preserveWhitespaces || false, this.options.i18nUseExternalIds !== false, this.options.enableI18nLegacyMessageIdFormat !== false, this.moduleResolver, this.cycleAnalyzer, refEmitter, defaultImportTracker, this.incrementalDriver.depGraph, injectableRegistry, this.closureCompilerEnabled),
                // TODO(alxhub): understand why the cast here is necessary (something to do with `null`
                // not being assignable to `unknown` when wrapped in `Readonly`).
                // clang-format off
                new annotations_1.DirectiveDecoratorHandler(reflector, evaluator, metaRegistry, scopeRegistry, metaReader, defaultImportTracker, injectableRegistry, isCore, this.closureCompilerEnabled),
                // clang-format on
                // Pipe handler must be before injectable handler in list so pipe factories are printed
                // before injectable factories (so injectable factories can delegate to them)
                new annotations_1.PipeDecoratorHandler(reflector, evaluator, metaRegistry, scopeRegistry, defaultImportTracker, injectableRegistry, isCore),
                new annotations_1.InjectableDecoratorHandler(reflector, defaultImportTracker, isCore, this.options.strictInjectionParameters || false, injectableRegistry),
                new annotations_1.NgModuleDecoratorHandler(reflector, evaluator, metaReader, metaRegistry, scopeRegistry, referencesRegistry, isCore, routeAnalyzer, refEmitter, this.host.factoryTracker, defaultImportTracker, this.closureCompilerEnabled, injectableRegistry, this.options.i18nInLocale),
            ];
            var traitCompiler = new transform_1.TraitCompiler(handlers, reflector, this.perfRecorder, this.incrementalDriver, this.options.compileNonExportedClasses !== false, dtsTransforms);
            return {
                isCore: isCore, traitCompiler: traitCompiler, reflector: reflector, scopeRegistry: scopeRegistry,
                dtsTransforms: dtsTransforms, exportReferenceGraph: exportReferenceGraph, routeAnalyzer: routeAnalyzer, mwpScanner: mwpScanner,
                metaReader: metaReader, defaultImportTracker: defaultImportTracker, aliasingHost: aliasingHost, refEmitter: refEmitter,
            };
        };
        return NgCompiler;
    }());
    exports.NgCompiler = NgCompiler;
    /**
     * Determine if the given `Program` is @angular/core.
     */
    function isAngularCorePackage(program) {
        // Look for its_just_angular.ts somewhere in the program.
        var r3Symbols = getR3SymbolsFile(program);
        if (r3Symbols === null) {
            return false;
        }
        // Look for the constant ITS_JUST_ANGULAR in that file.
        return r3Symbols.statements.some(function (stmt) {
            // The statement must be a variable declaration statement.
            if (!ts.isVariableStatement(stmt)) {
                return false;
            }
            // It must be exported.
            if (stmt.modifiers === undefined ||
                !stmt.modifiers.some(function (mod) { return mod.kind === ts.SyntaxKind.ExportKeyword; })) {
                return false;
            }
            // It must declare ITS_JUST_ANGULAR.
            return stmt.declarationList.declarations.some(function (decl) {
                // The declaration must match the name.
                if (!ts.isIdentifier(decl.name) || decl.name.text !== 'ITS_JUST_ANGULAR') {
                    return false;
                }
                // It must initialize the variable to true.
                if (decl.initializer === undefined || decl.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
                    return false;
                }
                // This definition matches.
                return true;
            });
        });
    }
    /**
     * Find the 'r3_symbols.ts' file in the given `Program`, or return `null` if it wasn't there.
     */
    function getR3SymbolsFile(program) {
        return program.getSourceFiles().find(function (file) { return file.fileName.indexOf('r3_symbols.ts') >= 0; }) || null;
    }
    /**
     * Symbol under which the `IncrementalDriver` is stored on a `ts.Program`.
     *
     * The TS model of incremental compilation is based around reuse of a previous `ts.Program` in the
     * construction of a new one. The `NgCompiler` follows this abstraction - passing in a previous
     * `ts.Program` is sufficient to trigger incremental compilation. This previous `ts.Program` need
     * not be from an Angular compilation (that is, it need not have been created from `NgCompiler`).
     *
     * If it is, though, Angular can benefit from reusing previous analysis work. This reuse is managed
     * by the `IncrementalDriver`, which is inherited from the old program to the new program. To
     * support this behind the API of passing an old `ts.Program`, the `IncrementalDriver` is stored on
     * the `ts.Program` under this symbol.
     */
    var SYM_INCREMENTAL_DRIVER = Symbol('NgIncrementalDriver');
    /**
     * Get an `IncrementalDriver` from the given `ts.Program` if one is present.
     *
     * See `SYM_INCREMENTAL_DRIVER` for more details.
     */
    function getIncrementalDriver(program) {
        var driver = program[SYM_INCREMENTAL_DRIVER];
        if (driver === undefined || !(driver instanceof incremental_1.IncrementalDriver)) {
            return null;
        }
        return driver;
    }
    /**
     * Save the given `IncrementalDriver` onto the given `ts.Program`, for retrieval in a subsequent
     * incremental compilation.
     *
     * See `SYM_INCREMENTAL_DRIVER` for more details.
     */
    function setIncrementalDriver(program, driver) {
        program[SYM_INCREMENTAL_DRIVER] = driver;
    }
    /**
     * Since "strictTemplates" is a true superset of type checking capabilities compared to
     * "strictTemplateTypeCheck", it is required that the latter is not explicitly disabled if the
     * former is enabled.
     */
    function verifyCompatibleTypeCheckOptions(options) {
        if (options.fullTemplateTypeCheck === false && options.strictTemplates === true) {
            return {
                category: ts.DiagnosticCategory.Error,
                code: diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK),
                file: undefined,
                start: undefined,
                length: undefined,
                messageText: "Angular compiler option \"strictTemplates\" is enabled, however \"fullTemplateTypeCheck\" is disabled.\n\nHaving the \"strictTemplates\" flag enabled implies that \"fullTemplateTypeCheck\" is also enabled, so\nthe latter can not be explicitly disabled.\n\nOne of the following actions is required:\n1. Remove the \"fullTemplateTypeCheck\" option.\n2. Remove \"strictTemplates\" or set it to 'false'.\n\nMore information about the template type checking compiler options can be found in the documentation:\nhttps://v9.angular.io/guide/template-typecheck#template-type-checking",
            };
        }
        return null;
    }
    var ReferenceGraphAdapter = /** @class */ (function () {
        function ReferenceGraphAdapter(graph) {
            this.graph = graph;
        }
        ReferenceGraphAdapter.prototype.add = function (source) {
            var e_6, _a;
            var references = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                references[_i - 1] = arguments[_i];
            }
            try {
                for (var references_1 = tslib_1.__values(references), references_1_1 = references_1.next(); !references_1_1.done; references_1_1 = references_1.next()) {
                    var node = references_1_1.value.node;
                    var sourceFile = node.getSourceFile();
                    if (sourceFile === undefined) {
                        sourceFile = ts.getOriginalNode(node).getSourceFile();
                    }
                    // Only record local references (not references into .d.ts files).
                    if (sourceFile === undefined || !typescript_1.isDtsPath(sourceFile.fileName)) {
                        this.graph.add(source, node);
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (references_1_1 && !references_1_1.done && (_a = references_1.return)) _a.call(references_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
        };
        return ReferenceGraphAdapter;
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2NvcmUvc3JjL2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILCtCQUFpQztJQUVqQywyRUFBK007SUFDL00saUVBQXdEO0lBQ3hELDJFQUF5RDtJQUN6RCwyRUFBeUU7SUFDekUsMkVBQTBFO0lBQzFFLG1FQUErWDtJQUMvWCwyRUFBb0Q7SUFDcEQsbUVBQWtGO0lBQ2xGLHFFQUFtSztJQUNuSywyRkFBcUU7SUFDckUsdUZBQXlEO0lBQ3pELDZEQUE0RDtJQUM1RCx5RUFBMEQ7SUFDMUQscUVBQWtEO0lBQ2xELG1FQUFzRTtJQUN0RSwrREFBMkc7SUFDM0csK0RBQXNEO0lBQ3RELGlFQUFnRDtJQUNoRCx1RUFBK0o7SUFDL0osdUVBQTJGO0lBQzNGLGtGQUE0RjtJQTBCNUY7Ozs7Ozs7Ozs7O09BV0c7SUFDSDtRQStCRSxvQkFDWSxJQUFvQixFQUFVLE9BQTBCLEVBQ3hELFNBQXFCLEVBQUUsVUFBa0MsRUFDekQsWUFBK0M7O1lBSDNELGlCQTRDQztZQTFDa0MsMkJBQUEsRUFBQSxpQkFBa0M7WUFDekQsNkJBQUEsRUFBQSxlQUE2Qix5QkFBa0I7WUFGL0MsU0FBSSxHQUFKLElBQUksQ0FBZ0I7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFtQjtZQUN4RCxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUFtQztZQWpDM0Q7Ozs7ZUFJRztZQUNLLGdCQUFXLEdBQThCLElBQUksQ0FBQztZQUV0RDs7OztlQUlHO1lBQ0ssNEJBQXVCLEdBQW9CLEVBQUUsQ0FBQztZQUV0RDs7OztlQUlHO1lBQ0ssZ0JBQVcsR0FBeUIsSUFBSSxDQUFDO1lBZS9DLENBQUEsS0FBQSxJQUFJLENBQUMsdUJB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N0MsbUNBQUcsR0FBSCxVQUFJLE1BQXNCOztZQUFFLG9CQUEwQztpQkFBMUMsVUFBMEMsRUFBMUMscUJBQTBDLEVBQTFDLElBQTBDO2dCQUExQyxtQ0FBMEM7OztnQkFDcEUsS0FBcUIsSUFBQSxlQUFBLGlCQUFBLFVBQVUsQ0FBQSxzQ0FBQSw4REFBRTtvQkFBckIsSUFBQSxnQ0FBSTtvQkFDZCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RDLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTt3QkFDNUIsVUFBVSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7cUJBQ3ZEO29CQUVELGtFQUFrRTtvQkFDbEUsSUFBSSxVQUFVLEtBQUssU0FBUyxJQUFJLENBQUMsc0JBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQy9ELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztxQkFDOUI7aUJBQ0Y7Ozs7Ozs7OztRQUNILENBQUM7UUFDSCw0QkFBQztJQUFELENBQUMsQUFoQkQsSUFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVjb3JhdG9ySGFuZGxlciwgRGlyZWN0aXZlRGVjb3JhdG9ySGFuZGxlciwgSW5qZWN0YWJsZURlY29yYXRvckhhbmRsZXIsIE5nTW9kdWxlRGVjb3JhdG9ySGFuZGxlciwgTm9vcFJlZmVyZW5jZXNSZWdpc3RyeSwgUGlwZURlY29yYXRvckhhbmRsZXIsIFJlZmVyZW5jZXNSZWdpc3RyeX0gZnJvbSAnLi4vLi4vYW5ub3RhdGlvbnMnO1xuaW1wb3J0IHtDeWNsZUFuYWx5emVyLCBJbXBvcnRHcmFwaH0gZnJvbSAnLi4vLi4vY3ljbGVzJztcbmltcG9ydCB7RXJyb3JDb2RlLCBuZ0Vycm9yQ29kZX0gZnJvbSAnLi4vLi4vZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHtSZWZlcmVuY2VHcmFwaCwgY2hlY2tGb3JQcml2YXRlRXhwb3J0c30gZnJvbSAnLi4vLi4vZW50cnlfcG9pbnQnO1xuaW1wb3J0IHtMb2dpY2FsRmlsZVN5c3RlbSwgZ2V0U291cmNlRmlsZU9yRXJyb3J9IGZyb20gJy4uLy4uL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7QWJzb2x1dGVNb2R1bGVTdHJhdGVneSwgQWxpYXNTdHJhdGVneSwgQWxpYXNpbmdIb3N0LCBEZWZhdWx0SW1wb3J0VHJhY2tlciwgSW1wb3J0UmV3cml0ZXIsIExvY2FsSWRlbnRpZmllclN0cmF0ZWd5LCBMb2dpY2FsUHJvamVjdFN0cmF0ZWd5LCBNb2R1bGVSZXNvbHZlciwgTm9vcEltcG9ydFJld3JpdGVyLCBQcml2YXRlRXhwb3J0QWxpYXNpbmdIb3N0LCBSM1N5bWJvbHNJbXBvcnRSZXdyaXRlciwgUmVmZXJlbmNlLCBSZWZlcmVuY2VFbWl0U3RyYXRlZ3ksIFJlZmVyZW5jZUVtaXR0ZXIsIFJlbGF0aXZlUGF0aFN0cmF0ZWd5LCBVbmlmaWVkTW9kdWxlc0FsaWFzaW5nSG9zdCwgVW5pZmllZE1vZHVsZXNTdHJhdGVneX0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge0luY3JlbWVudGFsRHJpdmVyfSBmcm9tICcuLi8uLi9pbmNyZW1lbnRhbCc7XG5pbXBvcnQge0luZGV4ZWRDb21wb25lbnQsIEluZGV4aW5nQ29udGV4dCwgZ2VuZXJhdGVBbmFseXNpc30gZnJvbSAnLi4vLi4vaW5kZXhlcic7XG5pbXBvcnQge0NvbXBvdW5kTWV0YWRhdGFSZWFkZXIsIENvbXBvdW5kTWV0YWRhdGFSZWdpc3RyeSwgRHRzTWV0YWRhdGFSZWFkZXIsIEluamVjdGFibGVDbGFzc1JlZ2lzdHJ5LCBMb2NhbE1ldGFkYXRhUmVnaXN0cnksIE1ldGFkYXRhUmVhZGVyfSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge01vZHVsZVdpdGhQcm92aWRlcnNTY2FubmVyfSBmcm9tICcuLi8uLi9tb2R1bGV3aXRocHJvdmlkZXJzJztcbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvcn0gZnJvbSAnLi4vLi4vcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtOT09QX1BFUkZfUkVDT1JERVIsIFBlcmZSZWNvcmRlcn0gZnJvbSAnLi4vLi4vcGVyZic7XG5pbXBvcnQge1R5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5pbXBvcnQge0hvc3RSZXNvdXJjZUxvYWRlcn0gZnJvbSAnLi4vLi4vcmVzb3VyY2UnO1xuaW1wb3J0IHtOZ01vZHVsZVJvdXRlQW5hbHl6ZXIsIGVudHJ5UG9pbnRLZXlGb3J9IGZyb20gJy4uLy4uL3JvdXRpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRTY29wZVJlYWRlciwgTG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5LCBNZXRhZGF0YUR0c01vZHVsZVNjb3BlUmVzb2x2ZXJ9IGZyb20gJy4uLy4uL3Njb3BlJztcbmltcG9ydCB7Z2VuZXJhdGVkRmFjdG9yeVRyYW5zZm9ybX0gZnJvbSAnLi4vLi4vc2hpbXMnO1xuaW1wb3J0IHtpdnlTd2l0Y2hUcmFuc2Zvcm19IGZyb20gJy4uLy4uL3N3aXRjaCc7XG5pbXBvcnQge0RlY29yYXRvckhhbmRsZXIsIER0c1RyYW5zZm9ybVJlZ2lzdHJ5LCBUcmFpdENvbXBpbGVyLCBhbGlhc1RyYW5zZm9ybUZhY3RvcnksIGRlY2xhcmF0aW9uVHJhbnNmb3JtRmFjdG9yeSwgaXZ5VHJhbnNmb3JtRmFjdG9yeX0gZnJvbSAnLi4vLi4vdHJhbnNmb3JtJztcbmltcG9ydCB7VHlwZUNoZWNrQ29udGV4dCwgVHlwZUNoZWNraW5nQ29uZmlnLCBpc1RlbXBsYXRlRGlhZ25vc3RpY30gZnJvbSAnLi4vLi4vdHlwZWNoZWNrJztcbmltcG9ydCB7Z2V0U291cmNlRmlsZU9yTnVsbCwgaXNEdHNQYXRoLCByZXNvbHZlTW9kdWxlTmFtZX0gZnJvbSAnLi4vLi4vdXRpbC9zcmMvdHlwZXNjcmlwdCc7XG5pbXBvcnQge0xhenlSb3V0ZSwgTmdDb21waWxlck9wdGlvbnN9IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCB7TmdDb21waWxlckhvc3R9IGZyb20gJy4vaG9zdCc7XG5cblxuXG4vKipcbiAqIFN0YXRlIGluZm9ybWF0aW9uIGFib3V0IGEgY29tcGlsYXRpb24gd2hpY2ggaXMgb25seSBnZW5lcmF0ZWQgb25jZSBzb21lIGRhdGEgaXMgcmVxdWVzdGVkIGZyb21cbiAqIHRoZSBgTmdDb21waWxlcmAgKGZvciBleGFtcGxlLCBieSBjYWxsaW5nIGBnZXREaWFnbm9zdGljc2ApLlxuICovXG5pbnRlcmZhY2UgTGF6eUNvbXBpbGF0aW9uU3RhdGUge1xuICBpc0NvcmU6IGJvb2xlYW47XG4gIHRyYWl0Q29tcGlsZXI6IFRyYWl0Q29tcGlsZXI7XG4gIHJlZmxlY3RvcjogVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0O1xuICBtZXRhUmVhZGVyOiBNZXRhZGF0YVJlYWRlcjtcbiAgc2NvcGVSZWdpc3RyeTogTG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5O1xuICBleHBvcnRSZWZlcmVuY2VHcmFwaDogUmVmZXJlbmNlR3JhcGh8bnVsbDtcbiAgcm91dGVBbmFseXplcjogTmdNb2R1bGVSb3V0ZUFuYWx5emVyO1xuICBkdHNUcmFuc2Zvcm1zOiBEdHNUcmFuc2Zvcm1SZWdpc3RyeTtcbiAgbXdwU2Nhbm5lcjogTW9kdWxlV2l0aFByb3ZpZGVyc1NjYW5uZXI7XG4gIGRlZmF1bHRJbXBvcnRUcmFja2VyOiBEZWZhdWx0SW1wb3J0VHJhY2tlcjtcbiAgYWxpYXNpbmdIb3N0OiBBbGlhc2luZ0hvc3R8bnVsbDtcbiAgcmVmRW1pdHRlcjogUmVmZXJlbmNlRW1pdHRlcjtcbn1cblxuLyoqXG4gKiBUaGUgaGVhcnQgb2YgdGhlIEFuZ3VsYXIgSXZ5IGNvbXBpbGVyLlxuICpcbiAqIFRoZSBgTmdDb21waWxlcmAgcHJvdmlkZXMgYW4gQVBJIGZvciBwZXJmb3JtaW5nIEFuZ3VsYXIgY29tcGlsYXRpb24gd2l0aGluIGEgY3VzdG9tIFR5cGVTY3JpcHRcbiAqIGNvbXBpbGVyLiBFYWNoIGluc3RhbmNlIG9mIGBOZ0NvbXBpbGVyYCBzdXBwb3J0cyBhIHNpbmdsZSBjb21waWxhdGlvbiwgd2hpY2ggbWlnaHQgYmVcbiAqIGluY3JlbWVudGFsLlxuICpcbiAqIGBOZ0NvbXBpbGVyYCBpcyBsYXp5LCBhbmQgZG9lcyBub3QgcGVyZm9ybSBhbnkgb2YgdGhlIHdvcmsgb2YgdGhlIGNvbXBpbGF0aW9uIHVudGlsIG9uZSBvZiBpdHNcbiAqIG91dHB1dCBtZXRob2RzIChlLmcuIGBnZXREaWFnbm9zdGljc2ApIGlzIGNhbGxlZC5cbiAqXG4gKiBTZWUgdGhlIFJFQURNRS5tZCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIE5nQ29tcGlsZXIge1xuICAvKipcbiAgICogTGF6aWx5IGV2YWx1YXRlZCBzdGF0ZSBvZiB0aGUgY29tcGlsYXRpb24uXG4gICAqXG4gICAqIFRoaXMgaXMgY3JlYXRlZCBvbiBkZW1hbmQgYnkgY2FsbGluZyBgZW5zdXJlQW5hbHl6ZWRgLlxuICAgKi9cbiAgcHJpdmF0ZSBjb21waWxhdGlvbjogTGF6eUNvbXBpbGF0aW9uU3RhdGV8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEFueSBkaWFnbm9zdGljcyByZWxhdGVkIHRvIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGNvbXBpbGF0aW9uLlxuICAgKlxuICAgKiBUaGVzZSBhcmUgZGlhZ25vc3RpY3Mgd2hpY2ggYXJvc2UgZHVyaW5nIHNldHVwIG9mIHRoZSBob3N0IGFuZC9vciBwcm9ncmFtLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rpb25EaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdID0gW107XG5cbiAgLyoqXG4gICAqIFNlbWFudGljIGRpYWdub3N0aWNzIHJlbGF0ZWQgdG8gdGhlIHByb2dyYW0gaXRzZWxmLlxuICAgKlxuICAgKiBUaGlzIGlzIHNldCBieSAoYW5kIG1lbW9pemVzKSBgZ2V0RGlhZ25vc3RpY3NgLlxuICAgKi9cbiAgcHJpdmF0ZSBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgY2xvc3VyZUNvbXBpbGVyRW5hYmxlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSB0eXBlQ2hlY2tGaWxlOiB0cy5Tb3VyY2VGaWxlO1xuICBwcml2YXRlIG5leHRQcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICBwcml2YXRlIGVudHJ5UG9pbnQ6IHRzLlNvdXJjZUZpbGV8bnVsbDtcbiAgcHJpdmF0ZSBtb2R1bGVSZXNvbHZlcjogTW9kdWxlUmVzb2x2ZXI7XG4gIHByaXZhdGUgcmVzb3VyY2VNYW5hZ2VyOiBIb3N0UmVzb3VyY2VMb2FkZXI7XG4gIHByaXZhdGUgY3ljbGVBbmFseXplcjogQ3ljbGVBbmFseXplcjtcbiAgcmVhZG9ubHkgaW5jcmVtZW50YWxEcml2ZXI6IEluY3JlbWVudGFsRHJpdmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBob3N0OiBOZ0NvbXBpbGVySG9zdCwgcHJpdmF0ZSBvcHRpb25zOiBOZ0NvbXBpbGVyT3B0aW9ucyxcbiAgICAgIHByaXZhdGUgdHNQcm9ncmFtOiB0cy5Qcm9ncmFtLCBvbGRQcm9ncmFtOiB0cy5Qcm9ncmFtfG51bGwgPSBudWxsLFxuICAgICAgcHJpdmF0ZSBwZXJmUmVjb3JkZXI6IFBlcmZSZWNvcmRlciA9IE5PT1BfUEVSRl9SRUNPUkRFUikge1xuICAgIHRoaXMuY29uc3RydWN0aW9uRGlhZ25vc3RpY3MucHVzaCguLi50aGlzLmhvc3QuZGlhZ25vc3RpY3MpO1xuICAgIGNvbnN0IGluY29tcGF0aWJsZVR5cGVDaGVja09wdGlvbnNEaWFnbm9zdGljID0gdmVyaWZ5Q29tcGF0aWJsZVR5cGVDaGVja09wdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICBpZiAoaW5jb21wYXRpYmxlVHlwZUNoZWNrT3B0aW9uc0RpYWdub3N0aWMgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY29uc3RydWN0aW9uRGlhZ25vc3RpY3MucHVzaChpbmNvbXBhdGlibGVUeXBlQ2hlY2tPcHRpb25zRGlhZ25vc3RpYyk7XG4gICAgfVxuXG4gICAgdGhpcy5uZXh0UHJvZ3JhbSA9IHRzUHJvZ3JhbTtcbiAgICB0aGlzLmNsb3N1cmVDb21waWxlckVuYWJsZWQgPSAhIXRoaXMub3B0aW9ucy5hbm5vdGF0ZUZvckNsb3N1cmVDb21waWxlcjtcblxuICAgIHRoaXMuZW50cnlQb2ludCA9XG4gICAgICAgIGhvc3QuZW50cnlQb2ludCAhPT0gbnVsbCA/IGdldFNvdXJjZUZpbGVPck51bGwodHNQcm9ncmFtLCBob3N0LmVudHJ5UG9pbnQpIDogbnVsbDtcblxuICAgIHRoaXMudHlwZUNoZWNrRmlsZSA9IGdldFNvdXJjZUZpbGVPckVycm9yKHRzUHJvZ3JhbSwgaG9zdC50eXBlQ2hlY2tGaWxlKTtcbiAgICBjb25zdCBtb2R1bGVSZXNvbHV0aW9uQ2FjaGUgPSB0cy5jcmVhdGVNb2R1bGVSZXNvbHV0aW9uQ2FjaGUoXG4gICAgICAgIHRoaXMuaG9zdC5nZXRDdXJyZW50RGlyZWN0b3J5KCksIGZpbGVOYW1lID0+IHRoaXMuaG9zdC5nZXRDYW5vbmljYWxGaWxlTmFtZShmaWxlTmFtZSkpO1xuICAgIHRoaXMubW9kdWxlUmVzb2x2ZXIgPVxuICAgICAgICBuZXcgTW9kdWxlUmVzb2x2ZXIodHNQcm9ncmFtLCB0aGlzLm9wdGlvbnMsIHRoaXMuaG9zdCwgbW9kdWxlUmVzb2x1dGlvbkNhY2hlKTtcbiAgICB0aGlzLnJlc291cmNlTWFuYWdlciA9IG5ldyBIb3N0UmVzb3VyY2VMb2FkZXIoaG9zdCwgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmN5Y2xlQW5hbHl6ZXIgPSBuZXcgQ3ljbGVBbmFseXplcihuZXcgSW1wb3J0R3JhcGgodGhpcy5tb2R1bGVSZXNvbHZlcikpO1xuXG4gICAgbGV0IG1vZGlmaWVkUmVzb3VyY2VGaWxlczogU2V0PHN0cmluZz58bnVsbCA9IG51bGw7XG4gICAgaWYgKHRoaXMuaG9zdC5nZXRNb2RpZmllZFJlc291cmNlRmlsZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbW9kaWZpZWRSZXNvdXJjZUZpbGVzID0gdGhpcy5ob3N0LmdldE1vZGlmaWVkUmVzb3VyY2VGaWxlcygpIHx8IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKG9sZFByb2dyYW0gPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5jcmVtZW50YWxEcml2ZXIgPSBJbmNyZW1lbnRhbERyaXZlci5mcmVzaCh0c1Byb2dyYW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBvbGREcml2ZXIgPSBnZXRJbmNyZW1lbnRhbERyaXZlcihvbGRQcm9ncmFtKTtcbiAgICAgIGlmIChvbGREcml2ZXIgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5pbmNyZW1lbnRhbERyaXZlciA9XG4gICAgICAgICAgICBJbmNyZW1lbnRhbERyaXZlci5yZWNvbmNpbGUob2xkUHJvZ3JhbSwgb2xkRHJpdmVyLCB0c1Byb2dyYW0sIG1vZGlmaWVkUmVzb3VyY2VGaWxlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBIHByZXZpb3VzIHRzLlByb2dyYW0gd2FzIHVzZWQgdG8gY3JlYXRlIHRoZSBjdXJyZW50IG9uZSwgYnV0IGl0IHdhc24ndCBmcm9tIGFuXG4gICAgICAgIC8vIGBOZ0NvbXBpbGVyYC4gVGhhdCBkb2Vzbid0IGh1cnQgYW55dGhpbmcsIGJ1dCB0aGUgQW5ndWxhciBhbmFseXNpcyB3aWxsIGhhdmUgdG8gc3RhcnRcbiAgICAgICAgLy8gZnJvbSBhIGZyZXNoIHN0YXRlLlxuICAgICAgICB0aGlzLmluY3JlbWVudGFsRHJpdmVyID0gSW5jcmVtZW50YWxEcml2ZXIuZnJlc2godHNQcm9ncmFtKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2V0SW5jcmVtZW50YWxEcml2ZXIodHNQcm9ncmFtLCB0aGlzLmluY3JlbWVudGFsRHJpdmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIEFuZ3VsYXItcmVsYXRlZCBkaWFnbm9zdGljcyBmb3IgdGhpcyBjb21waWxhdGlvbi5cbiAgICpcbiAgICogSWYgYSBgdHMuU291cmNlRmlsZWAgaXMgcGFzc2VkLCBvbmx5IGRpYWdub3N0aWNzIHJlbGF0ZWQgdG8gdGhhdCBmaWxlIGFyZSByZXR1cm5lZC5cbiAgICovXG4gIGdldERpYWdub3N0aWNzKGZpbGU/OiB0cy5Tb3VyY2VGaWxlKTogdHMuRGlhZ25vc3RpY1tdIHtcbiAgICBpZiAodGhpcy5kaWFnbm9zdGljcyA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgY29tcGlsYXRpb24gPSB0aGlzLmVuc3VyZUFuYWx5emVkKCk7XG4gICAgICB0aGlzLmRpYWdub3N0aWNzID1cbiAgICAgICAgICBbLi4uY29tcGlsYXRpb24udHJhaXRDb21waWxlci5kaWFnbm9zdGljcywgLi4udGhpcy5nZXRUZW1wbGF0ZURpYWdub3N0aWNzKCldO1xuICAgICAgaWYgKHRoaXMuZW50cnlQb2ludCAhPT0gbnVsbCAmJiBjb21waWxhdGlvbi5leHBvcnRSZWZlcmVuY2VHcmFwaCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLmRpYWdub3N0aWNzLnB1c2goLi4uY2hlY2tGb3JQcml2YXRlRXhwb3J0cyhcbiAgICAgICAgICAgIHRoaXMuZW50cnlQb2ludCwgdGhpcy50c1Byb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKSwgY29tcGlsYXRpb24uZXhwb3J0UmVmZXJlbmNlR3JhcGgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaWFnbm9zdGljcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZGlhZ25vc3RpY3MuZmlsdGVyKGRpYWcgPT4ge1xuICAgICAgICBpZiAoZGlhZy5maWxlID09PSBmaWxlKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNUZW1wbGF0ZURpYWdub3N0aWMoZGlhZykgJiYgZGlhZy5jb21wb25lbnRGaWxlID09PSBmaWxlKSB7XG4gICAgICAgICAgLy8gVGVtcGxhdGUgZGlhZ25vc3RpY3MgYXJlIHJlcG9ydGVkIHdoZW4gZGlhZ25vc3RpY3MgZm9yIHRoZSBjb21wb25lbnQgZmlsZSBhcmVcbiAgICAgICAgICAvLyByZXF1ZXN0ZWQgKHNpbmNlIG5vIGNvbnN1bWVyIG9mIGBnZXREaWFnbm9zdGljc2Agd291bGQgZXZlciBhc2sgZm9yIGRpYWdub3N0aWNzIGZyb21cbiAgICAgICAgICAvLyB0aGUgZmFrZSB0cy5Tb3VyY2VGaWxlIGZvciB0ZW1wbGF0ZXMpLlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgc2V0dXAtcmVsYXRlZCBkaWFnbm9zdGljcyBmb3IgdGhpcyBjb21waWxhdGlvbi5cbiAgICovXG4gIGdldE9wdGlvbkRpYWdub3N0aWNzKCk6IHRzLkRpYWdub3N0aWNbXSB7IHJldHVybiB0aGlzLmNvbnN0cnVjdGlvbkRpYWdub3N0aWNzOyB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYHRzLlByb2dyYW1gIHRvIHVzZSBhcyBhIHN0YXJ0aW5nIHBvaW50IHdoZW4gc3Bhd25pbmcgYSBzdWJzZXF1ZW50IGluY3JlbWVudGFsXG4gICAqIGNvbXBpbGF0aW9uLlxuICAgKlxuICAgKiBUaGUgYE5nQ29tcGlsZXJgIHNwYXducyBhbiBpbnRlcm5hbCBpbmNyZW1lbnRhbCBUeXBlU2NyaXB0IGNvbXBpbGF0aW9uIChpbmhlcml0aW5nIHRoZVxuICAgKiBjb25zdW1lcidzIGB0cy5Qcm9ncmFtYCBpbnRvIGEgbmV3IG9uZSBmb3IgdGhlIHB1cnBvc2VzIG9mIHRlbXBsYXRlIHR5cGUtY2hlY2tpbmcpLiBBZnRlciB0aGlzXG4gICAqIG9wZXJhdGlvbiwgdGhlIGNvbnN1bWVyJ3MgYHRzLlByb2dyYW1gIGlzIG5vIGxvbmdlciB1c2FibGUgZm9yIHN0YXJ0aW5nIGEgbmV3IGluY3JlbWVudGFsXG4gICAqIGNvbXBpbGF0aW9uLiBgZ2V0TmV4dFByb2dyYW1gIHJldHJpZXZlcyB0aGUgYHRzLlByb2dyYW1gIHdoaWNoIGNhbiBiZSB1c2VkIGluc3RlYWQuXG4gICAqL1xuICBnZXROZXh0UHJvZ3JhbSgpOiB0cy5Qcm9ncmFtIHsgcmV0dXJuIHRoaXMubmV4dFByb2dyYW07IH1cblxuICAvKipcbiAgICogUGVyZm9ybSBBbmd1bGFyJ3MgYW5hbHlzaXMgc3RlcCAoYXMgYSBwcmVjdXJzb3IgdG8gYGdldERpYWdub3N0aWNzYCBvciBgcHJlcGFyZUVtaXRgKVxuICAgKiBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICogTm9ybWFsbHksIHRoaXMgb3BlcmF0aW9uIGhhcHBlbnMgbGF6aWx5IHdoZW5ldmVyIGBnZXREaWFnbm9zdGljc2Agb3IgYHByZXBhcmVFbWl0YCBhcmUgY2FsbGVkLlxuICAgKiBIb3dldmVyLCBjZXJ0YWluIGNvbnN1bWVycyBtYXkgd2lzaCB0byBhbGxvdyBmb3IgYW4gYXN5bmNocm9ub3VzIHBoYXNlIG9mIGFuYWx5c2lzLCB3aGVyZVxuICAgKiByZXNvdXJjZXMgc3VjaCBhcyBgc3R5bGVVcmxzYCBhcmUgcmVzb2x2ZWQgYXN5bmNob25vdXNseS4gSW4gdGhlc2UgY2FzZXMgYGFuYWx5emVBc3luY2AgbXVzdCBiZVxuICAgKiBjYWxsZWQgZmlyc3QsIGFuZCBpdHMgYFByb21pc2VgIGF3YWl0ZWQgcHJpb3IgdG8gY2FsbGluZyBhbnkgb3RoZXIgQVBJcyBvZiBgTmdDb21waWxlcmAuXG4gICAqL1xuICBhc3luYyBhbmFseXplQXN5bmMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29tcGlsYXRpb24gIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb21waWxhdGlvbiA9IHRoaXMubWFrZUNvbXBpbGF0aW9uKCk7XG5cbiAgICBjb25zdCBhbmFseXplU3BhbiA9IHRoaXMucGVyZlJlY29yZGVyLnN0YXJ0KCdhbmFseXplJyk7XG4gICAgY29uc3QgcHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgc2Ygb2YgdGhpcy50c1Byb2dyYW0uZ2V0U291cmNlRmlsZXMoKSkge1xuICAgICAgaWYgKHNmLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhbmFseXplRmlsZVNwYW4gPSB0aGlzLnBlcmZSZWNvcmRlci5zdGFydCgnYW5hbHl6ZUZpbGUnLCBzZik7XG4gICAgICBsZXQgYW5hbHlzaXNQcm9taXNlID0gdGhpcy5jb21waWxhdGlvbi50cmFpdENvbXBpbGVyLmFuYWx5emVBc3luYyhzZik7XG4gICAgICB0aGlzLnNjYW5Gb3JNd3Aoc2YpO1xuICAgICAgaWYgKGFuYWx5c2lzUHJvbWlzZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGVyZlJlY29yZGVyLnN0b3AoYW5hbHl6ZUZpbGVTcGFuKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5wZXJmUmVjb3JkZXIuZW5hYmxlZCkge1xuICAgICAgICBhbmFseXNpc1Byb21pc2UgPSBhbmFseXNpc1Byb21pc2UudGhlbigoKSA9PiB0aGlzLnBlcmZSZWNvcmRlci5zdG9wKGFuYWx5emVGaWxlU3BhbikpO1xuICAgICAgfVxuICAgICAgaWYgKGFuYWx5c2lzUHJvbWlzZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goYW5hbHlzaXNQcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG5cbiAgICB0aGlzLnBlcmZSZWNvcmRlci5zdG9wKGFuYWx5emVTcGFuKTtcblxuICAgIHRoaXMucmVzb2x2ZUNvbXBpbGF0aW9uKHRoaXMuY29tcGlsYXRpb24udHJhaXRDb21waWxlcik7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBsYXp5IHJvdXRlcyBkZXRlY3RlZCBkdXJpbmcgYW5hbHlzaXMuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIGNhbGxlZCBmb3Igb25lIHNwZWNpZmljIHJvdXRlLCBvciB0byByZXRyaWV2ZSBhbGwgdG9wLWxldmVsIHJvdXRlcy5cbiAgICovXG4gIGxpc3RMYXp5Um91dGVzKGVudHJ5Um91dGU/OiBzdHJpbmcpOiBMYXp5Um91dGVbXSB7XG4gICAgaWYgKGVudHJ5Um91dGUpIHtcbiAgICAgIC8vIE5vdGU6XG4gICAgICAvLyBUaGlzIHJlc29sdXRpb24gc3RlcCBpcyBoZXJlIHRvIG1hdGNoIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgb2xkIGBBb3RDb21waWxlckhvc3RgIChzZWVcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi81MDczMmUxNTYvcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy90cmFuc2Zvcm1lcnMvY29tcGlsZXJfaG9zdC50cyNMMTc1LUwxODgpLlxuICAgICAgLy9cbiAgICAgIC8vIGBAYW5ndWxhci9jbGlgIHdpbGwgYWx3YXlzIGNhbGwgdGhpcyBBUEkgd2l0aCBhbiBhYnNvbHV0ZSBwYXRoLCBzbyB0aGUgcmVzb2x1dGlvbiBzdGVwIGlzXG4gICAgICAvLyBub3QgbmVjZXNzYXJ5LCBidXQga2VlcGluZyBpdCBiYWNrd2FyZHMgY29tcGF0aWJsZSBpbiBjYXNlIHNvbWVvbmUgZWxzZSBpcyB1c2luZyB0aGUgQVBJLlxuXG4gICAgICAvLyBSZWxhdGl2ZSBlbnRyeSBwYXRocyBhcmUgZGlzYWxsb3dlZC5cbiAgICAgIGlmIChlbnRyeVJvdXRlLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgRmFpbGVkIHRvIGxpc3QgbGF6eSByb3V0ZXM6IFJlc29sdXRpb24gb2YgcmVsYXRpdmUgcGF0aHMgKCR7ZW50cnlSb3V0ZX0pIGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vbi1yZWxhdGl2ZSBlbnRyeSBwYXRocyBmYWxsIGludG8gb25lIG9mIHRoZSBmb2xsb3dpbmcgY2F0ZWdvcmllczpcbiAgICAgIC8vIC0gQWJzb2x1dGUgc3lzdGVtIHBhdGhzIChlLmcuIGAvZm9vL2Jhci9teS1wcm9qZWN0L215LW1vZHVsZWApLCB3aGljaCBhcmUgdW5hZmZlY3RlZCBieSB0aGVcbiAgICAgIC8vICAgbG9naWMgYmVsb3cuXG4gICAgICAvLyAtIFBhdGhzIHRvIGVudGVybmFsIG1vZHVsZXMgKGUuZy4gYHNvbWUtbGliYCkuXG4gICAgICAvLyAtIFBhdGhzIG1hcHBlZCB0byBkaXJlY3RvcmllcyBpbiBgdHNjb25maWcuanNvbmAgKGUuZy4gYHNoYXJlZC9teS1tb2R1bGVgKS5cbiAgICAgIC8vICAgKFNlZSBodHRwczovL3d3dy50eXBlc2NyaXB0bGFuZy5vcmcvZG9jcy9oYW5kYm9vay9tb2R1bGUtcmVzb2x1dGlvbi5odG1sI3BhdGgtbWFwcGluZy4pXG4gICAgICAvL1xuICAgICAgLy8gSW4gYWxsIGNhc2VzIGFib3ZlLCB0aGUgYGNvbnRhaW5pbmdGaWxlYCBhcmd1bWVudCBpcyBpZ25vcmVkLCBzbyB3ZSBjYW4ganVzdCB0YWtlIHRoZSBmaXJzdFxuICAgICAgLy8gb2YgdGhlIHJvb3QgZmlsZXMuXG4gICAgICBjb25zdCBjb250YWluaW5nRmlsZSA9IHRoaXMudHNQcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKVswXTtcbiAgICAgIGNvbnN0IFtlbnRyeVBhdGgsIG1vZHVsZU5hbWVdID0gZW50cnlSb3V0ZS5zcGxpdCgnIycpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRNb2R1bGUgPVxuICAgICAgICAgIHJlc29sdmVNb2R1bGVOYW1lKGVudHJ5UGF0aCwgY29udGFpbmluZ0ZpbGUsIHRoaXMub3B0aW9ucywgdGhpcy5ob3N0LCBudWxsKTtcblxuICAgICAgaWYgKHJlc29sdmVkTW9kdWxlKSB7XG4gICAgICAgIGVudHJ5Um91dGUgPSBlbnRyeVBvaW50S2V5Rm9yKHJlc29sdmVkTW9kdWxlLnJlc29sdmVkRmlsZU5hbWUsIG1vZHVsZU5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbXBpbGF0aW9uID0gdGhpcy5lbnN1cmVBbmFseXplZCgpO1xuICAgIHJldHVybiBjb21waWxhdGlvbi5yb3V0ZUFuYWx5emVyLmxpc3RMYXp5Um91dGVzKGVudHJ5Um91dGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRyYW5zZm9ybWVycyBhbmQgb3RoZXIgaW5mb3JtYXRpb24gd2hpY2ggaXMgbmVjZXNzYXJ5IGZvciBhIGNvbnN1bWVyIHRvIGBlbWl0YCB0aGVcbiAgICogcHJvZ3JhbSB3aXRoIEFuZ3VsYXItYWRkZWQgZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcmVwYXJlRW1pdCgpOiB7XG4gICAgdHJhbnNmb3JtZXJzOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMsXG4gICAgaWdub3JlRmlsZXM6IFNldDx0cy5Tb3VyY2VGaWxlPixcbiAgfSB7XG4gICAgY29uc3QgY29tcGlsYXRpb24gPSB0aGlzLmVuc3VyZUFuYWx5emVkKCk7XG5cbiAgICBjb25zdCBjb3JlSW1wb3J0c0Zyb20gPSBjb21waWxhdGlvbi5pc0NvcmUgPyBnZXRSM1N5bWJvbHNGaWxlKHRoaXMudHNQcm9ncmFtKSA6IG51bGw7XG4gICAgbGV0IGltcG9ydFJld3JpdGVyOiBJbXBvcnRSZXdyaXRlcjtcbiAgICBpZiAoY29yZUltcG9ydHNGcm9tICE9PSBudWxsKSB7XG4gICAgICBpbXBvcnRSZXdyaXRlciA9IG5ldyBSM1N5bWJvbHNJbXBvcnRSZXdyaXRlcihjb3JlSW1wb3J0c0Zyb20uZmlsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbXBvcnRSZXdyaXRlciA9IG5ldyBOb29wSW1wb3J0UmV3cml0ZXIoKTtcbiAgICB9XG5cbiAgICBjb25zdCBiZWZvcmUgPSBbXG4gICAgICBpdnlUcmFuc2Zvcm1GYWN0b3J5KFxuICAgICAgICAgIGNvbXBpbGF0aW9uLnRyYWl0Q29tcGlsZXIsIGNvbXBpbGF0aW9uLnJlZmxlY3RvciwgaW1wb3J0UmV3cml0ZXIsXG4gICAgICAgICAgY29tcGlsYXRpb24uZGVmYXVsdEltcG9ydFRyYWNrZXIsIGNvbXBpbGF0aW9uLmlzQ29yZSwgdGhpcy5jbG9zdXJlQ29tcGlsZXJFbmFibGVkKSxcbiAgICAgIGFsaWFzVHJhbnNmb3JtRmFjdG9yeShjb21waWxhdGlvbi50cmFpdENvbXBpbGVyLmV4cG9ydFN0YXRlbWVudHMpLFxuICAgICAgY29tcGlsYXRpb24uZGVmYXVsdEltcG9ydFRyYWNrZXIuaW1wb3J0UHJlc2VydmluZ1RyYW5zZm9ybWVyKCksXG4gICAgXTtcblxuICAgIGNvbnN0IGFmdGVyRGVjbGFyYXRpb25zOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT5bXSA9IFtdO1xuICAgIGlmIChjb21waWxhdGlvbi5kdHNUcmFuc2Zvcm1zICE9PSBudWxsKSB7XG4gICAgICBhZnRlckRlY2xhcmF0aW9ucy5wdXNoKFxuICAgICAgICAgIGRlY2xhcmF0aW9uVHJhbnNmb3JtRmFjdG9yeShjb21waWxhdGlvbi5kdHNUcmFuc2Zvcm1zLCBpbXBvcnRSZXdyaXRlcikpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIGFsaWFzaW5nIHJlLWV4cG9ydHMgdG8gdGhlIC5kLnRzIG91dHB1dCBpZiB0aGUgYEFsaWFzaW5nSG9zdGAgcmVxdWVzdHMgaXQuXG4gICAgaWYgKGNvbXBpbGF0aW9uLmFsaWFzaW5nSG9zdCAhPT0gbnVsbCAmJiBjb21waWxhdGlvbi5hbGlhc2luZ0hvc3QuYWxpYXNFeHBvcnRzSW5EdHMpIHtcbiAgICAgIGFmdGVyRGVjbGFyYXRpb25zLnB1c2goYWxpYXNUcmFuc2Zvcm1GYWN0b3J5KGNvbXBpbGF0aW9uLnRyYWl0Q29tcGlsZXIuZXhwb3J0U3RhdGVtZW50cykpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhvc3QuZmFjdG9yeVRyYWNrZXIgIT09IG51bGwpIHtcbiAgICAgIGJlZm9yZS5wdXNoKGdlbmVyYXRlZEZhY3RvcnlUcmFuc2Zvcm0odGhpcy5ob3N0LmZhY3RvcnlUcmFja2VyLnNvdXJjZUluZm8sIGltcG9ydFJld3JpdGVyKSk7XG4gICAgfVxuICAgIGJlZm9yZS5wdXNoKGl2eVN3aXRjaFRyYW5zZm9ybSk7XG5cbiAgICBjb25zdCBpZ25vcmVGaWxlcyA9IG5ldyBTZXQ8dHMuU291cmNlRmlsZT4oW3RoaXMudHlwZUNoZWNrRmlsZV0pO1xuXG4gICAgcmV0dXJuIHt0cmFuc2Zvcm1lcnM6IHtiZWZvcmUsIGFmdGVyRGVjbGFyYXRpb25zfSBhcyB0cy5DdXN0b21UcmFuc2Zvcm1lcnMsIGlnbm9yZUZpbGVzfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gdGhlIGluZGV4aW5nIHByb2Nlc3MgYW5kIHJldHVybiBhIGBNYXBgIG9mIGFsbCBpbmRleGVkIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIFNlZSB0aGUgYGluZGV4aW5nYCBwYWNrYWdlIGZvciBtb3JlIGRldGFpbHMuXG4gICAqL1xuICBnZXRJbmRleGVkQ29tcG9uZW50cygpOiBNYXA8dHMuRGVjbGFyYXRpb24sIEluZGV4ZWRDb21wb25lbnQ+IHtcbiAgICBjb25zdCBjb21waWxhdGlvbiA9IHRoaXMuZW5zdXJlQW5hbHl6ZWQoKTtcbiAgICBjb25zdCBjb250ZXh0ID0gbmV3IEluZGV4aW5nQ29udGV4dCgpO1xuICAgIGNvbXBpbGF0aW9uLnRyYWl0Q29tcGlsZXIuaW5kZXgoY29udGV4dCk7XG4gICAgcmV0dXJuIGdlbmVyYXRlQW5hbHlzaXMoY29udGV4dCk7XG4gIH1cblxuICBwcml2YXRlIGVuc3VyZUFuYWx5emVkKHRoaXM6IE5nQ29tcGlsZXIpOiBMYXp5Q29tcGlsYXRpb25TdGF0ZSB7XG4gICAgaWYgKHRoaXMuY29tcGlsYXRpb24gPT09IG51bGwpIHtcbiAgICAgIHRoaXMuYW5hbHl6ZVN5bmMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29tcGlsYXRpb24gITtcbiAgfVxuXG4gIHByaXZhdGUgYW5hbHl6ZVN5bmMoKTogdm9pZCB7XG4gICAgY29uc3QgYW5hbHl6ZVNwYW4gPSB0aGlzLnBlcmZSZWNvcmRlci5zdGFydCgnYW5hbHl6ZScpO1xuICAgIHRoaXMuY29tcGlsYXRpb24gPSB0aGlzLm1ha2VDb21waWxhdGlvbigpO1xuICAgIGZvciAoY29uc3Qgc2Ygb2YgdGhpcy50c1Byb2dyYW0uZ2V0U291cmNlRmlsZXMoKSkge1xuICAgICAgaWYgKHNmLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYW5hbHl6ZUZpbGVTcGFuID0gdGhpcy5wZXJmUmVjb3JkZXIuc3RhcnQoJ2FuYWx5emVGaWxlJywgc2YpO1xuICAgICAgdGhpcy5jb21waWxhdGlvbi50cmFpdENvbXBpbGVyLmFuYWx5emVTeW5jKHNmKTtcbiAgICAgIHRoaXMuc2NhbkZvck13cChzZik7XG4gICAgICB0aGlzLnBlcmZSZWNvcmRlci5zdG9wKGFuYWx5emVGaWxlU3Bhbik7XG4gICAgfVxuICAgIHRoaXMucGVyZlJlY29yZGVyLnN0b3AoYW5hbHl6ZVNwYW4pO1xuXG4gICAgdGhpcy5yZXNvbHZlQ29tcGlsYXRpb24odGhpcy5jb21waWxhdGlvbi50cmFpdENvbXBpbGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZUNvbXBpbGF0aW9uKHRyYWl0Q29tcGlsZXI6IFRyYWl0Q29tcGlsZXIpOiB2b2lkIHtcbiAgICB0cmFpdENvbXBpbGVyLnJlc29sdmUoKTtcblxuICAgIHRoaXMucmVjb3JkTmdNb2R1bGVTY29wZURlcGVuZGVuY2llcygpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgYW5hbHlzaXMgaXMgY29tcGxldGUgYW5kIHRoZSBjb21waWxlciBjYW4gbm93IGNhbGN1bGF0ZSB3aGljaCBmaWxlcyBuZWVkIHRvXG4gICAgLy8gYmUgZW1pdHRlZCwgc28gZG8gdGhhdC5cbiAgICB0aGlzLmluY3JlbWVudGFsRHJpdmVyLnJlY29yZFN1Y2Nlc3NmdWxBbmFseXNpcyh0cmFpdENvbXBpbGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGVtcGxhdGVEaWFnbm9zdGljcygpOiBSZWFkb25seUFycmF5PHRzLkRpYWdub3N0aWM+IHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5ob3N0O1xuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBzdHJpY3RuZXNzIGxldmVsIG9mIHR5cGUgY2hlY2tpbmcgYmFzZWQgb24gY29tcGlsZXIgb3B0aW9ucy4gQXNcbiAgICAvLyBgc3RyaWN0VGVtcGxhdGVzYCBpcyBhIHN1cGVyc2V0IG9mIGBmdWxsVGVtcGxhdGVUeXBlQ2hlY2tgLCB0aGUgZm9ybWVyIGltcGxpZXMgdGhlIGxhdHRlci5cbiAgICAvLyBBbHNvIHNlZSBgdmVyaWZ5Q29tcGF0aWJsZVR5cGVDaGVja09wdGlvbnNgIHdoZXJlIGl0IGlzIHZlcmlmaWVkIHRoYXQgYGZ1bGxUZW1wbGF0ZVR5cGVDaGVja2BcbiAgICAvLyBpcyBub3QgZGlzYWJsZWQgd2hlbiBgc3RyaWN0VGVtcGxhdGVzYCBpcyBlbmFibGVkLlxuICAgIGNvbnN0IHN0cmljdFRlbXBsYXRlcyA9ICEhdGhpcy5vcHRpb25zLnN0cmljdFRlbXBsYXRlcztcbiAgICBjb25zdCBmdWxsVGVtcGxhdGVUeXBlQ2hlY2sgPSBzdHJpY3RUZW1wbGF0ZXMgfHwgISF0aGlzLm9wdGlvbnMuZnVsbFRlbXBsYXRlVHlwZUNoZWNrO1xuXG4gICAgLy8gU2tpcCB0ZW1wbGF0ZSB0eXBlLWNoZWNraW5nIGlmIGl0J3MgZGlzYWJsZWQuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pdnlUZW1wbGF0ZVR5cGVDaGVjayA9PT0gZmFsc2UgJiYgIWZ1bGxUZW1wbGF0ZVR5cGVDaGVjaykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBpbGF0aW9uID0gdGhpcy5lbnN1cmVBbmFseXplZCgpO1xuICAgIC8vIFJ1biB0ZW1wbGF0ZSB0eXBlLWNoZWNraW5nLlxuXG4gICAgLy8gRmlyc3Qgc2VsZWN0IGEgdHlwZS1jaGVja2luZyBjb25maWd1cmF0aW9uLCBiYXNlZCBvbiB3aGV0aGVyIGZ1bGwgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBpc1xuICAgIC8vIHJlcXVlc3RlZC5cbiAgICBsZXQgdHlwZUNoZWNraW5nQ29uZmlnOiBUeXBlQ2hlY2tpbmdDb25maWc7XG4gICAgaWYgKGZ1bGxUZW1wbGF0ZVR5cGVDaGVjaykge1xuICAgICAgdHlwZUNoZWNraW5nQ29uZmlnID0ge1xuICAgICAgICBhcHBseVRlbXBsYXRlQ29udGV4dEd1YXJkczogc3RyaWN0VGVtcGxhdGVzLFxuICAgICAgICBjaGVja1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBjaGVja1RlbXBsYXRlQm9kaWVzOiB0cnVlLFxuICAgICAgICBjaGVja1R5cGVPZklucHV0QmluZGluZ3M6IHN0cmljdFRlbXBsYXRlcyxcbiAgICAgICAgc3RyaWN0TnVsbElucHV0QmluZGluZ3M6IHN0cmljdFRlbXBsYXRlcyxcbiAgICAgICAgY2hlY2tUeXBlT2ZBdHRyaWJ1dGVzOiBzdHJpY3RUZW1wbGF0ZXMsXG4gICAgICAgIC8vIEV2ZW4gaW4gZnVsbCB0ZW1wbGF0ZSB0eXBlLWNoZWNraW5nIG1vZGUsIERPTSBiaW5kaW5nIGNoZWNrcyBhcmUgbm90IHF1aXRlIHJlYWR5IHlldC5cbiAgICAgICAgY2hlY2tUeXBlT2ZEb21CaW5kaW5nczogZmFsc2UsXG4gICAgICAgIGNoZWNrVHlwZU9mT3V0cHV0RXZlbnRzOiBzdHJpY3RUZW1wbGF0ZXMsXG4gICAgICAgIGNoZWNrVHlwZU9mQW5pbWF0aW9uRXZlbnRzOiBzdHJpY3RUZW1wbGF0ZXMsXG4gICAgICAgIC8vIENoZWNraW5nIG9mIERPTSBldmVudHMgY3VycmVudGx5IGhhcyBhbiBhZHZlcnNlIGVmZmVjdCBvbiBkZXZlbG9wZXIgZXhwZXJpZW5jZSxcbiAgICAgICAgLy8gZS5nLiBmb3IgYDxpbnB1dCAoYmx1cik9XCJ1cGRhdGUoJGV2ZW50LnRhcmdldC52YWx1ZSlcIj5gIGVuYWJsaW5nIHRoaXMgY2hlY2sgcmVzdWx0cyBpbjpcbiAgICAgICAgLy8gLSBlcnJvciBUUzI1MzE6IE9iamVjdCBpcyBwb3NzaWJseSAnbnVsbCcuXG4gICAgICAgIC8vIC0gZXJyb3IgVFMyMzM5OiBQcm9wZXJ0eSAndmFsdWUnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0V2ZW50VGFyZ2V0Jy5cbiAgICAgICAgY2hlY2tUeXBlT2ZEb21FdmVudHM6IHN0cmljdFRlbXBsYXRlcyxcbiAgICAgICAgY2hlY2tUeXBlT2ZEb21SZWZlcmVuY2VzOiBzdHJpY3RUZW1wbGF0ZXMsXG4gICAgICAgIC8vIE5vbi1ET00gcmVmZXJlbmNlcyBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgaW4gVmlldyBFbmdpbmUgc28gdGhlcmUgaXMgbm8gc3RyaWN0bmVzcyBmbGFnLlxuICAgICAgICBjaGVja1R5cGVPZk5vbkRvbVJlZmVyZW5jZXM6IHRydWUsXG4gICAgICAgIC8vIFBpcGVzIGFyZSBjaGVja2VkIGluIFZpZXcgRW5naW5lIHNvIHRoZXJlIGlzIG5vIHN0cmljdG5lc3MgZmxhZy5cbiAgICAgICAgY2hlY2tUeXBlT2ZQaXBlczogdHJ1ZSxcbiAgICAgICAgc3RyaWN0U2FmZU5hdmlnYXRpb25UeXBlczogc3RyaWN0VGVtcGxhdGVzLFxuICAgICAgICB1c2VDb250ZXh0R2VuZXJpY1R5cGU6IHN0cmljdFRlbXBsYXRlcyxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZyA9IHtcbiAgICAgICAgYXBwbHlUZW1wbGF0ZUNvbnRleHRHdWFyZHM6IGZhbHNlLFxuICAgICAgICBjaGVja1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBjaGVja1RlbXBsYXRlQm9kaWVzOiBmYWxzZSxcbiAgICAgICAgY2hlY2tUeXBlT2ZJbnB1dEJpbmRpbmdzOiBmYWxzZSxcbiAgICAgICAgc3RyaWN0TnVsbElucHV0QmluZGluZ3M6IGZhbHNlLFxuICAgICAgICBjaGVja1R5cGVPZkF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGVja1R5cGVPZkRvbUJpbmRpbmdzOiBmYWxzZSxcbiAgICAgICAgY2hlY2tUeXBlT2ZPdXRwdXRFdmVudHM6IGZhbHNlLFxuICAgICAgICBjaGVja1R5cGVPZkFuaW1hdGlvbkV2ZW50czogZmFsc2UsXG4gICAgICAgIGNoZWNrVHlwZU9mRG9tRXZlbnRzOiBmYWxzZSxcbiAgICAgICAgY2hlY2tUeXBlT2ZEb21SZWZlcmVuY2VzOiBmYWxzZSxcbiAgICAgICAgY2hlY2tUeXBlT2ZOb25Eb21SZWZlcmVuY2VzOiBmYWxzZSxcbiAgICAgICAgY2hlY2tUeXBlT2ZQaXBlczogZmFsc2UsXG4gICAgICAgIHN0cmljdFNhZmVOYXZpZ2F0aW9uVHlwZXM6IGZhbHNlLFxuICAgICAgICB1c2VDb250ZXh0R2VuZXJpY1R5cGU6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBcHBseSBleHBsaWNpdGx5IGNvbmZpZ3VyZWQgc3RyaWN0bmVzcyBmbGFncyBvbiB0b3Agb2YgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvblxuICAgIC8vIGJhc2VkIG9uIFwiZnVsbFRlbXBsYXRlVHlwZUNoZWNrXCIuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RJbnB1dFR5cGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZy5jaGVja1R5cGVPZklucHV0QmluZGluZ3MgPSB0aGlzLm9wdGlvbnMuc3RyaWN0SW5wdXRUeXBlcztcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZy5hcHBseVRlbXBsYXRlQ29udGV4dEd1YXJkcyA9IHRoaXMub3B0aW9ucy5zdHJpY3RJbnB1dFR5cGVzO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLnN0cmljdE51bGxJbnB1dFR5cGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZy5zdHJpY3ROdWxsSW5wdXRCaW5kaW5ncyA9IHRoaXMub3B0aW9ucy5zdHJpY3ROdWxsSW5wdXRUeXBlcztcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RPdXRwdXRFdmVudFR5cGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZy5jaGVja1R5cGVPZk91dHB1dEV2ZW50cyA9IHRoaXMub3B0aW9ucy5zdHJpY3RPdXRwdXRFdmVudFR5cGVzO1xuICAgICAgdHlwZUNoZWNraW5nQ29uZmlnLmNoZWNrVHlwZU9mQW5pbWF0aW9uRXZlbnRzID0gdGhpcy5vcHRpb25zLnN0cmljdE91dHB1dEV2ZW50VHlwZXM7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RyaWN0RG9tRXZlbnRUeXBlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0eXBlQ2hlY2tpbmdDb25maWcuY2hlY2tUeXBlT2ZEb21FdmVudHMgPSB0aGlzLm9wdGlvbnMuc3RyaWN0RG9tRXZlbnRUeXBlcztcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RTYWZlTmF2aWdhdGlvblR5cGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR5cGVDaGVja2luZ0NvbmZpZy5zdHJpY3RTYWZlTmF2aWdhdGlvblR5cGVzID0gdGhpcy5vcHRpb25zLnN0cmljdFNhZmVOYXZpZ2F0aW9uVHlwZXM7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RyaWN0RG9tTG9jYWxSZWZUeXBlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0eXBlQ2hlY2tpbmdDb25maWcuY2hlY2tUeXBlT2ZEb21SZWZlcmVuY2VzID0gdGhpcy5vcHRpb25zLnN0cmljdERvbUxvY2FsUmVmVHlwZXM7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RyaWN0QXR0cmlidXRlVHlwZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHlwZUNoZWNraW5nQ29uZmlnLmNoZWNrVHlwZU9mQXR0cmlidXRlcyA9IHRoaXMub3B0aW9ucy5zdHJpY3RBdHRyaWJ1dGVUeXBlcztcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RDb250ZXh0R2VuZXJpY3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdHlwZUNoZWNraW5nQ29uZmlnLnVzZUNvbnRleHRHZW5lcmljVHlwZSA9IHRoaXMub3B0aW9ucy5zdHJpY3RDb250ZXh0R2VuZXJpY3M7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSB0aGUgdHlwZUNoZWNrIHBoYXNlIG9mIGVhY2ggZGVjb3JhdG9yIGluIHRoZSBwcm9ncmFtLlxuICAgIGNvbnN0IHByZXBTcGFuID0gdGhpcy5wZXJmUmVjb3JkZXIuc3RhcnQoJ3R5cGVDaGVja1ByZXAnKTtcbiAgICBjb25zdCBjdHggPSBuZXcgVHlwZUNoZWNrQ29udGV4dChcbiAgICAgICAgdHlwZUNoZWNraW5nQ29uZmlnLCBjb21waWxhdGlvbi5yZWZFbWl0dGVyICEsIGNvbXBpbGF0aW9uLnJlZmxlY3RvciwgaG9zdC50eXBlQ2hlY2tGaWxlKTtcbiAgICBjb21waWxhdGlvbi50cmFpdENvbXBpbGVyLnR5cGVDaGVjayhjdHgpO1xuICAgIHRoaXMucGVyZlJlY29yZGVyLnN0b3AocHJlcFNwYW4pO1xuXG4gICAgLy8gR2V0IHRoZSBkaWFnbm9zdGljcy5cbiAgICBjb25zdCB0eXBlQ2hlY2tTcGFuID0gdGhpcy5wZXJmUmVjb3JkZXIuc3RhcnQoJ3R5cGVDaGVja0RpYWdub3N0aWNzJyk7XG4gICAgY29uc3Qge2RpYWdub3N0aWNzLCBwcm9ncmFtfSA9XG4gICAgICAgIGN0eC5jYWxjdWxhdGVUZW1wbGF0ZURpYWdub3N0aWNzKHRoaXMudHNQcm9ncmFtLCB0aGlzLmhvc3QsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5wZXJmUmVjb3JkZXIuc3RvcCh0eXBlQ2hlY2tTcGFuKTtcbiAgICBzZXRJbmNyZW1lbnRhbERyaXZlcihwcm9ncmFtLCB0aGlzLmluY3JlbWVudGFsRHJpdmVyKTtcbiAgICB0aGlzLm5leHRQcm9ncmFtID0gcHJvZ3JhbTtcblxuICAgIHJldHVybiBkaWFnbm9zdGljcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWlmaWVzIHRoZSBpbnRlci1kZXBlbmRlbmNpZXMgb2YgTmdNb2R1bGVzIGFuZCB0aGUgY29tcG9uZW50cyB3aXRoaW4gdGhlaXIgY29tcGlsYXRpb24gc2NvcGVzXG4gICAqIGludG8gdGhlIGBJbmNyZW1lbnRhbERyaXZlcmAncyBkZXBlbmRlbmN5IGdyYXBoLlxuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmROZ01vZHVsZVNjb3BlRGVwZW5kZW5jaWVzKCkge1xuICAgIGNvbnN0IHJlY29yZFNwYW4gPSB0aGlzLnBlcmZSZWNvcmRlci5zdGFydCgncmVjb3JkRGVwZW5kZW5jaWVzJyk7XG4gICAgY29uc3QgZGVwR3JhcGggPSB0aGlzLmluY3JlbWVudGFsRHJpdmVyLmRlcEdyYXBoO1xuXG4gICAgZm9yIChjb25zdCBzY29wZSBvZiB0aGlzLmNvbXBpbGF0aW9uICEuc2NvcGVSZWdpc3RyeSAhLmdldENvbXBpbGF0aW9uU2NvcGVzKCkpIHtcbiAgICAgIGNvbnN0IGZpbGUgPSBzY29wZS5kZWNsYXJhdGlvbi5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICBjb25zdCBuZ01vZHVsZUZpbGUgPSBzY29wZS5uZ01vZHVsZS5nZXRTb3VyY2VGaWxlKCk7XG5cbiAgICAgIC8vIEEgY2hhbmdlIHRvIGFueSBkZXBlbmRlbmN5IG9mIHRoZSBkZWNsYXJhdGlvbiBjYXVzZXMgdGhlIGRlY2xhcmF0aW9uIHRvIGJlIGludmFsaWRhdGVkLFxuICAgICAgLy8gd2hpY2ggcmVxdWlyZXMgdGhlIE5nTW9kdWxlIHRvIGJlIGludmFsaWRhdGVkIGFzIHdlbGwuXG4gICAgICBkZXBHcmFwaC5hZGRUcmFuc2l0aXZlRGVwZW5kZW5jeShuZ01vZHVsZUZpbGUsIGZpbGUpO1xuXG4gICAgICAvLyBBIGNoYW5nZSB0byB0aGUgTmdNb2R1bGUgZmlsZSBzaG91bGQgY2F1c2UgdGhlIGRlY2xhcmF0aW9uIGl0c2VsZiB0byBiZSBpbnZhbGlkYXRlZC5cbiAgICAgIGRlcEdyYXBoLmFkZERlcGVuZGVuY3koZmlsZSwgbmdNb2R1bGVGaWxlKTtcblxuICAgICAgY29uc3QgbWV0YSA9XG4gICAgICAgICAgdGhpcy5jb21waWxhdGlvbiAhLm1ldGFSZWFkZXIuZ2V0RGlyZWN0aXZlTWV0YWRhdGEobmV3IFJlZmVyZW5jZShzY29wZS5kZWNsYXJhdGlvbikpO1xuICAgICAgaWYgKG1ldGEgIT09IG51bGwgJiYgbWV0YS5pc0NvbXBvbmVudCkge1xuICAgICAgICAvLyBJZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlIGNoYW5nZXMsIGl0IG1pZ2h0IGhhdmUgYWZmZWN0ZWQgdGhlIGltcG9ydCBncmFwaCwgYW5kIHRodXMgdGhlXG4gICAgICAgIC8vIHJlbW90ZSBzY29waW5nIGZlYXR1cmUgd2hpY2ggaXMgYWN0aXZhdGVkIGluIHRoZSBldmVudCBvZiBwb3RlbnRpYWwgaW1wb3J0IGN5Y2xlcy4gVGh1cyxcbiAgICAgICAgLy8gdGhlIG1vZHVsZSBkZXBlbmRzIG5vdCBvbmx5IG9uIHRoZSB0cmFuc2l0aXZlIGRlcGVuZGVuY2llcyBvZiB0aGUgY29tcG9uZW50LCBidXQgb24gaXRzXG4gICAgICAgIC8vIHJlc291cmNlcyBhcyB3ZWxsLlxuICAgICAgICBkZXBHcmFwaC5hZGRUcmFuc2l0aXZlUmVzb3VyY2VzKG5nTW9kdWxlRmlsZSwgZmlsZSk7XG5cbiAgICAgICAgLy8gQSBjaGFuZ2UgdG8gYW55IGRpcmVjdGl2ZS9waXBlIGluIHRoZSBjb21waWxhdGlvbiBzY29wZSBzaG91bGQgY2F1c2UgdGhlIGNvbXBvbmVudCB0byBiZVxuICAgICAgICAvLyBpbnZhbGlkYXRlZC5cbiAgICAgICAgZm9yIChjb25zdCBkaXJlY3RpdmUgb2Ygc2NvcGUuZGlyZWN0aXZlcykge1xuICAgICAgICAgIC8vIFdoZW4gYSBkaXJlY3RpdmUgaW4gc2NvcGUgaXMgdXBkYXRlZCwgdGhlIGNvbXBvbmVudCBuZWVkcyB0byBiZSByZWNvbXBpbGVkIGFzIGUuZy4gYVxuICAgICAgICAgIC8vIHNlbGVjdG9yIG1heSBoYXZlIGNoYW5nZWQuXG4gICAgICAgICAgZGVwR3JhcGguYWRkVHJhbnNpdGl2ZURlcGVuZGVuY3koZmlsZSwgZGlyZWN0aXZlLnJlZi5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBwaXBlIG9mIHNjb3BlLnBpcGVzKSB7XG4gICAgICAgICAgLy8gV2hlbiBhIHBpcGUgaW4gc2NvcGUgaXMgdXBkYXRlZCwgdGhlIGNvbXBvbmVudCBuZWVkcyB0byBiZSByZWNvbXBpbGVkIGFzIGUuZy4gdGhlXG4gICAgICAgICAgLy8gcGlwZSdzIG5hbWUgbWF5IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgICBkZXBHcmFwaC5hZGRUcmFuc2l0aXZlRGVwZW5kZW5jeShmaWxlLCBwaXBlLnJlZi5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5wZXJmUmVjb3JkZXIuc3RvcChyZWNvcmRTcGFuKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NhbkZvck13cChzZjogdHMuU291cmNlRmlsZSk6IHZvaWQge1xuICAgIHRoaXMuY29tcGlsYXRpb24gIS5td3BTY2FubmVyLnNjYW4oc2YsIHtcbiAgICAgIGFkZFR5cGVSZXBsYWNlbWVudDogKG5vZGU6IHRzLkRlY2xhcmF0aW9uLCB0eXBlOiBUeXBlKTogdm9pZCA9PiB7XG4gICAgICAgIC8vIE9ubHkgb2J0YWluIHRoZSByZXR1cm4gdHlwZSB0cmFuc2Zvcm0gZm9yIHRoZSBzb3VyY2UgZmlsZSBvbmNlIHRoZXJlJ3MgYSB0eXBlIHRvIHJlcGxhY2UsXG4gICAgICAgIC8vIHNvIHRoYXQgbm8gdHJhbnNmb3JtIGlzIGFsbG9jYXRlZCB3aGVuIHRoZXJlJ3Mgbm90aGluZyB0byBkby5cbiAgICAgICAgdGhpcy5jb21waWxhdGlvbiAhLmR0c1RyYW5zZm9ybXMgIS5nZXRSZXR1cm5UeXBlVHJhbnNmb3JtKHNmKS5hZGRUeXBlUmVwbGFjZW1lbnQoXG4gICAgICAgICAgICBub2RlLCB0eXBlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgbWFrZUNvbXBpbGF0aW9uKCk6IExhenlDb21waWxhdGlvblN0YXRlIHtcbiAgICBjb25zdCBjaGVja2VyID0gdGhpcy50c1Byb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcblxuICAgIGNvbnN0IHJlZmxlY3RvciA9IG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QoY2hlY2tlcik7XG5cbiAgICAvLyBDb25zdHJ1Y3QgdGhlIFJlZmVyZW5jZUVtaXR0ZXIuXG4gICAgbGV0IHJlZkVtaXR0ZXI6IFJlZmVyZW5jZUVtaXR0ZXI7XG4gICAgbGV0IGFsaWFzaW5nSG9zdDogQWxpYXNpbmdIb3N0fG51bGwgPSBudWxsO1xuICAgIGlmICh0aGlzLmhvc3QudW5pZmllZE1vZHVsZXNIb3N0ID09PSBudWxsIHx8ICF0aGlzLm9wdGlvbnMuX3VzZUhvc3RGb3JJbXBvcnRHZW5lcmF0aW9uKSB7XG4gICAgICBsZXQgbG9jYWxJbXBvcnRTdHJhdGVneTogUmVmZXJlbmNlRW1pdFN0cmF0ZWd5O1xuXG4gICAgICAvLyBUaGUgc3RyYXRlZ3kgdXNlZCBmb3IgbG9jYWwsIGluLXByb2plY3QgaW1wb3J0cyBkZXBlbmRzIG9uIHdoZXRoZXIgVFMgaGFzIGJlZW4gY29uZmlndXJlZFxuICAgICAgLy8gd2l0aCByb290RGlycy4gSWYgc28sIHRoZW4gbXVsdGlwbGUgZGlyZWN0b3JpZXMgbWF5IGJlIG1hcHBlZCBpbiB0aGUgc2FtZSBcIm1vZHVsZVxuICAgICAgLy8gbmFtZXNwYWNlXCIgYW5kIHRoZSBsb2dpYyBvZiBgTG9naWNhbFByb2plY3RTdHJhdGVneWAgaXMgcmVxdWlyZWQgdG8gZ2VuZXJhdGUgY29ycmVjdFxuICAgICAgLy8gaW1wb3J0cyB3aGljaCBtYXkgY3Jvc3MgdGhlc2UgbXVsdGlwbGUgZGlyZWN0b3JpZXMuIE90aGVyd2lzZSwgcGxhaW4gcmVsYXRpdmUgaW1wb3J0cyBhcmVcbiAgICAgIC8vIHN1ZmZpY2llbnQuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnJvb3REaXIgIT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICh0aGlzLm9wdGlvbnMucm9vdERpcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLm9wdGlvbnMucm9vdERpcnMubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgLy8gcm9vdERpcnMgbG9naWMgaXMgaW4gZWZmZWN0IC0gdXNlIHRoZSBgTG9naWNhbFByb2plY3RTdHJhdGVneWAgZm9yIGluLXByb2plY3QgcmVsYXRpdmVcbiAgICAgICAgLy8gaW1wb3J0cy5cbiAgICAgICAgbG9jYWxJbXBvcnRTdHJhdGVneSA9XG4gICAgICAgICAgICBuZXcgTG9naWNhbFByb2plY3RTdHJhdGVneShyZWZsZWN0b3IsIG5ldyBMb2dpY2FsRmlsZVN5c3RlbShbLi4udGhpcy5ob3N0LnJvb3REaXJzXSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUGxhaW4gcmVsYXRpdmUgaW1wb3J0cyBhcmUgYWxsIHRoYXQncyBuZWVkZWQuXG4gICAgICAgIGxvY2FsSW1wb3J0U3RyYXRlZ3kgPSBuZXcgUmVsYXRpdmVQYXRoU3RyYXRlZ3kocmVmbGVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIENvbXBpbGVySG9zdCBkb2Vzbid0IGhhdmUgZmlsZU5hbWVUb01vZHVsZU5hbWUsIHNvIGJ1aWxkIGFuIE5QTS1jZW50cmljIHJlZmVyZW5jZVxuICAgICAgLy8gcmVzb2x1dGlvbiBzdHJhdGVneS5cbiAgICAgIHJlZkVtaXR0ZXIgPSBuZXcgUmVmZXJlbmNlRW1pdHRlcihbXG4gICAgICAgIC8vIEZpcnN0LCB0cnkgdG8gdXNlIGxvY2FsIGlkZW50aWZpZXJzIGlmIGF2YWlsYWJsZS5cbiAgICAgICAgbmV3IExvY2FsSWRlbnRpZmllclN0cmF0ZWd5KCksXG4gICAgICAgIC8vIE5leHQsIGF0dGVtcHQgdG8gdXNlIGFuIGFic29sdXRlIGltcG9ydC5cbiAgICAgICAgbmV3IEFic29sdXRlTW9kdWxlU3RyYXRlZ3kodGhpcy50c1Byb2dyYW0sIGNoZWNrZXIsIHRoaXMubW9kdWxlUmVzb2x2ZXIsIHJlZmxlY3RvciksXG4gICAgICAgIC8vIEZpbmFsbHksIGNoZWNrIGlmIHRoZSByZWZlcmVuY2UgaXMgYmVpbmcgd3JpdHRlbiBpbnRvIGEgZmlsZSB3aXRoaW4gdGhlIHByb2plY3QncyAudHNcbiAgICAgICAgLy8gc291cmNlcywgYW5kIHVzZSBhIHJlbGF0aXZlIGltcG9ydCBpZiBzby4gSWYgdGhpcyBmYWlscywgUmVmZXJlbmNlRW1pdHRlciB3aWxsIHRocm93XG4gICAgICAgIC8vIGFuIGVycm9yLlxuICAgICAgICBsb2NhbEltcG9ydFN0cmF0ZWd5LFxuICAgICAgXSk7XG5cbiAgICAgIC8vIElmIGFuIGVudHJ5cG9pbnQgaXMgcHJlc2VudCwgdGhlbiBhbGwgdXNlciBpbXBvcnRzIHNob3VsZCBiZSBkaXJlY3RlZCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZW50cnlwb2ludCBhbmQgcHJpdmF0ZSBleHBvcnRzIGFyZSBub3QgbmVlZGVkLiBUaGUgY29tcGlsZXIgd2lsbCB2YWxpZGF0ZSB0aGF0IGFsbCBwdWJsaWNseVxuICAgICAgLy8gdmlzaWJsZSBkaXJlY3RpdmVzL3BpcGVzIGFyZSBpbXBvcnRhYmxlIHZpYSB0aGlzIGVudHJ5cG9pbnQuXG4gICAgICBpZiAodGhpcy5lbnRyeVBvaW50ID09PSBudWxsICYmIHRoaXMub3B0aW9ucy5nZW5lcmF0ZURlZXBSZWV4cG9ydHMgPT09IHRydWUpIHtcbiAgICAgICAgLy8gTm8gZW50cnlwb2ludCBpcyBwcmVzZW50IGFuZCBkZWVwIHJlLWV4cG9ydHMgd2VyZSByZXF1ZXN0ZWQsIHNvIGNvbmZpZ3VyZSB0aGUgYWxpYXNpbmdcbiAgICAgICAgLy8gc3lzdGVtIHRvIGdlbmVyYXRlIHRoZW0uXG4gICAgICAgIGFsaWFzaW5nSG9zdCA9IG5ldyBQcml2YXRlRXhwb3J0QWxpYXNpbmdIb3N0KHJlZmxlY3Rvcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBDb21waWxlckhvc3Qgc3VwcG9ydHMgZmlsZU5hbWVUb01vZHVsZU5hbWUsIHNvIHVzZSB0aGF0IHRvIGVtaXQgaW1wb3J0cy5cbiAgICAgIHJlZkVtaXR0ZXIgPSBuZXcgUmVmZXJlbmNlRW1pdHRlcihbXG4gICAgICAgIC8vIEZpcnN0LCB0cnkgdG8gdXNlIGxvY2FsIGlkZW50aWZpZXJzIGlmIGF2YWlsYWJsZS5cbiAgICAgICAgbmV3IExvY2FsSWRlbnRpZmllclN0cmF0ZWd5KCksXG4gICAgICAgIC8vIFRoZW4gdXNlIGFsaWFzZWQgcmVmZXJlbmNlcyAodGhpcyBpcyBhIHdvcmthcm91bmQgdG8gU3RyaWN0RGVwcyBjaGVja3MpLlxuICAgICAgICBuZXcgQWxpYXNTdHJhdGVneSgpLFxuICAgICAgICAvLyBUaGVuIHVzZSBmaWxlTmFtZVRvTW9kdWxlTmFtZSB0byBlbWl0IGltcG9ydHMuXG4gICAgICAgIG5ldyBVbmlmaWVkTW9kdWxlc1N0cmF0ZWd5KHJlZmxlY3RvciwgdGhpcy5ob3N0LnVuaWZpZWRNb2R1bGVzSG9zdCksXG4gICAgICBdKTtcbiAgICAgIGFsaWFzaW5nSG9zdCA9IG5ldyBVbmlmaWVkTW9kdWxlc0FsaWFzaW5nSG9zdCh0aGlzLmhvc3QudW5pZmllZE1vZHVsZXNIb3N0KTtcbiAgICB9XG5cbiAgICBjb25zdCBldmFsdWF0b3IgPSBuZXcgUGFydGlhbEV2YWx1YXRvcihyZWZsZWN0b3IsIGNoZWNrZXIsIHRoaXMuaW5jcmVtZW50YWxEcml2ZXIuZGVwR3JhcGgpO1xuICAgIGNvbnN0IGR0c1JlYWRlciA9IG5ldyBEdHNNZXRhZGF0YVJlYWRlcihjaGVja2VyLCByZWZsZWN0b3IpO1xuICAgIGNvbnN0IGxvY2FsTWV0YVJlZ2lzdHJ5ID0gbmV3IExvY2FsTWV0YWRhdGFSZWdpc3RyeSgpO1xuICAgIGNvbnN0IGxvY2FsTWV0YVJlYWRlcjogTWV0YWRhdGFSZWFkZXIgPSBsb2NhbE1ldGFSZWdpc3RyeTtcbiAgICBjb25zdCBkZXBTY29wZVJlYWRlciA9IG5ldyBNZXRhZGF0YUR0c01vZHVsZVNjb3BlUmVzb2x2ZXIoZHRzUmVhZGVyLCBhbGlhc2luZ0hvc3QpO1xuICAgIGNvbnN0IHNjb3BlUmVnaXN0cnkgPVxuICAgICAgICBuZXcgTG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5KGxvY2FsTWV0YVJlYWRlciwgZGVwU2NvcGVSZWFkZXIsIHJlZkVtaXR0ZXIsIGFsaWFzaW5nSG9zdCk7XG4gICAgY29uc3Qgc2NvcGVSZWFkZXI6IENvbXBvbmVudFNjb3BlUmVhZGVyID0gc2NvcGVSZWdpc3RyeTtcbiAgICBjb25zdCBtZXRhUmVnaXN0cnkgPSBuZXcgQ29tcG91bmRNZXRhZGF0YVJlZ2lzdHJ5KFtsb2NhbE1ldGFSZWdpc3RyeSwgc2NvcGVSZWdpc3RyeV0pO1xuICAgIGNvbnN0IGluamVjdGFibGVSZWdpc3RyeSA9IG5ldyBJbmplY3RhYmxlQ2xhc3NSZWdpc3RyeShyZWZsZWN0b3IpO1xuXG4gICAgY29uc3QgbWV0YVJlYWRlciA9IG5ldyBDb21wb3VuZE1ldGFkYXRhUmVhZGVyKFtsb2NhbE1ldGFSZWFkZXIsIGR0c1JlYWRlcl0pO1xuXG5cbiAgICAvLyBJZiBhIGZsYXQgbW9kdWxlIGVudHJ5cG9pbnQgd2FzIHNwZWNpZmllZCwgdGhlbiB0cmFjayByZWZlcmVuY2VzIHZpYSBhIGBSZWZlcmVuY2VHcmFwaGAgaW5cbiAgICAvLyBvcmRlciB0byBwcm9kdWNlIHByb3BlciBkaWFnbm9zdGljcyBmb3IgaW5jb3JyZWN0bHkgZXhwb3J0ZWQgZGlyZWN0aXZlcy9waXBlcy9ldGMuIElmIHRoZXJlXG4gICAgLy8gaXMgbm8gZmxhdCBtb2R1bGUgZW50cnlwb2ludCB0aGVuIGRvbid0IHBheSB0aGUgY29zdCBvZiB0cmFja2luZyByZWZlcmVuY2VzLlxuICAgIGxldCByZWZlcmVuY2VzUmVnaXN0cnk6IFJlZmVyZW5jZXNSZWdpc3RyeTtcbiAgICBsZXQgZXhwb3J0UmVmZXJlbmNlR3JhcGg6IFJlZmVyZW5jZUdyYXBofG51bGwgPSBudWxsO1xuICAgIGlmICh0aGlzLmVudHJ5UG9pbnQgIT09IG51bGwpIHtcbiAgICAgIGV4cG9ydFJlZmVyZW5jZUdyYXBoID0gbmV3IFJlZmVyZW5jZUdyYXBoKCk7XG4gICAgICByZWZlcmVuY2VzUmVnaXN0cnkgPSBuZXcgUmVmZXJlbmNlR3JhcGhBZGFwdGVyKGV4cG9ydFJlZmVyZW5jZUdyYXBoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVmZXJlbmNlc1JlZ2lzdHJ5ID0gbmV3IE5vb3BSZWZlcmVuY2VzUmVnaXN0cnkoKTtcbiAgICB9XG5cbiAgICBjb25zdCByb3V0ZUFuYWx5emVyID0gbmV3IE5nTW9kdWxlUm91dGVBbmFseXplcih0aGlzLm1vZHVsZVJlc29sdmVyLCBldmFsdWF0b3IpO1xuXG4gICAgY29uc3QgZHRzVHJhbnNmb3JtcyA9IG5ldyBEdHNUcmFuc2Zvcm1SZWdpc3RyeSgpO1xuXG4gICAgY29uc3QgbXdwU2Nhbm5lciA9IG5ldyBNb2R1bGVXaXRoUHJvdmlkZXJzU2Nhbm5lcihyZWZsZWN0b3IsIGV2YWx1YXRvciwgcmVmRW1pdHRlcik7XG5cbiAgICBjb25zdCBpc0NvcmUgPSBpc0FuZ3VsYXJDb3JlUGFja2FnZSh0aGlzLnRzUHJvZ3JhbSk7XG5cbiAgICBjb25zdCBkZWZhdWx0SW1wb3J0VHJhY2tlciA9IG5ldyBEZWZhdWx0SW1wb3J0VHJhY2tlcigpO1xuXG4gICAgLy8gU2V0IHVwIHRoZSBJdnlDb21waWxhdGlvbiwgd2hpY2ggbWFuYWdlcyBzdGF0ZSBmb3IgdGhlIEl2eSB0cmFuc2Zvcm1lci5cbiAgICBjb25zdCBoYW5kbGVyczogRGVjb3JhdG9ySGFuZGxlcjx1bmtub3duLCB1bmtub3duLCB1bmtub3duPltdID0gW1xuICAgICAgbmV3IENvbXBvbmVudERlY29yYXRvckhhbmRsZXIoXG4gICAgICAgICAgcmVmbGVjdG9yLCBldmFsdWF0b3IsIG1ldGFSZWdpc3RyeSwgbWV0YVJlYWRlciwgc2NvcGVSZWFkZXIsIHNjb3BlUmVnaXN0cnksIGlzQ29yZSxcbiAgICAgICAgICB0aGlzLnJlc291cmNlTWFuYWdlciwgdGhpcy5ob3N0LnJvb3REaXJzLCB0aGlzLm9wdGlvbnMucHJlc2VydmVXaGl0ZXNwYWNlcyB8fCBmYWxzZSxcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuaTE4blVzZUV4dGVybmFsSWRzICE9PSBmYWxzZSxcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuZW5hYmxlSTE4bkxlZ2FjeU1lc3NhZ2VJZEZvcm1hdCAhPT0gZmFsc2UsIHRoaXMubW9kdWxlUmVzb2x2ZXIsXG4gICAgICAgICAgdGhpcy5jeWNsZUFuYWx5emVyLCByZWZFbWl0dGVyLCBkZWZhdWx0SW1wb3J0VHJhY2tlciwgdGhpcy5pbmNyZW1lbnRhbERyaXZlci5kZXBHcmFwaCxcbiAgICAgICAgICBpbmplY3RhYmxlUmVnaXN0cnksIHRoaXMuY2xvc3VyZUNvbXBpbGVyRW5hYmxlZCksXG4gICAgICAvLyBUT0RPKGFseGh1Yik6IHVuZGVyc3RhbmQgd2h5IHRoZSBjYXN0IGhlcmUgaXMgbmVjZXNzYXJ5IChzb21ldGhpbmcgdG8gZG8gd2l0aCBgbnVsbGBcbiAgICAgIC8vIG5vdCBiZWluZyBhc3NpZ25hYmxlIHRvIGB1bmtub3duYCB3aGVuIHdyYXBwZWQgaW4gYFJlYWRvbmx5YCkuXG4gICAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgICAgIG5ldyBEaXJlY3RpdmVEZWNvcmF0b3JIYW5kbGVyKFxuICAgICAgICAgICAgcmVmbGVjdG9yLCBldmFsdWF0b3IsIG1ldGFSZWdpc3RyeSwgc2NvcGVSZWdpc3RyeSwgbWV0YVJlYWRlcixcbiAgICAgICAgICAgIGRlZmF1bHRJbXBvcnRUcmFja2VyLCBpbmplY3RhYmxlUmVnaXN0cnksIGlzQ29yZSwgdGhpcy5jbG9zdXJlQ29tcGlsZXJFbmFibGVkXG4gICAgICAgICkgYXMgUmVhZG9ubHk8RGVjb3JhdG9ySGFuZGxlcjx1bmtub3duLCB1bmtub3duLCB1bmtub3duPj4sXG4gICAgICAvLyBjbGFuZy1mb3JtYXQgb25cbiAgICAgIC8vIFBpcGUgaGFuZGxlciBtdXN0IGJlIGJlZm9yZSBpbmplY3RhYmxlIGhhbmRsZXIgaW4gbGlzdCBzbyBwaXBlIGZhY3RvcmllcyBhcmUgcHJpbnRlZFxuICAgICAgLy8gYmVmb3JlIGluamVjdGFibGUgZmFjdG9yaWVzIChzbyBpbmplY3RhYmxlIGZhY3RvcmllcyBjYW4gZGVsZWdhdGUgdG8gdGhlbSlcbiAgICAgIG5ldyBQaXBlRGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgICByZWZsZWN0b3IsIGV2YWx1YXRvciwgbWV0YVJlZ2lzdHJ5LCBzY29wZVJlZ2lzdHJ5LCBkZWZhdWx0SW1wb3J0VHJhY2tlcixcbiAgICAgICAgICBpbmplY3RhYmxlUmVnaXN0cnksIGlzQ29yZSksXG4gICAgICBuZXcgSW5qZWN0YWJsZURlY29yYXRvckhhbmRsZXIoXG4gICAgICAgICAgcmVmbGVjdG9yLCBkZWZhdWx0SW1wb3J0VHJhY2tlciwgaXNDb3JlLCB0aGlzLm9wdGlvbnMuc3RyaWN0SW5qZWN0aW9uUGFyYW1ldGVycyB8fCBmYWxzZSxcbiAgICAgICAgICBpbmplY3RhYmxlUmVnaXN0cnkpLFxuICAgICAgbmV3IE5nTW9kdWxlRGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgICByZWZsZWN0b3IsIGV2YWx1YXRvciwgbWV0YVJlYWRlciwgbWV0YVJlZ2lzdHJ5LCBzY29wZVJlZ2lzdHJ5LCByZWZlcmVuY2VzUmVnaXN0cnksIGlzQ29yZSxcbiAgICAgICAgICByb3V0ZUFuYWx5emVyLCByZWZFbWl0dGVyLCB0aGlzLmhvc3QuZmFjdG9yeVRyYWNrZXIsIGRlZmF1bHRJbXBvcnRUcmFja2VyLFxuICAgICAgICAgIHRoaXMuY2xvc3VyZUNvbXBpbGVyRW5hYmxlZCwgaW5qZWN0YWJsZVJlZ2lzdHJ5LCB0aGlzLm9wdGlvbnMuaTE4bkluTG9jYWxlKSxcbiAgICBdO1xuXG4gICAgY29uc3QgdHJhaXRDb21waWxlciA9IG5ldyBUcmFpdENvbXBpbGVyKFxuICAgICAgICBoYW5kbGVycywgcmVmbGVjdG9yLCB0aGlzLnBlcmZSZWNvcmRlciwgdGhpcy5pbmNyZW1lbnRhbERyaXZlcixcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbXBpbGVOb25FeHBvcnRlZENsYXNzZXMgIT09IGZhbHNlLCBkdHNUcmFuc2Zvcm1zKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlzQ29yZSwgICAgICAgIHRyYWl0Q29tcGlsZXIsICAgICAgICByZWZsZWN0b3IsICAgICBzY29wZVJlZ2lzdHJ5LFxuICAgICAgICBkdHNUcmFuc2Zvcm1zLCBleHBvcnRSZWZlcmVuY2VHcmFwaCwgcm91dGVBbmFseXplciwgbXdwU2Nhbm5lcixcbiAgICAgICAgbWV0YVJlYWRlciwgICAgZGVmYXVsdEltcG9ydFRyYWNrZXIsIGFsaWFzaW5nSG9zdCwgIHJlZkVtaXR0ZXIsXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gYFByb2dyYW1gIGlzIEBhbmd1bGFyL2NvcmUuXG4gKi9cbmZ1bmN0aW9uIGlzQW5ndWxhckNvcmVQYWNrYWdlKHByb2dyYW06IHRzLlByb2dyYW0pOiBib29sZWFuIHtcbiAgLy8gTG9vayBmb3IgaXRzX2p1c3RfYW5ndWxhci50cyBzb21ld2hlcmUgaW4gdGhlIHByb2dyYW0uXG4gIGNvbnN0IHIzU3ltYm9scyA9IGdldFIzU3ltYm9sc0ZpbGUocHJvZ3JhbSk7XG4gIGlmIChyM1N5bWJvbHMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBMb29rIGZvciB0aGUgY29uc3RhbnQgSVRTX0pVU1RfQU5HVUxBUiBpbiB0aGF0IGZpbGUuXG4gIHJldHVybiByM1N5bWJvbHMuc3RhdGVtZW50cy5zb21lKHN0bXQgPT4ge1xuICAgIC8vIFRoZSBzdGF0ZW1lbnQgbXVzdCBiZSBhIHZhcmlhYmxlIGRlY2xhcmF0aW9uIHN0YXRlbWVudC5cbiAgICBpZiAoIXRzLmlzVmFyaWFibGVTdGF0ZW1lbnQoc3RtdCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSXQgbXVzdCBiZSBleHBvcnRlZC5cbiAgICBpZiAoc3RtdC5tb2RpZmllcnMgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAhc3RtdC5tb2RpZmllcnMuc29tZShtb2QgPT4gbW9kLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXhwb3J0S2V5d29yZCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSXQgbXVzdCBkZWNsYXJlIElUU19KVVNUX0FOR1VMQVIuXG4gICAgcmV0dXJuIHN0bXQuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9ucy5zb21lKGRlY2wgPT4ge1xuICAgICAgLy8gVGhlIGRlY2xhcmF0aW9uIG11c3QgbWF0Y2ggdGhlIG5hbWUuXG4gICAgICBpZiAoIXRzLmlzSWRlbnRpZmllcihkZWNsLm5hbWUpIHx8IGRlY2wubmFtZS50ZXh0ICE9PSAnSVRTX0pVU1RfQU5HVUxBUicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSXQgbXVzdCBpbml0aWFsaXplIHRoZSB2YXJpYWJsZSB0byB0cnVlLlxuICAgICAgaWYgKGRlY2wuaW5pdGlhbGl6ZXIgPT09IHVuZGVmaW5lZCB8fCBkZWNsLmluaXRpYWxpemVyLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gVGhpcyBkZWZpbml0aW9uIG1hdGNoZXMuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgJ3IzX3N5bWJvbHMudHMnIGZpbGUgaW4gdGhlIGdpdmVuIGBQcm9ncmFtYCwgb3IgcmV0dXJuIGBudWxsYCBpZiBpdCB3YXNuJ3QgdGhlcmUuXG4gKi9cbmZ1bmN0aW9uIGdldFIzU3ltYm9sc0ZpbGUocHJvZ3JhbTogdHMuUHJvZ3JhbSk6IHRzLlNvdXJjZUZpbGV8bnVsbCB7XG4gIHJldHVybiBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmluZChmaWxlID0+IGZpbGUuZmlsZU5hbWUuaW5kZXhPZigncjNfc3ltYm9scy50cycpID49IDApIHx8IG51bGw7XG59XG5cbi8qKlxuICogU3ltYm9sIHVuZGVyIHdoaWNoIHRoZSBgSW5jcmVtZW50YWxEcml2ZXJgIGlzIHN0b3JlZCBvbiBhIGB0cy5Qcm9ncmFtYC5cbiAqXG4gKiBUaGUgVFMgbW9kZWwgb2YgaW5jcmVtZW50YWwgY29tcGlsYXRpb24gaXMgYmFzZWQgYXJvdW5kIHJldXNlIG9mIGEgcHJldmlvdXMgYHRzLlByb2dyYW1gIGluIHRoZVxuICogY29uc3RydWN0aW9uIG9mIGEgbmV3IG9uZS4gVGhlIGBOZ0NvbXBpbGVyYCBmb2xsb3dzIHRoaXMgYWJzdHJhY3Rpb24gLSBwYXNzaW5nIGluIGEgcHJldmlvdXNcbiAqIGB0cy5Qcm9ncmFtYCBpcyBzdWZmaWNpZW50IHRvIHRyaWdnZXIgaW5jcmVtZW50YWwgY29tcGlsYXRpb24uIFRoaXMgcHJldmlvdXMgYHRzLlByb2dyYW1gIG5lZWRcbiAqIG5vdCBiZSBmcm9tIGFuIEFuZ3VsYXIgY29tcGlsYXRpb24gKHRoYXQgaXMsIGl0IG5lZWQgbm90IGhhdmUgYmVlbiBjcmVhdGVkIGZyb20gYE5nQ29tcGlsZXJgKS5cbiAqXG4gKiBJZiBpdCBpcywgdGhvdWdoLCBBbmd1bGFyIGNhbiBiZW5lZml0IGZyb20gcmV1c2luZyBwcmV2aW91cyBhbmFseXNpcyB3b3JrLiBUaGlzIHJldXNlIGlzIG1hbmFnZWRcbiAqIGJ5IHRoZSBgSW5jcmVtZW50YWxEcml2ZXJgLCB3aGljaCBpcyBpbmhlcml0ZWQgZnJvbSB0aGUgb2xkIHByb2dyYW0gdG8gdGhlIG5ldyBwcm9ncmFtLiBUb1xuICogc3VwcG9ydCB0aGlzIGJlaGluZCB0aGUgQVBJIG9mIHBhc3NpbmcgYW4gb2xkIGB0cy5Qcm9ncmFtYCwgdGhlIGBJbmNyZW1lbnRhbERyaXZlcmAgaXMgc3RvcmVkIG9uXG4gKiB0aGUgYHRzLlByb2dyYW1gIHVuZGVyIHRoaXMgc3ltYm9sLlxuICovXG5jb25zdCBTWU1fSU5DUkVNRU5UQUxfRFJJVkVSID0gU3ltYm9sKCdOZ0luY3JlbWVudGFsRHJpdmVyJyk7XG5cbi8qKlxuICogR2V0IGFuIGBJbmNyZW1lbnRhbERyaXZlcmAgZnJvbSB0aGUgZ2l2ZW4gYHRzLlByb2dyYW1gIGlmIG9uZSBpcyBwcmVzZW50LlxuICpcbiAqIFNlZSBgU1lNX0lOQ1JFTUVOVEFMX0RSSVZFUmAgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuZnVuY3Rpb24gZ2V0SW5jcmVtZW50YWxEcml2ZXIocHJvZ3JhbTogdHMuUHJvZ3JhbSk6IEluY3JlbWVudGFsRHJpdmVyfG51bGwge1xuICBjb25zdCBkcml2ZXIgPSAocHJvZ3JhbSBhcyBhbnkpW1NZTV9JTkNSRU1FTlRBTF9EUklWRVJdO1xuICBpZiAoZHJpdmVyID09PSB1bmRlZmluZWQgfHwgIShkcml2ZXIgaW5zdGFuY2VvZiBJbmNyZW1lbnRhbERyaXZlcikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZHJpdmVyO1xufVxuXG4vKipcbiAqIFNhdmUgdGhlIGdpdmVuIGBJbmNyZW1lbnRhbERyaXZlcmAgb250byB0aGUgZ2l2ZW4gYHRzLlByb2dyYW1gLCBmb3IgcmV0cmlldmFsIGluIGEgc3Vic2VxdWVudFxuICogaW5jcmVtZW50YWwgY29tcGlsYXRpb24uXG4gKlxuICogU2VlIGBTWU1fSU5DUkVNRU5UQUxfRFJJVkVSYCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5mdW5jdGlvbiBzZXRJbmNyZW1lbnRhbERyaXZlcihwcm9ncmFtOiB0cy5Qcm9ncmFtLCBkcml2ZXI6IEluY3JlbWVudGFsRHJpdmVyKTogdm9pZCB7XG4gIChwcm9ncmFtIGFzIGFueSlbU1lNX0lOQ1JFTUVOVEFMX0RSSVZFUl0gPSBkcml2ZXI7XG59XG5cbi8qKlxuICogU2luY2UgXCJzdHJpY3RUZW1wbGF0ZXNcIiBpcyBhIHRydWUgc3VwZXJzZXQgb2YgdHlwZSBjaGVja2luZyBjYXBhYmlsaXRpZXMgY29tcGFyZWQgdG9cbiAqIFwic3RyaWN0VGVtcGxhdGVUeXBlQ2hlY2tcIiwgaXQgaXMgcmVxdWlyZWQgdGhhdCB0aGUgbGF0dGVyIGlzIG5vdCBleHBsaWNpdGx5IGRpc2FibGVkIGlmIHRoZVxuICogZm9ybWVyIGlzIGVuYWJsZWQuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmeUNvbXBhdGlibGVUeXBlQ2hlY2tPcHRpb25zKG9wdGlvbnM6IE5nQ29tcGlsZXJPcHRpb25zKTogdHMuRGlhZ25vc3RpY3xudWxsIHtcbiAgaWYgKG9wdGlvbnMuZnVsbFRlbXBsYXRlVHlwZUNoZWNrID09PSBmYWxzZSAmJiBvcHRpb25zLnN0cmljdFRlbXBsYXRlcyA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgY29kZTogbmdFcnJvckNvZGUoRXJyb3JDb2RlLkNPTkZJR19TVFJJQ1RfVEVNUExBVEVTX0lNUExJRVNfRlVMTF9URU1QTEFURV9UWVBFQ0hFQ0spLFxuICAgICAgZmlsZTogdW5kZWZpbmVkLFxuICAgICAgc3RhcnQ6IHVuZGVmaW5lZCxcbiAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxuICAgICAgbWVzc2FnZVRleHQ6XG4gICAgICAgICAgYEFuZ3VsYXIgY29tcGlsZXIgb3B0aW9uIFwic3RyaWN0VGVtcGxhdGVzXCIgaXMgZW5hYmxlZCwgaG93ZXZlciBcImZ1bGxUZW1wbGF0ZVR5cGVDaGVja1wiIGlzIGRpc2FibGVkLlxuXG5IYXZpbmcgdGhlIFwic3RyaWN0VGVtcGxhdGVzXCIgZmxhZyBlbmFibGVkIGltcGxpZXMgdGhhdCBcImZ1bGxUZW1wbGF0ZVR5cGVDaGVja1wiIGlzIGFsc28gZW5hYmxlZCwgc29cbnRoZSBsYXR0ZXIgY2FuIG5vdCBiZSBleHBsaWNpdGx5IGRpc2FibGVkLlxuXG5PbmUgb2YgdGhlIGZvbGxvd2luZyBhY3Rpb25zIGlzIHJlcXVpcmVkOlxuMS4gUmVtb3ZlIHRoZSBcImZ1bGxUZW1wbGF0ZVR5cGVDaGVja1wiIG9wdGlvbi5cbjIuIFJlbW92ZSBcInN0cmljdFRlbXBsYXRlc1wiIG9yIHNldCBpdCB0byAnZmFsc2UnLlxuXG5Nb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSB0ZW1wbGF0ZSB0eXBlIGNoZWNraW5nIGNvbXBpbGVyIG9wdGlvbnMgY2FuIGJlIGZvdW5kIGluIHRoZSBkb2N1bWVudGF0aW9uOlxuaHR0cHM6Ly92OS5hbmd1bGFyLmlvL2d1aWRlL3RlbXBsYXRlLXR5cGVjaGVjayN0ZW1wbGF0ZS10eXBlLWNoZWNraW5nYCxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNsYXNzIFJlZmVyZW5jZUdyYXBoQWRhcHRlciBpbXBsZW1lbnRzIFJlZmVyZW5jZXNSZWdpc3RyeSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZ3JhcGg6IFJlZmVyZW5jZUdyYXBoKSB7fVxuXG4gIGFkZChzb3VyY2U6IHRzLkRlY2xhcmF0aW9uLCAuLi5yZWZlcmVuY2VzOiBSZWZlcmVuY2U8dHMuRGVjbGFyYXRpb24+W10pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHtub2RlfSBvZiByZWZlcmVuY2VzKSB7XG4gICAgICBsZXQgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgaWYgKHNvdXJjZUZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzb3VyY2VGaWxlID0gdHMuZ2V0T3JpZ2luYWxOb2RlKG5vZGUpLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSByZWNvcmQgbG9jYWwgcmVmZXJlbmNlcyAobm90IHJlZmVyZW5jZXMgaW50byAuZC50cyBmaWxlcykuXG4gICAgICBpZiAoc291cmNlRmlsZSA9PT0gdW5kZWZpbmVkIHx8ICFpc0R0c1BhdGgoc291cmNlRmlsZS5maWxlTmFtZSkpIHtcbiAgICAgICAgdGhpcy5ncmFwaC5hZGQoc291cmNlLCBub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==