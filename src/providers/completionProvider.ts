import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getLaravelConfig, getFilesRecursively } from '../utils/laravelUtils';

/**
 * Register all completion providers
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
export function registerCompletionProviders(context: vscode.ExtensionContext, laravelRoot: string) {
    const config = getLaravelConfig(laravelRoot);
    
    // Register PHP completion provider
    const phpSelector = { language: 'php', scheme: 'file' };
    const phpCompletionProvider = vscode.languages.registerCompletionItemProvider(
        phpSelector,
        new LaravelCompletionProvider(config),
        '.', ':', '>'
    );
    
    // Register Blade completion provider
    const bladeSelector = { language: 'blade', scheme: 'file' };
    const bladeCompletionProvider = vscode.languages.registerCompletionItemProvider(
        bladeSelector,
        new LaravelCompletionProvider(config),
        '.', ':', '>'
    );
    
    context.subscriptions.push(phpCompletionProvider, bladeCompletionProvider);
}

/**
 * Laravel completion provider
 */
class LaravelCompletionProvider implements vscode.CompletionItemProvider {
    private config: any;
    private models: string[] = [];
    private controllers: string[] = [];
    private views: string[] = [];
    private routes: Map<string, string> = new Map();
    
    constructor(config: any) {
        this.config = config;
        this.initialize();
    }
    
    /**
     * Initialize the provider by scanning the Laravel project
     */
    private initialize() {
        // Scan models
        this.scanModels();
        
        // Scan controllers
        this.scanControllers();
        
        // Scan views
        this.scanViews();
        
        // Scan routes
        this.scanRoutes();
    }
    
    /**
     * Scan Laravel models
     */
    private scanModels() {
        try {
            const modelsPath = this.config.modelsPath;
            if (fs.existsSync(modelsPath)) {
                const modelFiles = getFilesRecursively(modelsPath, '**/*.php');
                
                for (const file of modelFiles) {
                    const relativePath = path.relative(modelsPath, file);
                    const modelName = path.basename(relativePath, '.php');
                    this.models.push(modelName);
                }
            }
        } catch (error) {
            console.error('Error scanning models:', error);
        }
    }
    
    /**
     * Scan Laravel controllers
     */
    private scanControllers() {
        try {
            const controllersPath = this.config.controllersPath;
            if (fs.existsSync(controllersPath)) {
                const controllerFiles = getFilesRecursively(controllersPath, '**/*.php');
                
                for (const file of controllerFiles) {
                    const relativePath = path.relative(controllersPath, file);
                    const controllerName = path.basename(relativePath, '.php');
                    this.controllers.push(controllerName);
                }
            }
        } catch (error) {
            console.error('Error scanning controllers:', error);
        }
    }
    
    /**
     * Scan Laravel views
     */
    private scanViews() {
        try {
            const viewsPath = this.config.viewsPath;
            if (fs.existsSync(viewsPath)) {
                const viewFiles = getFilesRecursively(viewsPath, '**/*.blade.php');
                
                for (const file of viewFiles) {
                    const relativePath = path.relative(viewsPath, file);
                    const viewName = relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                    this.views.push(viewName);
                }
            }
        } catch (error) {
            console.error('Error scanning views:', error);
        }
    }
    
    /**
     * Scan Laravel routes
     */
    private scanRoutes() {
        try {
            const routesPath = this.config.routesPath;
            if (fs.existsSync(routesPath)) {
                const webRoutesPath = path.join(routesPath, 'web.php');
                const apiRoutesPath = path.join(routesPath, 'api.php');
                
                if (fs.existsSync(webRoutesPath)) {
                    this.parseRouteFile(webRoutesPath, 'web');
                }
                
                if (fs.existsSync(apiRoutesPath)) {
                    this.parseRouteFile(apiRoutesPath, 'api');
                }
            }
        } catch (error) {
            console.error('Error scanning routes:', error);
        }
    }
    
    /**
     * Parse a route file to extract route names
     * @param filePath Route file path
     * @param prefix Route prefix
     */
    private parseRouteFile(filePath: string, prefix: string) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Simple regex to find route names
            // This is a basic implementation and might not catch all routes
            const routeNameRegex = /->name\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            let match;
            
            while ((match = routeNameRegex.exec(content)) !== null) {
                const routeName = match[1];
                this.routes.set(routeName, `${prefix}:${routeName}`);
            }
        } catch (error) {
            console.error(`Error parsing route file ${filePath}:`, error);
        }
    }
    
    /**
     * Provide completion items
     */
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        
        // Check for view() function
        if (linePrefix.match(/view\s*\(\s*['"]$/)) {
            return this.provideViewCompletions();
        }
        
        // Check for route() function
        if (linePrefix.match(/route\s*\(\s*['"]$/)) {
            return this.provideRouteCompletions();
        }
        
        // Check for model references
        if (linePrefix.match(/\\App\\Models\\$/)) {
            return this.provideModelCompletions();
        }
        
        // Check for controller references
        if (linePrefix.match(/\\App\\Http\\Controllers\\$/)) {
            return this.provideControllerCompletions();
        }
        
        return null;
    }
    
    /**
     * Provide view completions
     */
    private provideViewCompletions(): vscode.CompletionItem[] {
        return this.views.map(view => {
            const item = new vscode.CompletionItem(view, vscode.CompletionItemKind.File);
            item.detail = 'Blade View';
            item.documentation = `View file: ${view}.blade.php`;
            return item;
        });
    }
    
    /**
     * Provide route completions
     */
    private provideRouteCompletions(): vscode.CompletionItem[] {
        return Array.from(this.routes.keys()).map(route => {
            const item = new vscode.CompletionItem(route, vscode.CompletionItemKind.Reference);
            item.detail = 'Route';
            item.documentation = `Route: ${this.routes.get(route)}`;
            return item;
        });
    }
    
    /**
     * Provide model completions
     */
    private provideModelCompletions(): vscode.CompletionItem[] {
        return this.models.map(model => {
            const item = new vscode.CompletionItem(model, vscode.CompletionItemKind.Class);
            item.detail = 'Laravel Model';
            item.documentation = `Model: ${model}`;
            return item;
        });
    }
    
    /**
     * Provide controller completions
     */
    private provideControllerCompletions(): vscode.CompletionItem[] {
        return this.controllers.map(controller => {
            const item = new vscode.CompletionItem(controller, vscode.CompletionItemKind.Class);
            item.detail = 'Laravel Controller';
            item.documentation = `Controller: ${controller}`;
            return item;
        });
    }
}
