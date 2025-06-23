import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const isWatch = process.argv.includes("--watch");

// Read manifest
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));

// Ensure dist directory exists
if (!existsSync("dist")) {
    mkdirSync("dist", { recursive: true });
}

// Build the plugin
const buildPlugin = async () => {
    try {
        const result = await build({
            entryPoints: ["src/index.tsx"],
            bundle: true,
            format: "iife",
            globalName: "RevengeStalker",
            outfile: "dist/index.js",
            external: [
                "react", 
                "react-native",
                "@vendetta/*",
                "@vendetta/metro",
                "@vendetta/metro/*",
                "@vendetta/plugin",
                "@vendetta/storage",
                "@vendetta/ui",
                "@vendetta/ui/*",
                "@vendetta/utils"
            ],
            define: {
                "process.env.NODE_ENV": '"production"'
            },
            minify: true,
            sourcemap: false,
            target: "es2020",
            loader: {
                ".tsx": "tsx",
                ".ts": "ts"
            }
        });

        if (result.errors.length > 0) {
            console.error("Build errors:", result.errors);
            process.exit(1);
        }

        // Copy manifest to dist
        writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));

        // Create plugin URL for easy installation
        const pluginUrl = `https://${process.env.GITHUB_REPOSITORY?.split("/")[1] || "your-username"}.github.io/${process.env.GITHUB_REPOSITORY?.split("/")[1] || "revenge-stalker"}/index.js`;
        
        // Create installation instructions
        const installInstructions = `# Installation

## For Revenge/Vendetta/Bunny:

1. Open your Revenge/Vendetta/Bunny client
2. Go to Settings → Plugins
3. Add this URL: \`${pluginUrl}\`
4. Enable the plugin
5. Configure settings as needed

## Manual Installation:

1. Download the \`index.js\` file from this repository
2. Place it in your plugins directory
3. Enable the plugin in your client settings

## Plugin URL:
\`${pluginUrl}\``;

        writeFileSync("dist/INSTALL.md", installInstructions);

        console.log("✅ Plugin built successfully!");
        console.log(`📦 Output: dist/index.js`);
        console.log(`🔗 Plugin URL: ${pluginUrl}`);
        
        if (isWatch) {
            console.log("👀 Watching for changes...");
        }
    } catch (error) {
        console.error("❌ Build failed:", error);
        process.exit(1);
    }
};

// Run build
buildPlugin();

// Watch mode
if (isWatch) {
    const chokidar = await import("chokidar");
    const watcher = chokidar.default.watch(["src/**/*", "manifest.json"], {
        ignored: /node_modules/,
        persistent: true
    });

    watcher.on("change", (path) => {
        console.log(`🔄 File changed: ${path}`);
        buildPlugin();
    });
} 