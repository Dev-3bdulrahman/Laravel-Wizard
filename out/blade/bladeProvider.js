"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBladeSupport = registerBladeSupport;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const laravelUtils_1 = require("../utils/laravelUtils");
/**
 * Register Blade support
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
function registerBladeSupport(context, laravelRoot) {
    const config = (0, laravelUtils_1.getLaravelConfig)(laravelRoot);
    // Register Blade completion provider
    const bladeSelector = { language: 'blade', scheme: 'file' };
    const bladeCompletionProvider = vscode.languages.registerCompletionItemProvider(bladeSelector, new BladeCompletionProvider(config), '@', '{', '}');
    // Register Blade hover provider
    const bladeHoverProvider = vscode.languages.registerHoverProvider(bladeSelector, new BladeHoverProvider(config));
    context.subscriptions.push(bladeCompletionProvider, bladeHoverProvider);
}
/**
 * Blade completion provider
 */
class BladeCompletionProvider {
    config;
    bladeDirectives = [
        'if', 'elseif', 'else', 'endif',
        'foreach', 'endforeach',
        'forelse', 'empty', 'endforelse',
        'for', 'endfor',
        'while', 'endwhile',
        'switch', 'case', 'default', 'endswitch',
        'section', 'endsection',
        'yield',
        'extends',
        'include', 'includeIf', 'includeWhen', 'includeFirst',
        'component', 'endcomponent',
        'slot', 'endslot',
        'push', 'endpush',
        'stack',
        'once', 'endonce',
        'auth', 'endauth',
        'guest', 'endguest',
        'can', 'endcan',
        'cannot', 'endcannot',
        'canany', 'endcanany',
        'csrf',
        'method',
        'error',
        'php', 'endphp',
        'json',
        'dd',
        'livewire',
        'filament'
    ];
    components = new Map();
    constructor(config) {
        this.config = config;
        this.scanComponents();
    }
    /**
     * Scan Blade components
     */
    scanComponents() {
        try {
            const componentsPath = path.join(this.config.viewsPath, 'components');
            if (fs.existsSync(componentsPath)) {
                const componentFiles = (0, laravelUtils_1.getFilesRecursively)(componentsPath, '**/*.blade.php');
                for (const file of componentFiles) {
                    const relativePath = path.relative(componentsPath, file);
                    const componentName = relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                    this.components.set(componentName, file);
                }
            }
        }
        catch (error) {
            console.error('Error scanning components:', error);
        }
    }
    /**
     * Provide completion items
     */
    provideCompletionItems(document, position, token, context) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        // Check for Blade directive
        if (linePrefix.endsWith('@')) {
            return this.provideDirectiveCompletions();
        }
        // Check for Blade component
        if (linePrefix.match(/<x-$/)) {
            return this.provideComponentCompletions();
        }
        // Check for Blade component slot
        if (linePrefix.match(/<x-slot:$/)) {
            return this.provideSlotCompletions();
        }
        return null;
    }
    /**
     * Provide Blade directive completions
     */
    provideDirectiveCompletions() {
        return this.bladeDirectives.map(directive => {
            const item = new vscode.CompletionItem(directive, vscode.CompletionItemKind.Keyword);
            item.detail = 'Blade Directive';
            item.documentation = `Blade @${directive} directive`;
            // Add snippet for directives that need closing
            if (['if', 'foreach', 'forelse', 'for', 'while', 'switch', 'section', 'component', 'slot', 'push', 'once', 'auth', 'guest', 'can', 'cannot', 'canany', 'php'].includes(directive)) {
                item.insertText = new vscode.SnippetString(`${directive}($1)\n\t$2\n@end${directive}`);
            }
            return item;
        });
    }
    /**
     * Provide Blade component completions
     */
    provideComponentCompletions() {
        return Array.from(this.components.keys()).map(component => {
            const item = new vscode.CompletionItem(component, vscode.CompletionItemKind.Class);
            item.detail = 'Blade Component';
            item.documentation = `Blade component: ${component}`;
            item.insertText = new vscode.SnippetString(`${component} $1>\n\t$2\n</x-${component}>`);
            return item;
        });
    }
    /**
     * Provide Blade slot completions
     */
    provideSlotCompletions() {
        // This is a simplified implementation
        // In a real-world scenario, we would parse the component to find available slots
        const commonSlots = ['header', 'content', 'footer', 'title', 'description'];
        return commonSlots.map(slot => {
            const item = new vscode.CompletionItem(slot, vscode.CompletionItemKind.Property);
            item.detail = 'Blade Slot';
            item.documentation = `Blade slot: ${slot}`;
            item.insertText = new vscode.SnippetString(`${slot}>\n\t$1\n</x-slot>`);
            return item;
        });
    }
}
/**
 * Blade hover provider
 */
class BladeHoverProvider {
    config;
    directiveDocumentation = new Map([
        ['if', 'Conditional statement in Blade templates.'],
        ['foreach', 'Loop through an array or collection.'],
        ['forelse', 'Loop through an array or collection with an empty fallback.'],
        ['for', 'Traditional for loop in Blade templates.'],
        ['while', 'While loop in Blade templates.'],
        ['section', 'Define a section of content.'],
        ['yield', 'Display the contents of a given section.'],
        ['extends', 'Specify the layout a child view should inherit.'],
        ['include', 'Include a view within another view.'],
        ['component', 'Render a component.'],
        ['slot', 'Define a slot within a component.'],
        ['csrf', 'Generate a CSRF token field.'],
        ['method', 'Generate a hidden input field for spoofing HTTP methods.'],
        ['error', 'Display validation errors.'],
        ['auth', 'Display content only for authenticated users.'],
        ['guest', 'Display content only for guests.'],
        ['livewire', 'Render a Livewire component.'],
        ['filament', 'Render a Filament component.']
    ]);
    constructor(config) {
        this.config = config;
    }
    /**
     * Provide hover information
     */
    provideHover(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        const word = document.getText(wordRange);
        const line = document.lineAt(position.line).text;
        // Check for Blade directive
        const directiveMatch = line.match(/@([a-zA-Z]+)/);
        if (directiveMatch && this.isPositionInRange(position, directiveMatch.index || 0, directiveMatch[0].length)) {
            const directive = directiveMatch[1];
            return this.getDirectiveHover(directive);
        }
        // Check for Blade component
        const componentMatch = line.match(/<x-([a-zA-Z0-9._-]+)/);
        if (componentMatch && this.isPositionInRange(position, componentMatch.index || 0, componentMatch[0].length)) {
            const component = componentMatch[1];
            return this.getComponentHover(component);
        }
        return null;
    }
    /**
     * Check if position is within a range in the line
     */
    isPositionInRange(position, startIndex, length) {
        return position.character >= startIndex && position.character <= startIndex + length;
    }
    /**
     * Get hover information for a Blade directive
     */
    getDirectiveHover(directive) {
        const documentation = this.directiveDocumentation.get(directive);
        if (documentation) {
            return new vscode.Hover([
                new vscode.MarkdownString(`**@${directive}**`),
                new vscode.MarkdownString(documentation)
            ]);
        }
        return null;
    }
    /**
     * Get hover information for a Blade component
     */
    getComponentHover(component) {
        return new vscode.Hover([
            new vscode.MarkdownString(`**<x-${component}>**`),
            new vscode.MarkdownString(`Blade component: ${component}`)
        ]);
    }
}
//# sourceMappingURL=bladeProvider.js.map